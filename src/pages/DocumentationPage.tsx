import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Shield, ArrowLeft, Home } from 'lucide-react';

export default function DocumentationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <Link 
              to="/"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Documentation</h1>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                File Requirements
              </h2>
              <div className="prose prose-emerald">
                <p className="text-gray-600 mb-4">
                  Our reconciliation tool supports the following file formats:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Excel files (.xlsx, .xls)</li>
                  <li>CSV files (.csv)</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  For optimal results, ensure your files:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Have clear column headers</li>
                  <li>Contain consistent data formats</li>
                  <li>Are free of merged cells</li>
                  <li>Have no hidden sheets or rows</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-emerald-600" />
                Security
              </h2>
              <div className="prose prose-emerald">
                <p className="text-gray-600 mb-4">
                  We take your data security seriously:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>All file processing happens in your browser</li>
                  <li>Files are never uploaded to our servers</li>
                  <li>Secure authentication via Firebase</li>
                  <li>Regular security audits and updates</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}