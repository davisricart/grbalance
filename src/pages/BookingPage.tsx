import React from 'react';
import BookingCalendar from '../components/BookingCalendar';
import { Clock, Calendar, VideoIcon, CheckCircle } from 'lucide-react';

export default function BookingPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Schedule Your Free Consultation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Book a 30-minute session with our experts to discuss how our reconciliation tool can help your business save time and money.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <BookingCalendar />
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                What to Expect
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-emerald-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">30 Minutes</h3>
                    <p className="text-sm text-gray-600">Focused discussion on your needs</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <VideoIcon className="h-5 w-5 text-emerald-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">Video Call</h3>
                    <p className="text-sm text-gray-600">Via Google Meet or Zoom</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-emerald-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">Flexible Scheduling</h3>
                    <p className="text-sm text-gray-600">Pick a time that works for you</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Consultation Includes
              </h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>Personalized demo</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>ROI calculation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>Implementation strategy</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>Q&A session</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}