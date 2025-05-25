// PAGE MARKER: Main Page Component
import React, { useState, useRef } from 'react';
import { User, signOut } from 'firebase/auth';
import { FileSpreadsheet, Download, AlertCircle, LogOut } from 'lucide-react';
import { doc, runTransaction } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { auth, db } from '../main';
import { useNavigate } from 'react-router-dom';

type ScriptKey = 'run5' | 'hubVsSalesCustom';

const SCRIPTS: Record<ScriptKey, string> = {
  run5: `
    function compareAndDisplayData(XLSX, file1, file2) {
      try {
        // Read workbooks with date parsing enabled
        const workbook1 = XLSX.read(file1, { cellDates: true });
        const workbook2 = XLSX.read(file2, { cellDates: true });
        
        // Get first sheet from each workbook
        const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
        const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
        
        // Convert sheets to JSON
        const data1 = XLSX.utils.sheet_to_json(sheet1);
        const data2 = XLSX.utils.sheet_to_json(sheet2);
        
        if (!data1.length || !data2.length) {
          throw new Error('One or both files are empty');
        }

        // Find the date column in the second file
        const dateColumn = Object.keys(data2[0]).find(key => 
          key.toLowerCase().includes('date')
        );

        // Define columns to keep from the filtered data
        const columnsToKeep = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand"];
        const newColumns = ["Total (-) Fee"];
        
        // Create result array starting with header
        const resultData = [columnsToKeep.concat(newColumns)];
        
        // Process each row of first file
        data1.forEach(row => {
          const filteredRow = [];
          let firstFileDate = null;
          let cardBrand = "";
          let krValue = 0;
          
          // Filter columns
          columnsToKeep.forEach(column => {
            if (column === "Date") {
              if (row[column] instanceof Date) {
                const date = row[column];
                firstFileDate = new Date(date);
                firstFileDate.setHours(0, 0, 0, 0);
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                filteredRow.push(\`\${month}/\${day}/\${year}\`);
              } else {
                filteredRow.push(row[column] !== undefined ? row[column] : "");
                if (row[column]) {
                  try {
                    firstFileDate = new Date(row[column]);
                    firstFileDate.setHours(0, 0, 0, 0);
                  } catch (e) {
                    firstFileDate = null;
                  }
                }
              }
            } else if (column === "Card Brand") {
              cardBrand = (row[column] || "").toString().toLowerCase();
              filteredRow.push(row[column] || "");
            } else {
              filteredRow.push(row[column] !== undefined ? row[column] : "");
            }
          });
          
          // Calculate K-R value (Total - Discount)
          const totalAmount = parseFloat(row["Total Transaction Amount"]) || 0;
          const discountAmount = parseFloat(row["Cash Discounting Amount"]) || 0;
          krValue = totalAmount - discountAmount;
          
          // Add K-R value
          filteredRow.push(krValue.toFixed(2));
          
          // Find matching transaction in second file
          let found = false;
          
          if (firstFileDate && cardBrand) {
            for (const secondRow of data2) {
              // Get date from second file
              let secondFileDate = null;
              if (dateColumn) {
                const dateValue = secondRow[dateColumn];
                if (dateValue instanceof Date) {
                  secondFileDate = new Date(dateValue);
                  secondFileDate.setHours(0, 0, 0, 0);
                } else if (typeof dateValue === 'string') {
                  try {
                    secondFileDate = new Date(dateValue);
                    secondFileDate.setHours(0, 0, 0, 0);
                  } catch (e) {
                    continue;
                  }
                }
              }
              
              // Skip if dates don't match
              if (!secondFileDate || secondFileDate.getTime() !== firstFileDate.getTime()) {
                continue;
              }
              
              // Get name and amount from second file
              const name = (secondRow["Name"] || "").toString().toLowerCase();
              const amount = parseFloat(secondRow["Amount"]) || 0;
              
              // Check if card brand matches name and amounts match
              if (
                (cardBrand.includes(name) || name.includes(cardBrand)) &&
                Math.abs(krValue - amount) < 0.01
              ) {
                found = true;
                break;
              }
            }
          }
          
          // Only add rows that don't have matches
          if (!found) {
            resultData.push(filteredRow);
          }
        });

        // Add summary section
        resultData.push(["", "", "", "", "", ""]);
        resultData.push(["Summary", "", "", "", "", ""]);
        resultData.push(["Card Brand", "Total Amount", "", "", "", ""]);

        // Calculate totals by card brand
        const cardBrandTotals = {};
        for (let i = 1; i < resultData.length - 3; i++) {
          const row = resultData[i];
          const cardBrand = row[4];
          const amount = parseFloat(row[5]) || 0;

          if (cardBrand && !cardBrand.toLowerCase().includes('cash')) {
            cardBrandTotals[cardBrand] = (cardBrandTotals[cardBrand] || 0) + amount;
          }
        }

        // Add card brand totals to results
        Object.entries(cardBrandTotals)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([brand, total]) => {
            resultData.push([brand, total.toFixed(2), "", "", "", ""]);
          });

        return resultData;
      } catch (error) {
        console.error('Error in comparison:', error);
        return [
          ['Error'],
          ['An error occurred while comparing the files:'],
          [error instanceof Error ? error.message : String(error)]
        ];
      }
    }
  `,
  hubVsSalesCustom: `
    function compareAndDisplayData(XLSX, file1, file2) {
      // --- Step 1: Process Payment Hub File ---
      const workbook1 = XLSX.read(file1, { cellDates: true });
      const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
      const data1 = XLSX.utils.sheet_to_json(sheet1, { defval: '' });
      
      // Columns to keep from Payment Hub
      const hubColumns = [
        "Date", "Transaction Source", "Transaction Type", "Account Number", "DBA", "Invoice", "Auth", "BRIC", "Sold By", "Customer Name", "Total Transaction Amount", "Payment Amount", "Authorized Amount", "Tip", "$ Discount", "% Discount", "$ Tax", "Cash Discounting Amount", "State Tax", "County Tax", "City Tax", "Custom Tax", "Payment Type", "Card Brand", "First 6", "Last 4", "Comment"
      ];
      // Key columns for analysis
      const keyHubCols = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand"];
      
      // --- Step 2: Process Sales Totals File ---
      const workbook2 = XLSX.read(file2, { cellDates: true });
      const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
      const data2 = XLSX.utils.sheet_to_json(sheet2, { defval: '' });
      
      // Find required columns in Sales Totals
      const salesCols = {
        date: Object.keys(data2[0] || {}).find(k => k.toLowerCase().includes('date')) || 'Date Closed',
        name: Object.keys(data2[0] || {}).find(k => k.toLowerCase().includes('name')) || 'Name',
        amount: Object.keys(data2[0] || {}).find(k => k.toLowerCase().includes('amount')) || 'Amount',
      };
      
      // Clean and prepare Payment Hub data
      const hubRows = data1.map(row => {
        // Format date
        let date = row["Date"];
        if (date instanceof Date) {
          date = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}/${date.getFullYear()}`;
        } else if (typeof date === 'string' && date) {
          const d = new Date(date);
          if (!isNaN(d)) date = `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}/${d.getFullYear()}`;
        }
        // Calculate Total (-) Fee
        const total = parseFloat(row["Total Transaction Amount"]) || 0;
        const discount = parseFloat(row["Cash Discounting Amount"]) || 0;
        const totalMinusFee = +(total - discount).toFixed(2);
        return {
          date,
          customer: row["Customer Name"] || '',
          total: +(+total).toFixed(2),
          discount: +(+discount).toFixed(2),
          brand: row["Card Brand"] || '',
          totalMinusFee,
        };
      });
      // Clean and prepare Sales Totals data
      const salesRows = data2.map(row => {
        // Format date
        let date = row[salesCols.date];
        if (date instanceof Date) {
          date = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}/${date.getFullYear()}`;
        } else if (typeof date === 'string' && date) {
          const d = new Date(date);
          if (!isNaN(d)) date = `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}/${d.getFullYear()}`;
        }
        // Clean amount
        let amount = row[salesCols.amount];
        if (typeof amount === 'string') amount = amount.replace(/[^\d.-]/g, '');
        amount = parseFloat(amount) || 0;
        return {
          date,
          name: row[salesCols.name] || '',
          amount: +(+amount).toFixed(2),
        };
      });
      // --- Step 3: First Matching Process (Count) ---
      function matchRows(hub, sales) {
        return sales.filter(s => {
          // Date match
          if (hub.date !== s.date) return false;
          // Name match (case-insensitive, partial)
          const hubBrand = (hub.brand || '').toLowerCase();
          const salesName = (s.name || '').toLowerCase();
          if (!(hubBrand.includes(salesName) || salesName.includes(hubBrand))) return false;
          // Amount match (within 1 cent)
          if (Math.abs(hub.totalMinusFee - s.amount) > 0.01) return false;
          return true;
        });
      }
      function matchRowsReverse(sale, hubs) {
        return hubs.filter(hub => {
          if (hub.date !== sale.date) return false;
          const hubBrand = (hub.brand || '').toLowerCase();
          const salesName = (sale.name || '').toLowerCase();
          if (!(hubBrand.includes(salesName) || salesName.includes(hubBrand))) return false;
          if (Math.abs(hub.totalMinusFee - sale.amount) > 0.01) return false;
          return true;
        });
      }
      // Add Count to hubRows
      hubRows.forEach(hub => {
        hub.count = matchRows(hub, salesRows).length;
      });
      // Add Count2 to salesRows
      salesRows.forEach(sale => {
        sale.count2 = matchRowsReverse(sale, hubRows).length;
      });
      // --- Step 5: Final Count Calculation ---
      hubRows.forEach(hub => {
        const matches = matchRows(hub, salesRows).filter(sale => sale.count2 === hub.count);
        hub.finalCount = matches.length;
      });
      // --- Step 6: Filter Unmatched Transactions ---
      const unmatched = hubRows.filter(hub => hub.finalCount === 0);
      // --- Step 7: Prepare Output Table ---
      const output = [];
      // Headers
      output.push(["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand", "Total (-) Fee"]);
      // Data rows
      unmatched.forEach(row => {
        output.push([
          row.date,
          row.customer,
          row.total,
          row.discount,
          row.brand,
          row.totalMinusFee
        ]);
      });
      // Two blank separator rows
      output.push(["", "", "", "", "", ""]);
      output.push(["", "", "", "", "", ""]);
      // --- Step 8: Card Brand Summary ---
      // Group Payment Hub by Card Brand
      const hubBrandTotals = {};
      hubRows.forEach(row => {
        const brand = row.brand || '';
        if (!brand.toLowerCase().includes('cash')) {
          hubBrandTotals[brand] = (hubBrandTotals[brand] || 0) + row.totalMinusFee;
        }
      });
      // Group Sales Totals by Name (map to card brands)
      const salesBrandTotals = {};
      salesRows.forEach(row => {
        const name = row.name || '';
        if (!name.toLowerCase().includes('cash')) {
          salesBrandTotals[name] = (salesBrandTotals[name] || 0) + row.amount;
        }
      });
      // Unique brands
      const allBrands = Array.from(new Set([
        ...Object.keys(hubBrandTotals),
        ...Object.keys(salesBrandTotals)
      ])).filter(b => b);
      // Card brand summary header
      output.push(["Card Brand", "Hub Report", "Sales Report", "Difference"]);
      // Card brand summary rows
      allBrands.forEach(brand => {
        const hubTotal = +(hubBrandTotals[brand] || 0).toFixed(2);
        const salesTotal = +(salesBrandTotals[brand] || 0).toFixed(2);
        const diff = +(hubTotal - salesTotal).toFixed(2);
        output.push([
          brand,
          hubTotal,
          salesTotal,
          diff
        ]);
      });
      return output;
    }
  `
};

