import React from 'react';

import { useFileList } from '../hooks/useFileList';

interface DynamicFileDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filter?: (filename: string) => boolean;
  className?: string;
  label?: string;
}

const DynamicFileDropdown: React.FC<DynamicFileDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select a file...",
  filter,
  className = "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700",
  label
}) => {
  const { files, loading, error } = useFileList();

  const filteredFiles = filter ? files.filter(filter) : files;

  if (loading) {
    return (
      <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <select disabled className={className}>
          <option>🔄 Loading files...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <select disabled className={className}>
          <option>❌ Error loading files</option>
        </select>
        <div className="text-xs text-red-600 mt-1">{error}</div>
      </div>
    );
  }

  const getFileDescription = (filename: string) => {
    // Add descriptions for known files
    const descriptions: { [key: string]: string } = {
      'upload1.xlsx': '(53 rows, Transaction data)',
      'upload2.xlsx': '(82 rows, Client data)',
      'Correct.xlsx': '(31 rows)',
      'Sales Totals.xlsx': '(20 rows)',
      'Payments Hub Transaction.xlsx': '(23 rows)',
      'incorrect-results.csv': '(CSV format)',
      'generated-reconciliation-script.js': '(JavaScript)',
      'ClaudeVersion.txt': '(Text file)',
      'Cursor.txt': '(Text file)'
    };
    
    return descriptions[filename] || '';
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label} 🔄 Dynamic</label>}
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        <option value="">{placeholder}</option>
        {filteredFiles.map((filename) => (
          <option key={filename} value={filename}>
            {filename} {getFileDescription(filename)}
          </option>
        ))}
      </select>
      <div className="text-xs text-emerald-600 mt-1">
        ✅ {filteredFiles.length} files detected dynamically
      </div>
    </div>
  );
};

export default DynamicFileDropdown; 