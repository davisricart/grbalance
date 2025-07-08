import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileSpreadsheet, Upload, Play, CheckCircle, AlertTriangle, Clock, DollarSign } from 'lucide-react';

interface DemoFileSet {
  id: string;
  name: string;
  description: string;
  transactions: number;
  preview: {
    salonFile: string[];
    processorFile: string[];
  };
  results: {
    processed: number;
    discrepancies: number;
    moneyRecovered: number;
    timeSaved: number;
    sampleDiscrepancies: Array<{
      date: string;
      transactionId: string;
      salonAmount: string;
      processorAmount: string;
      difference: string;
      issueType: string;
      issueColor: string;
    }>;
  };
}

const demoFileSets: DemoFileSet[] = [
  {
    id: 'small',
    name: 'Small Salon',
    description: 'Perfect for boutique salons with 1-2 stylists',
    transactions: 487,
    preview: {
      salonFile: [
        'Date | Transaction ID | Service | Amount | Payment Method',
        '2024-05-15 | TXN-001 | Haircut & Style | $85.00 | Credit Card',
        '2024-05-15 | TXN-002 | Color Treatment | $120.00 | Credit Card',
        '2024-05-15 | TXN-003 | Manicure | $35.00 | Cash',
        '... 484 more transactions'
      ],
      processorFile: [
        'Date | Reference | Gross Amount | Net Amount | Fees',
        '2024-05-15 | TXN-001 | $85.00 | $82.54 | $2.46',
        '2024-05-15 | TXN-002 | $120.00 | $116.52 | $3.48',
        '2024-05-15 | TXN-004 | $45.00 | $43.65 | $1.35',
        '... 485 more transactions'
      ]
    },
    results: {
      processed: 487,
      discrepancies: 8,
      moneyRecovered: 342,
      timeSaved: 2.5,
      sampleDiscrepancies: [
        {
          date: '2024-05-15',
          transactionId: 'TXN-002',
          salonAmount: '$120.00',
          processorAmount: '$117.85',
          difference: '-$2.15',
          issueType: 'Processing Fee Error',
          issueColor: 'red'
        },
        {
          date: '2024-05-14',
          transactionId: 'TXN-004',
          salonAmount: '$0.00',
          processorAmount: '$45.00',
          difference: '+$45.00',
          issueType: 'Missing Transaction',
          issueColor: 'red'
        }
      ]
    }
  },
  {
    id: 'medium',
    name: 'Medium Salon',
    description: 'Growing salons with 3-5 stylists',
    transactions: 2847,
    preview: {
      salonFile: [
        'Date | Transaction ID | Service | Amount | Payment Method',
        '2024-05-15 | TXN-4829 | Full Service | $127.50 | Credit Card',
        '2024-05-15 | TXN-4830 | Cut & Color | $185.00 | Credit Card',
        '2024-05-15 | TXN-4831 | Highlights | $95.00 | Debit Card',
        '... 2,844 more transactions'
      ],
      processorFile: [
        'Date | Reference | Gross Amount | Net Amount | Fees',
        '2024-05-15 | TXN-4829 | $127.50 | $124.32 | $3.18',
        '2024-05-15 | TXN-4830 | $185.00 | $180.15 | $4.85',
        '2024-05-15 | TXN-4832 | $67.50 | $65.63 | $1.87',
        '... 2,845 more transactions'
      ]
    },
    results: {
      processed: 2847,
      discrepancies: 23,
      moneyRecovered: 1247,
      timeSaved: 8.5,
      sampleDiscrepancies: [
        {
          date: '2024-05-15',
          transactionId: 'TXN-4829',
          salonAmount: '$127.50',
          processorAmount: '$124.32',
          difference: '-$3.18',
          issueType: 'Processing Fee Error',
          issueColor: 'red'
        },
        {
          date: '2024-05-13',
          transactionId: 'TXN-4776',
          salonAmount: '$0.00',
          processorAmount: '$45.20',
          difference: '+$45.20',
          issueType: 'Missing Transaction',
          issueColor: 'red'
        }
      ]
    }
  },
  {
    id: 'large',
    name: 'Large Salon',
    description: 'Established salons with 6+ stylists',
    transactions: 5234,
    preview: {
      salonFile: [
        'Date | Transaction ID | Service | Amount | Payment Method',
        '2024-05-15 | TXN-8901 | Premium Package | $285.00 | Credit Card',
        '2024-05-15 | TXN-8902 | Bridal Service | $450.00 | Credit Card',
        '2024-05-15 | TXN-8903 | Basic Cut | $65.00 | Cash',
        '... 5,231 more transactions'
      ],
      processorFile: [
        'Date | Reference | Gross Amount | Net Amount | Fees',
        '2024-05-15 | TXN-8901 | $285.00 | $277.45 | $7.55',
        '2024-05-15 | TXN-8902 | $450.00 | $438.15 | $11.85',
        '2024-05-15 | TXN-8904 | $125.00 | $121.88 | $3.12',
        '... 5,233 more transactions'
      ]
    },
    results: {
      processed: 5234,
      discrepancies: 47,
      moneyRecovered: 2890,
      timeSaved: 15.2,
      sampleDiscrepancies: [
        {
          date: '2024-05-15',
          transactionId: 'TXN-8901',
          salonAmount: '$285.00',
          processorAmount: '$277.45',
          difference: '-$7.55',
          issueType: 'Rate Discrepancy',
          issueColor: 'yellow'
        },
        {
          date: '2024-05-14',
          transactionId: 'TXN-8904',
          salonAmount: '$0.00',
          processorAmount: '$125.00',
          difference: '+$125.00',
          issueType: 'Missing Transaction',
          issueColor: 'red'
        }
      ]
    }
  }
];