interface MainPageProps {
  user: User;
}

type ResultRow = (string | number)[];

export default function MainPage({ user }: MainPageProps) {
  const navigate = useNavigate();
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [script, setScript] = useState<ScriptKey | ''>('');
  const [status, setStatus] = useState('');
  const [warning, setWarning] = useState('');
  const [results, setResults] = useState<ResultRow[]>([]);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setStatus('');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, setFile: (file: File | null) => void) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
      setStatus('');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const executeComparison = async (script: string, file1Content: ArrayBuffer, file2Content: ArrayBuffer): Promise<ResultRow[]> => {
    const CompareFunction = new Function('XLSX', 'file1', 'file2', 
      `return (async () => {
        ${script}
        return compareAndDisplayData(XLSX, file1, file2);
      })();`
    );
    return await CompareFunction(XLSX, file1Content, file2Content);
  };

  const handleCompare = async () => {
    const validationErrors: string[] = [];
    if (!file1) validationErrors.push("Please select the first file");
    if (!file2) validationErrors.push("Please select the second file");
    if (!script) validationErrors.push("Please select a comparison script");

    if (validationErrors.length > 0) {
      setStatus(validationErrors.join(", "));
      return;
    }

    try {
      // Check and update usage limits
      const usageRef = doc(db, 'usage', user.uid);
      
      await runTransaction(db, async (transaction) => {
        const usageDoc = await transaction.get(usageRef);
        const userData = usageDoc.data();
        
        if (!userData) {
          throw new Error('Usage data not found');
        }

        // Check if near limit (80% or more)
        const usagePercentage = (userData.comparisonsUsed / userData.comparisonsLimit) * 100;
        if (usagePercentage >= 80) {
          setWarning(`Warning: You have used ${userData.comparisonsUsed} out of ${userData.comparisonsLimit} comparisons (${Math.round(usagePercentage)}%)`);
        }

        if (userData.comparisonsUsed >= userData.comparisonsLimit) {
          throw new Error(`Monthly limit of ${userData.comparisonsLimit} comparisons reached. Please contact support to upgrade your plan.`);
        }

        transaction.update(usageRef, {
          comparisonsUsed: userData.comparisonsUsed + 1
        });
      });

      setStatus('Processing files...');
      
      const content1 = await readExcelFile(file1!);
      const content2 = await readExcelFile(file2!);

      setStatus('Running comparison...');
      const scriptContent = SCRIPTS[script as ScriptKey];
      if (!scriptContent) {
        throw new Error('Invalid script selected');
      }
      
      const result = await executeComparison(scriptContent, content1, content2);
      
      setResults(result);
      setStatus('Comparison complete!');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'An error occurred');
      setResults([]);
    }
  };

  const readExcelFile = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(results);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, 'comparison_results.xlsx');
  };

  const handleClear = () => {
    setFile1(null);
    setFile2(null);
    setScript('');
    setStatus('');
    setWarning('');
    setResults([]);
    if (file1Ref.current) file1Ref.current.value = '';
    if (file2Ref.current) file2Ref.current.value = '';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 font-medium">
                  {user.email?.[0].toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-gray-700">{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-600">Upload First File</label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                  file1 ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onDrop={(e) => handleDrop(e, setFile1)}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  ref={file1Ref}
                  onChange={(e) => handleFileUpload(e, setFile1)}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <FileSpreadsheet className={`mx-auto h-12 w-12 ${file1 ? 'text-emerald-600' : 'text-gray-400'}`} />
                <p className="mt-2 text-sm text-gray-600">
                  {file1 ? file1.name : "Drag & drop your first Excel or CSV file here"}
                </p>
                <button 
                  type="button"
                  onClick={() => file1Ref.current?.click()}
                  className="mt-2 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Select File
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-600">Upload Second File</label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                  file2 ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onDrop={(e) => handleDrop(e, setFile2)}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  ref={file2Ref}
                  onChange={(e) => handleFileUpload(e, setFile2)}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <FileSpreadsheet className={`mx-auto h-12 w-12 ${file2 ? 'text-emerald-600' : 'text-gray-400'}`} />
                <p className="mt-2 text-sm text-gray-600">
                  {file2 ? file2.name : "Drag & drop your second Excel or CSV file here"}
                </p>
                <button 
                  type="button"
                  onClick={() => file2Ref.current?.click()}
                  className="mt-2 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Select File
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 max-w-xs">
            <label className="block text-sm font-medium text-gray-600 mb-2">Select Comparison Script</label>
            <select 
              value={script}
              onChange={(e) => {
                setScript(e.target.value as ScriptKey | '');
                setStatus('');
              }}
              className={`block w-full rounded-md shadow-sm transition-colors duration-200 ${
                script 
                  ? 'border-emerald-400 bg-emerald-50/50' 
                  : 'border-gray-200'
              } focus:border-emerald-500 focus:ring-emerald-500`}
            >
              <option value="">Select a script...</option>
              <option value="run5">Main HUB vs Sales</option>
              <option value="hubVsSalesCustom">Payment Hub vs Sales Totals Custom</option>
            </select>
          </div>

          {warning && (
            <div className="mt-4 p-3 rounded-md flex items-center gap-2 bg-yellow-50 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{warning}</span>
            </div>
          )}

          {status && (
            <div className={`mt-4 p-3 rounded-md flex items-center gap-2 ${
              status.includes('error') || status.includes('limit')
                ? 'bg-red-50 text-red-700'
                : status.includes('complete')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-blue-700'
            }`}>
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{status}</span>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button 
              type="button"
              onClick={handleCompare}
              className="inline-flex items-center px-6 py-2 rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
            >
              Run Comparison
            </button>
            <button 
              type="button"
              onClick={handleClear}
              className="inline-flex items-center px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
            >
              Clear Form
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-700">Results</h2>
                <button
                  type="button"
                  onClick={downloadResults}
                  className="inline-flex items-center px-4 py-2 text-sm rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {results[0]?.map((header, i) => (
                        <th
                          key={i}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {results.slice(1).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => {
                          const isNumber = typeof cell === 'number';
                          const isNegative = isNumber && cell < 0;
                          
                          return (
                            <td
                              key={j}
                              className={`px-6 py-4 whitespace-nowrap ${
                                isNumber
                                  ? isNegative
                                    ? 'bg-red-50 text-red-600 font-medium'
                                    : 'bg-emerald-50 text-emerald-600 font-medium'
                                  : 'text-gray-900'
                              }`}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { MainPage };