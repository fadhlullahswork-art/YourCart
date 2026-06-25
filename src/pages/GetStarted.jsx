import { Link } from 'react-router-dom'

export default function GetStarted() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5 py-16">
      <div className="max-w-2xl w-full text-center">
        <span className="inline-block text-xs font-semibold tracking-wide uppercase bg-yellow-pale text-yellow-deep px-3 py-1.5 rounded-full">
          Secure payments • Verified sellers • Easy shopping
        </span>

        <h1 className="font-display font-extrabold text-4xl md:text-5xl mt-5 text-ink">
          Welcome to YourCart
        </h1>
        <p className="text-ink-soft mt-4 max-w-md mx-auto">
          Buy and sell safely across Nigeria with trusted users, secure transactions, and simple
          communication.
        </p>

        <div className="grid sm:grid-cols-2 gap-5 mt-10">
          <Link
            to="/register/customer"
            className="group border border-line rounded-3xl p-8 text-left hover:border-ink transition-colors"
          >
            <h2 className="font-display font-bold text-xl text-ink">I'm a Customer</h2>
            <p className="text-ink-soft text-sm mt-2">
              Find products, chat with sellers, and shop safely.
            </p>
            <span className="inline-block mt-5 text-sm font-semibold text-yellow-deep group-hover:underline">
              Continue →
            </span>
          </Link>

          <Link
            to="/register/seller"
            className="group border border-line rounded-3xl p-8 text-left hover:border-ink transition-colors"
          >
            <h2 className="font-display font-bold text-xl text-ink">I'm a Seller</h2>
            <p className="text-ink-soft text-sm mt-2">
              Create your store, sell products, and grow your business.
            </p>
            <span className="inline-block mt-5 text-sm font-semibold text-yellow-deep group-hover:underline">
              Continue →
            </span>
          </Link>
        </div>

        <p className="text-sm text-ink-soft mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-ink hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}