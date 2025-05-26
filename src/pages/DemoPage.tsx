import React from 'react';
import { FileSpreadsheet, CheckCircle, AlertTriangle, TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sample Reconciliation Results
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See exactly what our reconciliation tool finds when analyzing salon payment data. 
            This example shows real discrepancies we've identified for clients.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transactions Processed</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Discrepancies Found</p>
                <p className="text-2xl font-bold text-red-900">23</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Money Recovered</p>
                <p className="text-2xl font-bold text-emerald-900">$1,247</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Saved</p>
                <p className="text-2xl font-bold text-blue-900">8.5 hrs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Sample Discrepancies Found</h2>
            <p className="text-sm text-gray-600 mt-1">These are real examples of issues our tool identifies</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salon Software</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-05-15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TXN-4829</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$127.50</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$124.32</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">-$3.18</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Processing Fee Error
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-05-14</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TXN-4801</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$89.00</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$86.45</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">-$2.55</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Rate Discrepancy
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-05-13</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TXN-4776</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.00</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$45.20</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">+$45.20</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Missing Transaction
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-05-12</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TXN-4752</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$156.75</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$151.89</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">-$4.86</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Processing Fee Error
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-emerald-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Insights from This Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900">Processing Fee Errors</h3>
                <p className="text-gray-700">Found $847 in incorrect processing fees charged over the month</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900">Missing Transactions</h3>
                <p className="text-gray-700">Identified 7 transactions that appeared in processor but not salon software</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900">Rate Discrepancies</h3>
                <p className="text-gray-700">Caught $400 in rate differences between agreed and actual processing rates</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900">Time Savings</h3>
                <p className="text-gray-700">Automated analysis completed in 3 minutes vs 8.5 hours manually</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Find Your Hidden Discrepancies?
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            This is just one month of data. Imagine what we could find in your complete payment history.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/book"
              className="inline-flex items-center px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-lg font-medium"
            >
              Book Free Consultation
            </a>
            <a
              href="/contact"
              className="inline-flex items-center px-8 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-lg font-medium"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 