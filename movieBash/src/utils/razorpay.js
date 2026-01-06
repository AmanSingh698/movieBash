/**
 * Razorpay Payment Integration (Backend-based)
 * Keeps API keys secure on the server
 */

import api from './axiosConfig'

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Initialize Razorpay payment with backend integration
 * @param {Object} options - Payment options
 * @param {number} options.amount - Amount in INR
 * @param {Object} options.bookingDetails - Booking details (showId, seatIds, etc.)
 * @param {Object} options.prefill - User prefill data
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onFailure - Failure callback
 */
export const initializeRazorpay = async (options) => {
  const {
    amount,
    bookingDetails,
    description = 'Movie Ticket Booking',
    prefill = {},
    onSuccess,
    onFailure,
  } = options

  try {
    // Load Razorpay script
    const res = await loadRazorpayScript()

    if (!res) {
      throw new Error('Razorpay SDK failed to load. Please check your internet connection.')
    }

    // Step 1: Create order on backend
    const orderResponse = await api.post('/payments/create-order', {
      amount,
      bookingDetails,
    })

    if (!orderResponse.data.success) {
      throw new Error(orderResponse.data.message || 'Failed to create payment order')
    }

    const { orderId, keyId } = orderResponse.data.data

    // Step 2: Open Razorpay checkout
    const razorpayOptions = {
      key: keyId, // Key ID from backend (safe to expose)
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      name: 'MovieBash',
      description: description,
      order_id: orderId,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.phone || '',
      },
      theme: {
        color: '#a855f7',
      },
      handler: async function (response) {
        try {
          // Step 3: Verify payment on backend
          const verifyResponse = await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingDetails,
          })

          if (verifyResponse.data.success) {
            // Payment verified and booking confirmed
            if (onSuccess) {
              onSuccess(verifyResponse.data.data)
            }
          } else {
            throw new Error(verifyResponse.data.message || 'Payment verification failed')
          }
        } catch (error) {
          console.error('Payment verification error:', error)
          if (onFailure) {
            onFailure({ message: error.message || 'Payment verification failed' })
          }
        }
      },
      modal: {
        ondismiss: function () {
          if (onFailure) {
            onFailure({ message: 'Payment cancelled by user' })
          }
        },
      },
    }

    const paymentObject = new window.Razorpay(razorpayOptions)
    paymentObject.open()
  } catch (error) {
    console.error('Payment initialization error:', error)
    if (onFailure) {
      onFailure({ message: error.message || 'Failed to initialize payment' })
    }
  }
}
