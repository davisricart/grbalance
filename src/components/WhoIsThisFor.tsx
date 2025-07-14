import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const WhoIsThisFor: React.FC = () => (
  <section className="max-w-4xl mx-auto my-12 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="text-center mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Is GR Balance Right For You?</h2>
      <p className="text-lg text-gray-600">Save time by checking if our solution fits your business needs</p>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Perfect Fit Column */}
      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-lg" role="img" aria-label="chart">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Perfect Fit If You:</h3>
        </div>
        
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Can export data from your current systems (Excel, CSV, or similar)</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Want to automate time-consuming data reconciliation tasks</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Need custom matching rules for your specific business processes</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Spend hours monthly on manual reconciliation work</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Use DaySmart with external payment processors</span>
          </li>
        </ul>
      </div>

      {/* Not Right Column */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
            <X className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Not Right If You:</h3>
        </div>
        
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <X className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Only maintain paper records without digital systems</span>
          </li>
          <li className="flex items-start gap-3">
            <X className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Can't export data files from your current software</span>
          </li>
          <li className="flex items-start gap-3">
            <X className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Need a rigid, one-size-fits-all solution</span>
          </li>
          <li className="flex items-start gap-3">
            <X className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Already have perfect reconciliation processes</span>
          </li>
          <li className="flex items-start gap-3">
            <X className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Only process a few transactions monthly</span>
          </li>
        </ul>
      </div>
    </div>
    
    {/* Quick Check Section */}
    <div className="mt-8 text-center">
      <div className="inline-block bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl" role="img" aria-label="lightbulb">💡</span>
          <h4 className="text-lg font-bold text-gray-900">Quick Self-Check</h4>
        </div>
        <p className="text-gray-700 font-medium text-base">
          Can you download a spreadsheet from your current system? If yes, you're ready for GR Balance!
        </p>
        <p className="text-gray-600 text-sm mt-2">
          Still unsure? <span className="font-semibold text-emerald-600">Try our interactive demo</span> to see how it works with sample data.
        </p>
      </div>
    </div>
  </section>
);

export default WhoIsThisFor; 