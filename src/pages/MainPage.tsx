// PAGE MARKER: Main Page Component
import React, { useState, useRef, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { FileSpreadsheet, Download, AlertCircle, LogOut, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { doc, runTransaction } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { auth, db } from '../main';
import { useNavigate } from 'react-router-dom';
import UsageCounter from '../components/UsageCounter';

interface MainPageProps {
  user: User;
}

type ResultRow = (string | number)[];

export default function MainPage({ user }: MainPageProps) {
  const navigate = useNavigate();
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [script, setScript] = useState<string>('');
  const [availableScripts, setAvailableScripts] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [warning, setWarning] = useState('');
  const [results, setResults] = useState<ResultRow[]>([]);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Try the redirect first, then fallback to direct function call
    fetch('/api/scripts')
      .then(res => {
        if (!res.ok) throw new Error('Redirect failed');
        return res.json();
      })
      .then(setAvailableScripts)
      .catch(() => {
        // Fallback to direct Netlify function call
        fetch('/.netlify/functions/scripts')
          .then(res => res.json())
          .then(setAvailableScripts)
          .catch(() => setStatus('Failed to fetch available scripts'));
      });
  }, []);

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

  const handleCompare = async () => {
    const validationErrors: string[] = [];
    if (!file1) validationErrors.push('Please select the first file');
    if (!file2) validationErrors.push('Please select the second file');
    if (!script) validationErrors.push('Please select a comparison script');
    if (validationErrors.length > 0) {
      setStatus(validationErrors.join(', '));
      return;
    }
    try {
      // Check and update monthly usage limits (no daily restrictions)
      const usageRef = doc(db, 'usage', user.uid);
      
      await runTransaction(db, async (transaction) => {
        const usageDoc = await transaction.get(usageRef);
        const userData = usageDoc.data();
        
        if (!userData) {
          throw new Error('Usage data not found');
        }

        // Check if near monthly limit (80% or more)
        const usagePercentage = (userData.comparisonsUsed / userData.comparisonsLimit) * 100;
        if (usagePercentage >= 80) {
          setWarning(`Warning: You have used ${userData.comparisonsUsed} out of ${userData.comparisonsLimit} monthly comparisons (${Math.round(usagePercentage)}%)`);
        }

        if (userData.comparisonsUsed >= userData.comparisonsLimit) {
          throw new Error(`Monthly limit of ${userData.comparisonsLimit} comparisons reached. Please contact support to upgrade your plan.`);
        }

        transaction.update(usageRef, {
          comparisonsUsed: userData.comparisonsUsed + 1
        });
      });

      setStatus('Processing files...');
      const formData = new FormData();
      formData.append('file1', file1!);
      formData.append('file2', file2!);
      
      let response;
      let data;
      
      try {
        // Try the redirect first
        response = await fetch(`/api/scripts/${script}/execute`, {
          method: 'POST',
          body: formData,
        });
        data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Redirect failed');
        }
      } catch (error) {
        // Fallback to direct Netlify function call
        response = await fetch(`/.netlify/functions/execute-script?scriptName=${script}`, {
          method: 'POST',
          body: formData,
        });
        data = await response.json();
        
        if (!response.ok) {
          setStatus(data.error || 'An error occurred');
          setResults([]);
          return;
        }
      }
      setResults(data.result);
      setStatus('Comparison complete!');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'An error occurred');
      setResults([]);
    }
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
              <div className="flex flex-col">
                <span className="text-gray-700">{user.email}</span>
                <UsageCounter />
              </div>
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
                setScript(e.target.value);
                setStatus('');
              }}
              className={`block w-full rounded-md shadow-sm transition-colors duration-200 ${
                script 
                  ? 'border-emerald-400 bg-emerald-50/50' 
                  : 'border-gray-200'
              } focus:border-emerald-500 focus:ring-emerald-500`}
            >
              <option value="">Select a script...</option>
              {availableScripts.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
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
            <div className="mt-8 space-y-6">
              {/* Summary Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Processed</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {results.slice(1).filter(row => Array.isArray(row) && row[0] && row[0] !== '' && row[0] !== 'Card Brand').length}
                      </p>
                      <p className="text-xs text-blue-600">transactions</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600">Discrepancies</p>
                      <p className="text-2xl font-bold text-red-900">
                        {results.filter(row => Array.isArray(row) && typeof row[3] === 'number' && Math.abs(Number(row[3])) > 0.01).length}
                      </p>
                      <p className="text-xs text-red-600">found</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center">
                    <TrendingDown className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">Largest Variance</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        ${Math.max(...results.filter(row => Array.isArray(row) && typeof row[3] === 'number').map(row => Math.abs(Number(row[3])))).toFixed(2)}
                      </p>
                      <p className="text-xs text-yellow-600">amount</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-emerald-600">Status</p>
                      <p className="text-2xl font-bold text-emerald-900">Complete</p>
                      <p className="text-xs text-emerald-600">processed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-700">Detailed Results</h2>
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
                          const isLargeDiscrepancy = isNumber && Math.abs(Number(cell)) > 100;
                          
                          return (
                            <td
                              key={j}
                              className={`px-6 py-4 whitespace-nowrap ${
                                isNumber
                                  ? isNegative
                                    ? isLargeDiscrepancy 
                                      ? 'bg-red-100 text-red-800 font-bold' 
                                      : 'bg-red-50 text-red-600 font-medium'
                                    : Number(cell) > 0.01
                                      ? isLargeDiscrepancy 
                                        ? 'bg-yellow-100 text-yellow-800 font-bold' 
                                        : 'bg-emerald-50 text-emerald-600 font-medium'
                                      : 'text-gray-900'
                                  : 'text-gray-900'
                              }`}
                            >
                              {isNumber && Math.abs(Number(cell)) > 0.01 ? (
                                <span className="inline-flex items-center">
                                  {isNegative ? (
                                    <TrendingDown className="h-4 w-4 mr-1" />
                                  ) : (
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                  )}
                                  {cell}
                                </span>
                              ) : (
                                cell
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { MainPage };