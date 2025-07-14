import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const WhoIsThisFor: React.FC = () => (
  <section className="max-w-5xl mx-auto my-20 px-4">
    <div className="text-center mb-16">
      <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6 tracking-tight">Is This Right For You?</h2>
      <div className="w-16 h-0.5 bg-emerald-500 mx-auto mb-6"></div>
      <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">A quick assessment to save you time</p>
    </div>
    
    <div className="relative">
      {/* Background geometric elements */}
      <div className="absolute top-8 left-8 w-32 h-32 bg-emerald-100 rounded-full opacity-20 -z-10"></div>
      <div className="absolute bottom-8 right-8 w-24 h-24 bg-gray-100 rounded-full opacity-30 -z-10"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Perfect Fit Column */}
        <div className="lg:col-span-5 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-light text-gray-900 mb-2">Perfect Fit</h3>
            <p className="text-sm uppercase tracking-wider text-emerald-600 font-medium">You should try this</p>
          </div>
          
          <div className="space-y-6">
            {[
              "Export data from current systems",
              "Automate time-consuming reconciliation",
              "Need custom matching rules",
              "Spend hours on manual work monthly",
              "Use DaySmart with external processors"
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 group">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3 group-hover:scale-125 transition-transform"></div>
                <span className="text-gray-700 font-light text-lg leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Divider */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="hidden lg:block w-px h-80 bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
          <div className="lg:hidden w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        </div>

        {/* Not Right Column */}
        <div className="lg:col-span-5 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-300 rounded-2xl mb-4">
              <X className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-3xl font-light text-gray-900 mb-2">Not Ideal</h3>
            <p className="text-sm uppercase tracking-wider text-gray-500 font-medium">Might not be worth it</p>
          </div>
          
          <div className="space-y-6">
            {[
              "Only paper records, no digital systems",
              "Can't export data files",
              "Need rigid, one-size-fits-all solution",
              "Perfect reconciliation processes already",
              "Process very few transactions monthly"
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 group">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-3 group-hover:scale-125 transition-transform"></div>
                <span className="text-gray-600 font-light text-lg leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
    {/* Quick Check Section */}
    <div className="mt-20 text-center">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-3xl blur-lg opacity-20"></div>
        <div className="relative bg-white border border-emerald-200 rounded-3xl px-12 py-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <h4 className="text-2xl font-light text-gray-900">Quick Test</h4>
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xl text-gray-800 font-light mb-3 max-w-lg">
            Can you download a spreadsheet from your current system?
          </p>
          <p className="text-lg text-emerald-600 font-medium">
            If yes → <span className="underline decoration-emerald-300 decoration-2 underline-offset-4">You're ready</span>
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default WhoIsThisFor; 