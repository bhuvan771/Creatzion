'use client';

export function TransactionTable({ transactions, total, count }) {
  return (
    <div className="w-full my-2 overflow-x-auto">
      <div className="bg-gray-900 text-white px-3 py-2 rounded-t-lg font-bold text-center text-sm border-2 border-gray-900">
        YOUR TRANSACTIONS ({count} found)
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-lg text-xs border-2 border-gray-900">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-2 py-2 text-left font-bold border-2 border-gray-700 whitespace-nowrap">Date</th>
              <th className="px-2 py-2 text-left font-bold border-2 border-gray-700">Description</th>
              <th className="px-2 py-2 text-right font-bold border-2 border-gray-700 whitespace-nowrap">Amount</th>
              <th className="px-2 py-2 text-left font-bold border-2 border-gray-700">Category</th>
              <th className="px-2 py-2 text-center font-bold border-2 border-gray-700 whitespace-nowrap">Recurring</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => {
              const date = new Date(t.date).toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              });
              const isRecurring = t.isRecurring;
              const recurringText = isRecurring ? t.recurringInterval || 'Yes' : 'No';
              
              return (
                <tr 
                  key={idx} 
                  className={`${
                    idx % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                  } hover:bg-gray-200 transition-colors`}
                >
                  <td className="px-2 py-2 border-2 border-gray-400 whitespace-nowrap font-semibold">{date}</td>
                  <td className="px-2 py-2 border-2 border-gray-400 font-bold">{t.description || 'No description'}</td>
                  <td className="px-2 py-2 text-right border-2 border-gray-400 font-bold whitespace-nowrap">
                    ₹{Number(t.amount).toFixed(2)}
                  </td>
                  <td className="px-2 py-2 border-2 border-gray-400 font-semibold">
                    {t.category || 'Uncategorized'}
                  </td>
                  <td className="px-2 py-2 text-center border-2 border-gray-400 font-semibold">
                    {recurringText}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-900 text-white">
              <td colSpan="2" className="px-2 py-2 font-bold border-2 border-gray-900">
                TOTAL
              </td>
              <td className="px-2 py-2 text-right font-bold border-2 border-gray-900">
                ₹{Number(total).toFixed(2)}
              </td>
              <td colSpan="2" className="px-2 py-2 text-right font-bold border-2 border-gray-900">
                {count} transaction{count !== 1 ? 's' : ''}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
