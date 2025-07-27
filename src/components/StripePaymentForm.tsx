import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowRight, CreditCard, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  planTier: string;
  planPrice: number;
  planName: string;
  onSuccess: (subscriptionId: string) => void;
  onCancel: () => void;
  userEmail: string;
  userId: string;
  businessName?: string;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export default function StripePaymentForm({
  planTier,
  planPrice,
  planName,
  onSuccess,
  onCancel,
  userEmail,
  userId,
  businessName
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/.netlify/functions/stripe-create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: planPrice * 100, // Convert to cents
          currency: 'usd',
          planTier,
          userId,
          userEmail,
          businessName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            email: userEmail,
            name: businessName || userEmail,
          },
        },
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
        setProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        setProcessing(false);
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your subscription has been activated.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Your Purchase</h2>
            <p className="text-gray-600">You're upgrading to the {planName} plan for ${planPrice}/month</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-lg p-3">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Payment Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!stripe || processing}
            className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                Pay ${planPrice}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your payment is secured by Stripe. We never store your card information.
        </p>
      </form>
    </div>
  );
} 