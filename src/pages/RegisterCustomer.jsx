import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

export default function RegisterCustomer() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password || !form.phone || !form.location) {
      setError('Please fill in every field.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password)

      await setDoc(doc(db, 'users', credential.user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        role: 'customer',
        status: 'active',
        verifiedBuyer: false,
        createdAt: serverTimestamp(),
      })

      navigate('/customer/dashboard')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in instead.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5 py-16">
      <div className="max-w-md w-full">
        <h1 className="font-display font-extrabold text-3xl text-ink">Create your account</h1>
        <p className="text-ink-soft mt-2">Browse products, chat with sellers, and shop safely.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
              className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
              placeholder="e.g. Amaka Johnson"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              type="tel"
              className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
              placeholder="08012345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              type="text"
              className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
              placeholder="e.g. Lagos"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white font-semibold py-3.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-ink-soft mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-ink hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}