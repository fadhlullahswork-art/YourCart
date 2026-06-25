import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import { useCart } from '../context/CartContext.jsx'
import BottomNav from '../components/BottomNav.jsx'


export default function CustomerDashboard() {
    const { itemCount } = useCart()
  const navigate = useNavigate()
  const { profile, loading } = useAuth()

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setProductsLoading(true)
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error(err)
    }
    setProductsLoading(false)
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-extrabold text-xl text-ink">
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
     <div className="flex items-center gap-4">
            <Link to="/customer/orders" className="text-sm font-semibold text-ink-soft hover:text-ink hidden sm:inline">
              My Orders
            </Link>
            <Link to="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-yellow-pale transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          <NotificationBell />
            <Link
              to="/customer/account"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-yellow-pale transition-colors"
              aria-label="My Account"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
            <span className="text-sm text-ink-soft hidden sm:inline">
              Hi, {profile?.name?.split(' ')[0] || 'there'}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold border border-line px-4 py-2 rounded-full hover:border-ink transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">
              Welcome back, {profile?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-ink-soft mt-2">Browse products from trusted sellers across Nigeria.</p>
          </div>
          <div className="bg-yellow-pale rounded-2xl p-5 mt-6 flex items-start gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <p className="text-sm font-semibold text-ink">How your payment is protected</p>
            <p className="text-xs text-ink-soft mt-1">
              When you pay for an item, YourCart holds the money safely — it isn't released to the
              seller until you confirm you've received your order. If anything goes wrong, you can
              report an issue and our team will step in.
            </p>
          </div>
        </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="border border-line rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-ink w-full sm:w-64"
          />
        </div>

        {productsLoading ? (
          <p className="text-ink-soft mt-10">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-10 border border-dashed border-line rounded-3xl py-16 text-center">
            <p className="text-ink-soft">
              {search
                ? 'No products match your search.'
                : 'No products available yet. Sellers will start adding products soon.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-10">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} linkTo={`/product/${p.id}`} />
            ))}
          </div>
        )}
     </main>

      <BottomNav
        items={[
          { to: '/customer/dashboard', label: 'Home', icon: 'home' },
          { to: '/cart', label: 'Cart', icon: 'cart' },
          { to: '/customer/orders', label: 'Orders', icon: 'orders' },
          { to: '/customer/messages', label: 'Messages', icon: 'messages' },
        ]}
      />
      <div className="h-16 md:hidden" />
    </div>
  )
}