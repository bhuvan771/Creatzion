"use client";
import * as Dialog from '@radix-ui/react-dialog';
import { Download } from 'lucide-react';
import logoBase64 from "@/utils/logo-base64"; // ✅ path to your base64 logo
import ExcelJS from "exceljs"
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ this is required!
import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { categoryColors } from "@/data/categories";
import { bulkDeleteTransactions } from "@/actions/accounts";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 10;

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function TransactionTable({ transactions }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

 const exportToExcel = async (data, initialBalance = 0) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transactions");

  sheet.properties.defaultRowHeight = 20;

  // Add logo
  const image = await fetch("/logo.png");
  const imageBlob = await image.blob();
  const imageBuffer = await imageBlob.arrayBuffer();
  const imageId = workbook.addImage({
    buffer: imageBuffer,
    extension: "png",
  });
  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 200, height: 60 },
  });

  // Title
  sheet.mergeCells("A5", "E5");
  const titleCell = sheet.getCell("A5");
  titleCell.value = "Transaction Report";
  titleCell.font = { size: 16, bold: true, color: { argb: "FF4F46E5" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  // Header Row
  sheet.addRow(["Date", "Description", "Category", "Amount", "Recurring"]);
  const headerRow = sheet.getRow(6);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF9333EA" },
  };

  // Data Rows
  let income = 0;
  let expense = 0;

  data.forEach((txn) => {
    const amountValue = txn.type === "EXPENSE"
      ? `-${txn.amount.toFixed(2)}`
      : `+${txn.amount.toFixed(2)}`;

    const row = sheet.addRow([
      format(new Date(txn.date), "PP"),
      txn.description,
      txn.category,
      amountValue,
      txn.isRecurring ? txn.recurringInterval : "One-time",
    ]);

    const amountCell = row.getCell(4);
    amountCell.font = {
      color: { argb: txn.type === "EXPENSE" ? "FFFF0000" : "FF00A300" },
      bold: true,
    };

    if (txn.type === "INCOME") income += txn.amount;
    if (txn.type === "EXPENSE") expense += txn.amount;
  });

  const totalIncome = income + initialBalance;
  const net = totalIncome - expense;

  // Summary
  sheet.addRow([]);
  sheet.addRow(["Initial Balance", initialBalance.toFixed(2)]);
  sheet.addRow(["Total Income (with Initial)", totalIncome.toFixed(2)]);
  sheet.addRow(["Total Expense", expense.toFixed(2)]);
  sheet.addRow(["Net Total", net.toFixed(2)]);

  sheet.columns.forEach((col) => {
    col.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "transactions.xlsx");
};


const exportToPDF = (data, initialBalance = 0) => {
  const doc = new jsPDF();

  doc.addImage(logoBase64, 'PNG', 80, 10, 50, 20);

  doc.setFontSize(16);
  doc.setTextColor("#4F46E5");
  doc.text("Transaction Report", 105, 35, { align: "center" });

  const rows = data.map((txn) => ([
    {
      content: format(new Date(txn.date), "PP"),
      styles: { fontSize: 9 },
    },
    txn.description,
    txn.category,
    {
      content: txn.type === "EXPENSE"
        ? `-${txn.amount.toFixed(2)}`
        : `+${txn.amount.toFixed(2)}`,
      styles: {
        textColor: txn.type === "EXPENSE" ? [255, 0, 0] : [0, 163, 0],
        fontStyle: 'bold',
      },
    },
    txn.isRecurring ? txn.recurringInterval : "One-time",
  ]));

  autoTable(doc, {
    startY: 45,
    head: [["Date", "Description", "Category", "Amount", "Recurring"]],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 243, 255],
    },
    styles: {
      cellPadding: 3,
      fontSize: 10,
    },
  });

  let income = 0;
  let expense = 0;

  data.forEach((txn) => {
    if (txn.type === "INCOME") income += txn.amount;
    if (txn.type === "EXPENSE") expense += txn.amount;
  });

  const totalIncome = income + initialBalance;
  const net = totalIncome - expense;

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Summary", "Amount"]],
    body: [
      ["Initial Balance", initialBalance.toFixed(2)],
      ["Total Income (with Initial)", totalIncome.toFixed(2)],
      ["Total Expense", expense.toFixed(2)],
      ["Net Total", net.toFixed(2)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    styles: { fontSize: 11 },
  });

  doc.save("transactions.pdf");
};

  
  
  
  const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");

