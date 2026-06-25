// ⚠️ Replace with your real test public key from Paystack dashboard → Settings → API Keys
const PAYSTACK_PUBLIC_KEY = 'pk_test_786ac475ac5d906b2b684a4193c1da3060b57184'

export function payWithPaystack({ email, amountNaira, onSuccess, onClose }) {
  if (!window.PaystackPop) {
    alert('Payment system failed to load. Please refresh and try again.')
    return
  }

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: Math.round(amountNaira * 100), // Paystack expects kobo, not naira
    currency: 'NGN',
    callback: function (response) {
      // NOTE: in production, send response.reference to a backend function
      // that calls Paystack's Verify Transaction API before trusting this.
      onSuccess(response)
    },
    onClose: function () {
      onClose?.()
    },
  })

  handler.openIframe()
}