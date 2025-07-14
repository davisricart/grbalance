import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const WhoIsThisFor: React.FC = () => (
  <section className="max-w-4xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
    <div className="text-center mb-10">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">Is GR Balance Right For You?</h2>
      <p className="text-xl text-gray-600 font-medium">Save time by checking if our solution fits your business needs</p>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Perfect Fit Column */}
      <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200 shadow-md">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-sm">
            <span className="text-2xl" role="img" aria-label="chart">📊</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Perfect Fit If You:</h3>
        </div>
        
        <ul className="space-y-5">
          <li className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
            <span className="text-gray-800 font-medium text-lg leading-relaxed">Can export data from your current systems (Excel, CSV, or similar)</span>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
            <span className="text-gray-800 font-medium text-lg leading-relaxed">Want to automate time-consuming data reconciliation tasks</span>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
            <span className="text-gray-800 font-medium text-lg leading-relaxed">Need custom matching rules for your specific business processes</span>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
            <span className="text-gray-800 font-medium text-lg leading-relaxed">Spend hours monthly on manual reconciliation work</span>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
            <span className="text-gray-800 font-medium text-lg leading-relaxed">Use DaySmart with external payment processors</span>
          </li>
        </ul>
      </div>

      {/* Not Right Column */}
      <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-md">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4 shadow-sm">
            <X className="h-7 w-7 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Not Right If You:</h3>
        </div>
        
        <ul className="space-y-5">
          <li className="flex items-start gap-4">
            <X className="h-6 w-6 text-gray-500 mt-1 flex-shrink-0" />
            <span className="text-gray-700 font-medium text-lg leading-relaxed">Only maintain paper records without digital systems</span>
          </li>
          <li className="flex items-start gap-4">
            <X className="h-6 w-6 text-gray-500 mt-1 flex-shrink-0" />
            <span className="text-gray-700 font-medium text-lg leading-relaxed">Can't export data files from your current software</span>
          </li>
          <li className="flex items-start gap-4">
            <X className="h-6 w-6 text-gray-500 mt-1 flex-shrink-0" />
            <span className="text-gray-700 font-medium text-lg leading-relaxed">Need a rigid, one-size-fits-all solution</span>
          </li>
          <li className="flex items-start gap-4">
            <X className="h-6 w-6 text-gray-500 mt-1 flex-shrink-0" />
            <span className="text-gray-700 font-medium text-lg leading-relaxed">Already have perfect reconciliation processes</span>
          </li>
          <li className="flex items-start gap-4">
            <X className="h-6 w-6 text-gray-500 mt-1 flex-shrink-0" />
            <span className="text-gray-700 font-medium text-lg leading-relaxed">Only process a few transactions monthly</span>
          </li>
        </ul>
      </div>
    </div>
    
    {/* Quick Check Section */}
    <div className="mt-10 text-center">
      <div className="inline-block bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-2xl px-8 py-6 shadow-lg">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-3xl" role="img" aria-label="lightbulb">💡</span>
          <h4 className="text-2xl font-bold text-gray-900">Quick Self-Check</h4>
        </div>
        <p className="text-gray-800 font-semibold text-lg mb-2">
          Can you download a spreadsheet from your current system? If yes, you're ready for GR Balance!
        </p>
        <p className="text-gray-600 text-base">
          Still unsure? <span className="font-bold text-emerald-700">Try our interactive demo</span> to see how it works with sample data.
        </p>
      </div>
    </div>
  </section>
);

export default WhoIsThisFor; 