const filterByDate = (txn) => {
  const txnDate = new Date(txn.date);
  const from = startDate ? new Date(startDate) : null;
  const to = endDate ? new Date(endDate) : null;

  return (
    (!from || txnDate >= from) &&
    (!to || txnDate <= to)
  );
};

  

  // Memoized filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (typeFilter) {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    // Apply recurring filter
    if (recurringFilter) {
      result = result.filter((transaction) => {
        if (recurringFilter === "recurring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / ITEMS_PER_PAGE
  );
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedTransactions, currentPage]);

  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === paginatedTransactions.length
        ? []
        : paginatedTransactions.map((t) => t.id)
    );
  };

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    )
      return;

    deleteFn(selectedIds);
  };

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.error("Transactions deleted successfully");
    }
  }, [deleted, deleteLoading]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedIds([]); // Clear selections on page change
  };

  return (
    <div className="space-y-4">
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
      <div className={`relative transition-all duration-300 ${
  selectedIds.length > 0 
    ? "sm:max-w-[300px]" 
    : "sm:max-w-[850px]"
} sm:min-w-[675px] flex-1`}>

      
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recurringFilter}
            onValueChange={(value) => {
              setRecurringFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring Only</SelectItem>
              <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
            </SelectContent>
          </Select>


          <Dialog.Root>
  <Dialog.Trigger asChild>
    <Button
      variant="outline"
      size="icon"
      title="Export"
      className="hover:bg-blue-100 text-blue-600"
    >
      <Download className="h-4 w-4" />
    </Button>
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
    <Dialog.Content className="fixed z-50 left-1/2 top-1/2 w-[90%] max-w-2xl md:max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-6 py-8 md:px-8 md:py-10 shadow-xl transition-all duration-300 space-y-6">


      
     {/* Header */}
<div className="flex items-center justify-between border-b pb-4">
  <div className="flex items-center space-x-2">
    <Download className="h-6 w-6 text-gray-800" />
    <Dialog.Title className="text-2xl font-semibold text-gray-800">
      Export Transactions
    </Dialog.Title>
  </div>
  <Dialog.Close asChild>
    <button className="text-gray-500 hover:text-gray-700 transition">
      <X className="h-6 w-6" />
    </button>
  </Dialog.Close>
</div>



      {/* Quick Month Select */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Month Select</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, idx) => {
            const year = new Date().getFullYear();
            const first = new Date(year, idx, 1).toISOString().split("T")[0];
            const last = new Date(year, idx + 1, 0).toISOString().split("T")[0];
            return (
              <button
                key={idx}
                onClick={() => {
                  setStartDate(first);
                  setEndDate(last);
                }}
                className="rounded-lg text-sm px-3 py-2 font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition"
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>

    {/* Custom Date Range */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* From Date */}
  <div className="w-full">
    <label className="text-sm font-semibold text-gray-700 mb-2 block">From</label>
    <Input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 min-h-[44px]"
    />
  </div>

  {/* To Date */}
  <div className="w-full">
    <label className="text-sm font-semibold text-gray-700 mb-2 block">To</label>
    <Input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 min-h-[44px]"
    />
  </div>
</div>



      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
      <button
  onClick={() => exportToExcel(filteredAndSortedTransactions.filter(filterByDate))}
  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
>
  📗 Download Excel
</button>
        <button
          onClick={() => exportToPDF(filteredAndSortedTransactions.filter(filterByDate))}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          📘 Download PDF
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>



          {/* Bulk Actions */}
{/* Mobile Only - Delete Button on Separate Line */}
{selectedIds.length > 0 && (
  <div className="flex sm:hidden w-full mt-2">
    <Button
      variant="destructive"
      size="sm"
      onClick={handleBulkDelete}
      className="w-full"
    >
      <Trash className="h-4 w-4 mr-2" />
      Delete Selected ({selectedIds.length})
    </Button>
  </div>
)}

{/* Desktop Only - Inline Delete Button */}
{selectedIds.length > 0 && (
  <div className="hidden sm:flex sm:w-auto sm:ml-0">
    <Button
      variant="destructive"
      size="sm"
      onClick={handleBulkDelete}
    >
      <Trash className="h-4 w-4 mr-2" />
      Delete Selected ({selectedIds.length})
    </Button>
  </div>
)}


          {(searchTerm || typeFilter || recurringFilter) && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              title="Clear filters"
            >
              <X className="h-4 w-5" />
            </Button>
          )}
        </div>
      </div>

     


    

      {/* Transactions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedIds.length === paginatedTransactions.length &&
                    paginatedTransactions.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelect(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="capitalize">
                    <span
                      style={{
                        background: categoryColors[transaction.category],
                      }}
                      className="px-2 py-1 rounded text-white text-sm"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      transaction.type === "EXPENSE"
                        ? "text-red-500"
                        : "text-green-500"
                    )}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}₹
                    {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              <RefreshCw className="h-3 w-3" />
                              {
                                RECURRING_INTERVALS[
                                  transaction.recurringInterval
                                ]
                              }
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Next Date:</div>
                              <div>
                                {format(
                                  new Date(transaction.nextRecurringDate),
                                  "PPP"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/transaction/create?edit=${transaction.id}`
                            )
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteFn([transaction.id])}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