export default function InteractiveDemoPage() {
  const [selectedFileSet, setSelectedFileSet] = useState<DemoFileSet | null>(null);
  const [step, setStep] = useState<'select' | 'preview' | 'processing' | 'results'>('select');
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleFileSetSelect = (fileSet: DemoFileSet) => {
    setSelectedFileSet(fileSet);
    setStep('preview');
  };

  const handleStartProcessing = () => {
    setStep('processing');
    setProcessingProgress(0);
    
    // Simulate processing with progress
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('results'), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleTryAnother = () => {
    setSelectedFileSet(null);
    setStep('select');
    setProcessingProgress(0);
  };

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Helmet>
          <title>Interactive Demo - Salon Payment Reconciliation | See Real Results | GR Balance</title>
          <meta name="description" content="Try our salon reconciliation software with real sample data. See how we catch $2,890+ in processing errors and save 15+ hours monthly. Free interactive demo for DaySmart & Square users." />
          <meta name="keywords" content="salon reconciliation demo, DaySmart demo, payment reconciliation trial, salon software demo, free reconciliation test, beauty salon payment processing demo" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Interactive Demo - See How We Catch $2,890+ in Salon Payment Errors" />
          <meta property="og:description" content="Free interactive demo shows real salon reconciliation results. Test with sample data from small, medium, and large salons." />
          <meta property="og:url" content="https://grbalance.netlify.app/interactive-demo" />
          <meta property="og:image" content="https://grbalance.netlify.app/images/demo-results-preview.png" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Interactive Demo - Salon Payment Reconciliation Results" />
          <meta name="twitter:description" content="Free demo shows how we catch thousands in salon payment processing errors. Try with real sample data." />
          <meta name="twitter:image" content="https://grbalance.netlify.app/images/demo-twitter-preview.png" />
          
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="https://grbalance.netlify.app/interactive-demo" />
          
          {/* FAQ Schema for Demo Page */}
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How does the salon reconciliation demo work?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Our interactive demo uses real salon transaction data samples to show exactly how our reconciliation software works. You can choose from small, medium, or large salon datasets and see live processing results."
                    }
                  },
                  {
                    "@type": "Question", 
                    "name": "What will I see in the demo results?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The demo shows real discrepancies found in salon payment data, including processing fee errors, missing transactions, and rate discrepancies. You'll see exactly how much money our software can recover for your salon."
                    }
                  }
                ]
              }
            `}
          </script>
        </Helmet>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Try Our Reconciliation Tool
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose a demo file set that matches your salon size. We'll show you exactly what our tool finds when analyzing your payment data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {demoFileSets.map((fileSet) => (
              <div
                key={fileSet.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleFileSetSelect(fileSet)}
              >
                <div className="text-center mb-4">
                  <FileSpreadsheet className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-900">{fileSet.name}</h3>
                  <p className="text-gray-600 mt-2">{fileSet.description}</p>
                </div>
                
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Transactions:</span>
                    <span className="font-medium">{fileSet.transactions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Savings:</span>
                    <span className="font-medium text-emerald-600">${fileSet.results.moneyRecovered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Saved:</span>
                    <span className="font-medium">{fileSet.results.timeSaved} hours</span>
                  </div>
                </div>

                <button className="w-full mt-4 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors">
                  Select This Demo
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preview' && selectedFileSet) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Helmet>
          <title>Interactive Demo - Salon Payment Reconciliation | See Real Results | GR Balance</title>
          <meta name="description" content="Try our salon reconciliation software with real sample data. See how we catch $2,890+ in processing errors and save 15+ hours monthly. Free interactive demo for DaySmart & Square users." />
          <meta name="keywords" content="salon reconciliation demo, DaySmart demo, payment reconciliation trial, salon software demo, free reconciliation test, beauty salon payment processing demo" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Interactive Demo - See How We Catch $2,890+ in Salon Payment Errors" />
          <meta property="og:description" content="Free interactive demo shows real salon reconciliation results. Test with sample data from small, medium, and large salons." />
          <meta property="og:url" content="https://grbalance.netlify.app/interactive-demo" />
          <meta property="og:image" content="https://grbalance.netlify.app/images/demo-results-preview.png" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Interactive Demo - Salon Payment Reconciliation Results" />
          <meta name="twitter:description" content="Free demo shows how we catch thousands in salon payment processing errors. Try with real sample data." />
          <meta name="twitter:image" content="https://grbalance.netlify.app/images/demo-twitter-preview.png" />
          
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="https://grbalance.netlify.app/interactive-demo" />
          
          {/* FAQ Schema for Demo Page */}
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How does the salon reconciliation demo work?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Our interactive demo uses real salon transaction data samples to show exactly how our reconciliation software works. You can choose from small, medium, or large salon datasets and see live processing results."
                    }
                  },
                  {
                    "@type": "Question", 
                    "name": "What will I see in the demo results?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The demo shows real discrepancies found in salon payment data, including processing fee errors, missing transactions, and rate discrepancies. You'll see exactly how much money our software can recover for your salon."
                    }
                  }
                ]
              }
            `}
          </script>
        </Helmet>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Preview: {selectedFileSet.name} Demo Files
            </h1>
            <p className="text-lg text-gray-600">
              Here's what your demo files contain. Ready to process them?
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Salon Software File Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 mr-2" />
                Salon Software Export
              </h3>
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Transaction ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Service</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Amount</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">2024-05-15</td>
                      <td className="px-3 py-2">TXN-001</td>
                      <td className="px-3 py-2">Haircut & Style</td>
                      <td className="px-3 py-2">$85.00</td>
                      <td className="px-3 py-2">Credit Card</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">2024-05-15</td>
                      <td className="px-3 py-2">TXN-002</td>
                      <td className="px-3 py-2">Color Treatment</td>
                      <td className="px-3 py-2">$120.00</td>
                      <td className="px-3 py-2">Credit Card</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">2024-05-15</td>
                      <td className="px-3 py-2">TXN-003</td>
                      <td className="px-3 py-2">Manicure</td>
                      <td className="px-3 py-2">$35.00</td>
                      <td className="px-3 py-2">Cash</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 text-gray-500 italic" colSpan={5}>... {(selectedFileSet.transactions - 3).toLocaleString()} more transactions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Processor File Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                Payment Processor Export
              </h3>
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Reference</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Gross Amount</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Net Amount</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Fees</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">2024-05-15</td>
                      <td className="px-3 py-2">TXN-001</td>
                      <td className="px-3 py-2">$85.00</td>
                      <td className="px-3 py-2">$82.54</td>
                      <td className="px-3 py-2">$2.46</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">2024-05-15</td>
                      <td className="px-3 py-2">TXN-002</td>
                      <td className="px-3 py-2">$120.00</td>
                      <td className="px-3 py-2">$116.52</td>
                      <td className="px-3 py-2">$3.48</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">2024-05-15</td>
                      <td className="px-3 py-2">TXN-004</td>
                      <td className="px-3 py-2">$45.00</td>
                      <td className="px-3 py-2">$43.65</td>
                      <td className="px-3 py-2">$1.35</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 text-gray-500 italic" colSpan={5}>... {(selectedFileSet.transactions - 2).toLocaleString()} more transactions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-emerald-50 rounded-xl p-6 mb-6 inline-block">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Process</h3>
              <p className="text-gray-600 mb-4">
                We'll analyze {selectedFileSet.transactions.toLocaleString()} transactions and find discrepancies automatically.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStartProcessing}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Reconciliation
                </button>
                <button
                  onClick={handleTryAnother}
                  className="bg-white text-gray-600 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Choose Different Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Helmet>
          <title>Interactive Demo - Salon Payment Reconciliation | See Real Results | GR Balance</title>
          <meta name="description" content="Try our salon reconciliation software with real sample data. See how we catch $2,890+ in processing errors and save 15+ hours monthly. Free interactive demo for DaySmart & Square users." />
          <meta name="keywords" content="salon reconciliation demo, DaySmart demo, payment reconciliation trial, salon software demo, free reconciliation test, beauty salon payment processing demo" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Interactive Demo - See How We Catch $2,890+ in Salon Payment Errors" />
          <meta property="og:description" content="Free interactive demo shows real salon reconciliation results. Test with sample data from small, medium, and large salons." />
          <meta property="og:url" content="https://grbalance.netlify.app/interactive-demo" />
          <meta property="og:image" content="https://grbalance.netlify.app/images/demo-results-preview.png" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Interactive Demo - Salon Payment Reconciliation Results" />
          <meta name="twitter:description" content="Free demo shows how we catch thousands in salon payment processing errors. Try with real sample data." />
          <meta name="twitter:image" content="https://grbalance.netlify.app/images/demo-twitter-preview.png" />
          
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="https://grbalance.netlify.app/interactive-demo" />
          
          {/* FAQ Schema for Demo Page */}
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How does the salon reconciliation demo work?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Our interactive demo uses real salon transaction data samples to show exactly how our reconciliation software works. You can choose from small, medium, or large salon datasets and see live processing results."
                    }
                  },
                  {
                    "@type": "Question", 
                    "name": "What will I see in the demo results?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The demo shows real discrepancies found in salon payment data, including processing fee errors, missing transactions, and rate discrepancies. You'll see exactly how much money our software can recover for your salon."
                    }
                  }
                ]
              }
            `}
          </script>
        </Helmet>
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Files</h2>
            <p className="text-gray-600 mb-6">
              Analyzing {selectedFileSet?.transactions.toLocaleString()} transactions...
            </p>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{processingProgress}% Complete</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results' && selectedFileSet) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Helmet>
          <title>Interactive Demo - Salon Payment Reconciliation | See Real Results | GR Balance</title>
          <meta name="description" content="Try our salon reconciliation software with real sample data. See how we catch $2,890+ in processing errors and save 15+ hours monthly. Free interactive demo for DaySmart & Square users." />
          <meta name="keywords" content="salon reconciliation demo, DaySmart demo, payment reconciliation trial, salon software demo, free reconciliation test, beauty salon payment processing demo" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Interactive Demo - See How We Catch $2,890+ in Salon Payment Errors" />
          <meta property="og:description" content="Free interactive demo shows real salon reconciliation results. Test with sample data from small, medium, and large salons." />
          <meta property="og:url" content="https://grbalance.netlify.app/interactive-demo" />
          <meta property="og:image" content="https://grbalance.netlify.app/images/demo-results-preview.png" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Interactive Demo - Salon Payment Reconciliation Results" />
          <meta name="twitter:description" content="Free demo shows how we catch thousands in salon payment processing errors. Try with real sample data." />
          <meta name="twitter:image" content="https://grbalance.netlify.app/images/demo-twitter-preview.png" />
          
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="https://grbalance.netlify.app/interactive-demo" />
          
          {/* FAQ Schema for Demo Page */}
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How does the salon reconciliation demo work?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Our interactive demo uses real salon transaction data samples to show exactly how our reconciliation software works. You can choose from small, medium, or large salon datasets and see live processing results."
                    }
                  },
                  {
                    "@type": "Question", 
                    "name": "What will I see in the demo results?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The demo shows real discrepancies found in salon payment data, including processing fee errors, missing transactions, and rate discrepancies. You'll see exactly how much money our software can recover for your salon."
                    }
                  }
                ]
              }
            `}
          </script>
        </Helmet>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Reconciliation Complete!
            </h1>
            <p className="text-lg text-gray-600">
              Here's what we found in your {selectedFileSet.name.toLowerCase()} data - {selectedFileSet.results.discrepancies} discrepancies identified with ${selectedFileSet.results.moneyRecovered.toLocaleString()} in potential savings.
            </p>
          </div>

          {/* Sample Discrepancies */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Sample Discrepancies Found</h2>
              <p className="text-sm text-gray-600 mt-1">Here are some of the issues we identified</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
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
                <tbody className="bg-white">
                  {selectedFileSet.results.sampleDiscrepancies.map((discrepancy, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{discrepancy.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{discrepancy.transactionId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{discrepancy.salonAmount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{discrepancy.processorAmount}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        discrepancy.difference.startsWith('-') ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {discrepancy.difference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          discrepancy.issueColor === 'red' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {discrepancy.issueType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-emerald-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Impressed with the Results?
            </h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              This is what we can find in just one month of your data. Ready to see what we can uncover in your complete payment history?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/book"
                className="inline-flex items-center px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-lg font-medium"
              >
                Book Free Consultation
              </a>
              <button
                onClick={handleTryAnother}
                className="inline-flex items-center px-8 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-lg font-medium"
              >
                Try Another Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 