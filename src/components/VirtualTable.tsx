import React, { useState, useMemo, useCallback } from 'react';

import { VirtualTableData } from '../types';

interface VirtualTableProps {
  data: VirtualTableData[];
  maxRows?: number;
  className?: string;
}

const VirtualTable: React.FC<VirtualTableProps> = React.memo(({ 
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
      <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
        No data to display
      </div>
    );
  }

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {/* Performance info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600 px-2">
        <div className="text-xs sm:text-sm">
          Showing {visibleData.length} of {paginationInfo.showingRows} rows
          {paginationInfo.totalRows > maxRows && (
            <span className="text-gray-500 block sm:inline sm:ml-2">
              ({paginationInfo.totalRows - maxRows} more rows available)
            </span>
          )}
        </div>
        <div className="text-xs bg-gray-100 px-2 py-1 rounded self-start sm:self-auto">
          ⚡ Optimized view
        </div>
      </div>

      {/* Virtual scrolled table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={`${col}-${index}`}
                  className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 border-b border-gray-200 whitespace-nowrap"
                >
                  <div className="truncate max-w-[100px] sm:max-w-none" title={String(col)}>
                    {String(col)}
                  </div>
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
                    className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm"
                    title={String(row[col] || '')}
                  >
                    <div className="truncate max-w-[80px] sm:max-w-xs">
                      {String(row[col] || '')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Page {currentPage + 1} of {paginationInfo.totalPages}
          </div>
          <div className="flex justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="min-w-[44px] min-h-[44px] px-2 sm:px-3 py-2 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">‹</span>
            </button>
            
            {/* Page numbers */}
            <div className="flex gap-1 overflow-x-auto">
              {Array.from({ length: Math.min(3, paginationInfo.totalPages) }, (_, i) => {
                const pageNumber = Math.max(0, Math.min(
                  paginationInfo.totalPages - 3,
                  currentPage - 1
                )) + i;
                
                if (pageNumber >= paginationInfo.totalPages) return null;
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`min-w-[44px] min-h-[44px] px-2 sm:px-3 py-2 sm:py-1 text-xs sm:text-sm border rounded transition-colors touch-manipulation flex-shrink-0 ${
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
              className="min-w-[44px] min-h-[44px] px-2 sm:px-3 py-2 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.data === nextProps.data &&
    prevProps.maxRows === nextProps.maxRows &&
    prevProps.className === nextProps.className
  );
});

VirtualTable.displayName = 'VirtualTable';

export default VirtualTable; 