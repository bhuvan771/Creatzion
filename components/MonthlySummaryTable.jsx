'use client';

export function MonthlySummaryTable({ transactions, year }) {
  // Group transactions by month
  const monthlyData = {};
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Initialize all months with 0
  monthNames.forEach((month, idx) => {
    monthlyData[idx] = { month, count: 0, total: 0 };
  });
  
  // Aggregate transactions by month
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthIndex = date.getMonth();
    monthlyData[monthIndex].count += 1;
    monthlyData[monthIndex].total += Number(t.amount);
  });
  
  // Convert to array and filter out months with no transactions
  const monthsWithData = Object.values(monthlyData).filter(m => m.count > 0);
  const grandTotal = monthsWithData.reduce((sum, m) => sum + m.total, 0);
  const totalTransactions = monthsWithData.reduce((sum, m) => sum + m.count, 0);
  
  return (
    <div className="w-full my-2 overflow-x-auto">
      <div className="bg-gray-900 text-white px-3 py-2 rounded-t-lg font-bold text-center text-sm border-2 border-gray-900">
        {year} MONTHLY SUMMARY ({totalTransactions} transactions)
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-lg text-xs border-2 border-gray-900">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-2 py-2 text-left font-bold border-2 border-gray-700">Month</th>
              <th className="px-2 py-2 text-right font-bold border-2 border-gray-700">Transactions</th>
              <th className="px-2 py-2 text-right font-bold border-2 border-gray-700">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {monthsWithData.map((m, idx) => (
              <tr 
                key={idx} 
                className={`${
                  idx % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                } hover:bg-gray-200 transition-colors`}
              >
                <td className="px-2 py-2 border-2 border-gray-400 font-bold">{m.month}</td>
                <td className="px-2 py-2 text-right border-2 border-gray-400 font-semibold">{m.count}</td>
                <td className="px-2 py-2 text-right border-2 border-gray-400 font-bold">
                  ₹{m.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-900 text-white">
              <td className="px-2 py-2 font-bold border-2 border-gray-900">
                TOTAL
              </td>
              <td className="px-2 py-2 text-right font-bold border-2 border-gray-900">
                {totalTransactions}
              </td>
              <td className="px-2 py-2 text-right font-bold border-2 border-gray-900">
                ₹{grandTotal.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
