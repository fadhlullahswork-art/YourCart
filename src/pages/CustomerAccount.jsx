import { useNavigate, Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function CustomerAccount() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center">
          <Link to="/customer/dashboard" className="font-display font-extrabold text-xl text-ink">
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-8">
        <h1 className="font-display font-bold text-2xl text-ink mb-6">My Account</h1>

        <div className="border border-line rounded-2xl p-5 space-y-2 text-sm">
          <p><span className="text-ink-soft">Name:</span> {profile?.name}</p>
          <p><span className="text-ink-soft">Email:</span> {profile?.email}</p>
          <p><span className="text-ink-soft">Phone:</span> {profile?.phone || '—'}</p>
          <p><span className="text-ink-soft">Location:</span> {profile?.location || '—'}</p>
        </div>

        <p className="text-xs text-ink-soft mt-5">
          More account features (saved addresses, verified buyer status, and settings) are coming soon.
        </p>

        <button
          onClick={handleLogout}
          className="w-full border border-line text-red-600 font-semibold py-3 rounded-full hover:border-red-300 transition-colors mt-8"
        >
          Log Out
        </button>
      </main>

      <div className="h-16 md:hidden" />
    </div>
  )
}