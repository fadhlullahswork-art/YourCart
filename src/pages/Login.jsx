import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, form.email, form.password)

      // Fetch user role from Firestore to redirect correctly
      const userDoc = await getDoc(doc(db, 'users', credential.user.uid))
      const userData = userDoc.data()

      if (userData?.role === 'seller') {
        navigate('/seller/dashboard')
      } else if (userData?.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/customer/dashboard')
      }
    } catch (err) {
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5 py-16">
      <div className="max-w-md w-full">
        <h1 className="font-display font-extrabold text-3xl text-ink">Welcome back</h1>
        <p className="text-ink-soft mt-2">Log in to your YourCart account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
              placeholder="Your password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white font-semibold py-3.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-sm text-ink-soft mt-6 text-center">
          Don't have an account?{' '}
          <Link to="/get-started" className="font-semibold text-ink hover:underline">
            Get Started
          </Link>
        </p>
      </div>
    </div>
  )
}