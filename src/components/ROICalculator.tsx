import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ROICalculator() {
  const navigate = useNavigate();
  const [hoursPerWeek, setHoursPerWeek] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [customRate, setCustomRate] = useState('');
  const [monthlyErrorsCaught, setMonthlyErrorsCaught] = useState(200);
  const [monthlyErrorsMissed, setMonthlyErrorsMissed] = useState(300);
  const [showResults, setShowResults] = useState(false);

  // Calculate ROI in real-time
  const annualTimeCost = hoursPerWeek * (hourlyRate || parseInt(customRate) || 0) * 52;
  const annualErrorCost = (monthlyErrorsCaught + monthlyErrorsMissed) * 12;
  const totalAnnualCost = annualTimeCost + annualErrorCost;
  const professionalPlanCost = 348 + 497; // $845 Year 1
  const netSavings = totalAnnualCost - professionalPlanCost;
  const roiPercentage = totalAnnualCost > 0 ? Math.round((netSavings / professionalPlanCost) * 100) : 0;

  // Show results when user interacts
  useEffect(() => {
    setShowResults(true);
  }, [hoursPerWeek, hourlyRate, customRate, monthlyErrorsCaught, monthlyErrorsMissed]);

  // Suggest plan based on volume (hours per week)
  const suggestedPlan = hoursPerWeek <= 2 ? 'Starter' : hoursPerWeek <= 6 ? 'Professional' : 'Business';
  const suggestedPlanCost = hoursPerWeek <= 2 ? 228 : hoursPerWeek <= 6 ? 348 : 588;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-8 border border-emerald-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-4">
          <Calculator className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculate Your Potential Savings</h2>
        <p className="text-gray-600">See exactly how much time and money you could save with custom reconciliation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Hours spent on reconciliation per week: <span className="text-emerald-600 font-semibold">{hoursPerWeek}</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #059669 0%, #059669 ${((hoursPerWeek - 1) / 19) * 100 + 2.5}%, #e5e7eb ${((hoursPerWeek - 1) / 19) * 100 + 2.5}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 hour</span>
              <span>20 hours</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Hourly rate for this work:
            </label>
            <select
              value={hourlyRate}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setHourlyRate(value);
                if (value !== 0) setCustomRate('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value={15}>$15/hour</option>
              <option value={20}>$20/hour</option>
              <option value={25}>$25/hour (Average)</option>
              <option value={30}>$30/hour</option>
              <option value={35}>$35/hour</option>
              <option value={0}>Other</option>
            </select>
            {hourlyRate === 0 && (
              <input
                type="number"
                placeholder="Enter custom rate"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Monthly errors you currently catch: <span className="text-emerald-600 font-semibold">{formatCurrency(monthlyErrorsCaught)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={monthlyErrorsCaught}
              onChange={(e) => setMonthlyErrorsCaught(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #059669 0%, #059669 ${(monthlyErrorsCaught / 2000) * 100}%, #e5e7eb ${(monthlyErrorsCaught / 2000) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>$2,000</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Estimated errors you might miss: <span className="text-emerald-600 font-semibold">{formatCurrency(monthlyErrorsMissed)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="25"
              value={monthlyErrorsMissed}
              onChange={(e) => setMonthlyErrorsMissed(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(monthlyErrorsMissed / 1000) * 100}%, #e5e7eb ${(monthlyErrorsMissed / 1000) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>$1,000</span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          {showResults && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Annual Costs</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Time Cost</span>
                  </div>
                  <span className="font-semibold text-blue-900">{formatCurrency(annualTimeCost)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Error Cost</span>
                  </div>
                  <span className="font-semibold text-red-900">{formatCurrency(annualErrorCost)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <span className="font-semibold text-gray-900">Total Annual Cost</span>
                  <span className="font-bold text-xl text-gray-900">{formatCurrency(totalAnnualCost)}</span>
                </div>

                <div className="border-t pt-3 mt-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium text-emerald-900">Our {suggestedPlan} Plan</span>
                    <span className="font-semibold text-emerald-900">{formatCurrency(348)}/year + $497 setup</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-emerald-100 rounded-lg mt-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-700" />
                      <span className="font-semibold text-emerald-900">Your Net Savings</span>
                    </div>
                    <span className="font-bold text-xl text-emerald-900">{formatCurrency(Math.max(0, netSavings))}</span>
                  </div>

                  {roiPercentage > 0 && (
                    <div className="text-center mt-3 p-2 bg-emerald-600 text-white rounded-lg">
                      <span className="font-bold text-lg">ROI: {roiPercentage}%</span>
                    </div>
                  )}
                </div>
              </div>

              {netSavings > 1000 && (
                <div className="mt-6 text-center">
                  <p className="text-lg font-semibold text-gray-900 mb-4">
                    Ready to save {formatCurrency(Math.max(0, netSavings))} this year?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => navigate('/book')}
                      className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Book Free Consultation
                    </button>
                    <button 
                      onClick={() => navigate('/demo')}
                      className="flex-1 bg-white text-emerald-600 border-2 border-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
                    >
                      View Sample Results
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #059669;
          cursor: pointer;
          outline: none;
          border: 2px solid white;
          box-shadow: 0 0 2px #059669;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #059669;
          cursor: pointer;
          border: 2px solid white;
          outline: none;
          box-shadow: 0 0 2px #059669;
        }
        .slider {
          height: 12px;
          outline: none;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
} 