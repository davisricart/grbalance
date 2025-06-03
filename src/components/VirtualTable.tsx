import React, { useState, useMemo, useCallback } from 'react';

interface VirtualTableProps {
  data: any[];
  maxRows?: number;
  className?: string;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({ 
  data, 
  maxRows = 100, 
  className = '' 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Memoize columns for performance
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Memoize visible data for current page
  const visibleData = useMemo(() => {
    const limitedData = data.slice(0, maxRows);
    const startIdx = currentPage * pageSize;
    const endIdx = Math.min(startIdx + pageSize, limitedData.length);
    return limitedData.slice(startIdx, endIdx);
  }, [data, currentPage, pageSize, maxRows]);

  // Memoize pagination info
  const paginationInfo = useMemo(() => {
    const limitedData = data.slice(0, maxRows);
    const totalPages = Math.ceil(limitedData.length / pageSize);
    const totalRows = data.length;
    const showingRows = limitedData.length;
    
    return { totalPages, totalRows, showingRows };
  }, [data, pageSize, maxRows]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Performance info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {visibleData.length} of {paginationInfo.showingRows} rows
          {paginationInfo.totalRows > maxRows && (
            <span className="text-gray-500 ml-2">
              ({paginationInfo.totalRows - maxRows} more rows available)
            </span>
          )}
        </div>
        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
          ⚡ Optimized view
        </div>
      </div>

      {/* Virtual scrolled table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={`${col}-${index}`}
                  className="px-4 py-3 text-left font-medium text-gray-700 border-b border-gray-200"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {visibleData.map((row, rowIndex) => (
              <tr 
                key={`row-${currentPage}-${rowIndex}`}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {columns.map((col, colIndex) => (
                  <td 
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="px-4 py-3 text-gray-600 max-w-xs truncate"
                    title={String(row[col] || '')}
                  >
                    {String(row[col] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage + 1} of {paginationInfo.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                const pageNumber = Math.max(0, Math.min(
                  paginationInfo.totalPages - 5,
                  currentPage - 2
                )) + i;
                
                if (pageNumber >= paginationInfo.totalPages) return null;
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 text-sm border rounded transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber + 1}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(Math.min(paginationInfo.totalPages - 1, currentPage + 1))}
              disabled={currentPage >= paginationInfo.totalPages - 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 