import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore'
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

  const [tab, setTab] = useState('products') // 'products' | 'services'
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showBanner, setShowBanner] = useState(true)
  const [dark, setDark] = useState(() => localStorage.getItem('yourcart_dark') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('yourcart_dark', dark)
  }, [dark])

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (tab === 'services' && services.length === 0) loadServices()
  }, [tab])

  useEffect(() => {
    const timer = setTimeout(() => setShowBanner(false), 20000)
    return () => clearTimeout(timer)
  }, [])

  async function loadProducts() {
    setProductsLoading(true)
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const productList = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      const sellerIds = [...new Set(productList.map((p) => p.sellerId))]
      const sellerSnaps = await Promise.all(sellerIds.map((id) => getDoc(doc(db, 'users', id))))
      const sellerMap = {}
      sellerSnaps.forEach((snap) => {
        if (snap.exists()) sellerMap[snap.id] = snap.data()
      })

      setProducts(productList.map((p) => ({
        ...p,
        sellerPhotoURL: sellerMap[p.sellerId]?.photoURL || '',
        sellerVerified: sellerMap[p.sellerId]?.verification?.status === 'approved',
      })))
    } catch (err) {
      console.error(err)
    }
    setProductsLoading(false)
  }

  async function loadServices() {
    setServicesLoading(true)
    try {
      const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const serviceList = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      const sellerIds = [...new Set(serviceList.map((s) => s.sellerId))]
      const sellerSnaps = await Promise.all(sellerIds.map((id) => getDoc(doc(db, 'users', id))))
      const sellerMap = {}
      sellerSnaps.forEach((snap) => {
        if (snap.exists()) sellerMap[snap.id] = snap.data()
      })

      setServices(serviceList.map((s) => ({
        ...s,
        sellerName: sellerMap[s.sellerId]?.name || s.sellerName || 'Seller',
        sellerVerified: sellerMap[s.sellerId]?.verification?.status === 'approved',
        sellerPhotoURL: sellerMap[s.sellerId]?.photoURL || '',
      })))
    } catch (err) {
      console.error(err)
    }
    setServicesLoading(false)
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredServices = services.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  )

  const dm = {
    page: dark ? 'bg-[#1e1e1e]' : 'bg-white',
    header: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
    text: dark ? 'text-gray-100' : 'text-ink',
    textSoft: dark ? 'text-gray-400' : 'text-ink-soft',
    border: dark ? 'border-[#333]' : 'border-line',
    input: dark ? 'bg-[#2e2e2e] border-[#444] text-gray-100 placeholder-gray-500' : 'border-line text-ink',
    banner: dark ? 'bg-[#2a2700]' : 'bg-yellow-pale',
    card: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
    skeleton: dark ? 'bg-[#2e2e2e]' : 'bg-yellow-pale',
    skeletonLine: dark ? 'bg-[#3a3a3a]' : 'bg-line',
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dm.page}`}>
        <p className={dm.textSoft}>Loading...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${dm.page} transition-colors duration-300`}>
      {/* ── Header ── */}
      <header className={`border-b ${dm.header} sticky top-0 z-30 transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className={`font-display font-extrabold text-xl ${dm.text}`}>
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/customer/orders" className={`text-sm font-semibold hidden sm:inline ${dm.textSoft} hover:text-yellow-deep`}>
              My Orders
            </Link>
            <NotificationBell />

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${dm.border} ${dm.textSoft} hover:text-yellow-deep`}
              aria-label="Toggle dark mode"
            >
              {dark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <Link
              to="/customer/account"
              className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-yellow-pale transition-colors ${dm.text}`}
              aria-label="My Account"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <span className={`text-sm hidden sm:inline ${dm.textSoft}`}>
              Hi, {profile?.name?.split(' ')[0] || 'there'}
            </span>
            <button
              onClick={handleLogout}
              className={`hidden sm:inline-flex text-sm font-semibold border px-4 py-2 rounded-full transition-colors ${dm.border} ${dm.textSoft} hover:text-yellow-deep`}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className={`font-display font-bold text-2xl md:text-3xl ${dm.text}`}>
              Welcome back, {profile?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className={`mt-2 ${dm.textSoft}`}>Browse products and services from trusted sellers across Nigeria.</p>
          </div>

          {/* Payment protection banner */}
          {showBanner && (
            <div className={`${dm.banner} rounded-2xl p-5 flex items-start gap-3 transition-all duration-700`}>
              <span className="text-xl">🔒</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${dm.text}`}>How your payment is protected</p>
                <p className={`text-xs mt-1 ${dm.textSoft}`}>
                  When you pay, YourCart holds the money safely — it isn't released to the seller until you confirm you've received your order. If anything goes wrong, our team will step in.
                </p>
              </div>
              <button onClick={() => setShowBanner(false)} className={`${dm.textSoft} hover:text-yellow-deep text-lg leading-none`}>✕</button>
            </div>
          )}

          {/* Search + tab switcher */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'products' ? 'Search products...' : 'Search services...'}
              className={`border rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-yellow-deep w-full sm:w-64 ${dm.input}`}
            />

            {/* Products / Services toggle */}
            <div className={`flex rounded-full border p-1 self-start sm:self-auto ${dm.border}`}>
              <button
                onClick={() => setTab('products')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  tab === 'products'
                    ? 'bg-ink text-white dark:bg-yellow-400 dark:text-gray-950'
                    : `${dm.textSoft} hover:text-yellow-deep`
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setTab('services')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  tab === 'services'
                    ? 'bg-ink text-white dark:bg-yellow-400 dark:text-gray-950'
                    : `${dm.textSoft} hover:text-yellow-deep`
                }`}
              >
                Services
              </button>
            </div>
          </div>
        </div>

        {/* ── Products tab ── */}
        {tab === 'products' && (
          productsLoading ? (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-10">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`rounded-2xl border overflow-hidden animate-pulse ${dm.card}`}>
                  <div className={`aspect-square ${dm.skeleton}`} />
                  <div className="p-3 space-y-2">
                    <div className={`h-3 rounded-full w-3/4 ${dm.skeletonLine}`} />
                    <div className={`h-3 rounded-full w-1/2 ${dm.skeletonLine}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={`mt-10 border border-dashed rounded-3xl py-16 text-center ${dm.border}`}>
              <p className={dm.textSoft}>
                {search ? 'No products match your search.' : 'No products available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-10">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} linkTo={`/product/${p.id}`} dark={dark} />
              ))}
            </div>
          )
        )}

        {/* ── Services tab ── */}
        {tab === 'services' && (
          servicesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`rounded-2xl border overflow-hidden animate-pulse ${dm.card}`}>
                  <div className="p-5 space-y-3">
                    <div className={`h-4 rounded-full w-3/4 ${dm.skeletonLine}`} />
                    <div className={`h-3 rounded-full w-full ${dm.skeletonLine}`} />
                    <div className={`h-3 rounded-full w-2/3 ${dm.skeletonLine}`} />
                    <div className={`h-4 rounded-full w-1/3 mt-4 ${dm.skeletonLine}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className={`mt-10 border border-dashed rounded-3xl py-16 text-center ${dm.border}`}>
              <p className={dm.textSoft}>
                {search ? 'No services match your search.' : 'No services available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
              {filteredServices.map((s) => (
                <div key={s.id} className={`rounded-2xl border p-5 flex flex-col gap-3 transition-colors ${dm.card}`}>
                  {/* Category badge + verified */}
                  <div className="flex items-center justify-between gap-2">
                    {s.category ? (
                      <span className="text-[11px] font-semibold bg-yellow-pale text-yellow-deep px-2.5 py-0.5 rounded-full">
                        {s.category}
                      </span>
                    ) : <span />}
                    {s.sellerVerified && (
                      <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">✓ Verified</span>
                    )}
                  </div>

                  {/* Title + description */}
                  <div>
                    <p className={`font-semibold text-sm leading-snug ${dm.text}`}>{s.title}</p>
                    <p className={`text-xs mt-1 line-clamp-2 ${dm.textSoft}`}>{s.description}</p>
                  </div>

                  {/* Seller */}
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ${dm.skeleton}`}>
                      {s.sellerPhotoURL && <img src={s.sellerPhotoURL} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <p className={`text-xs ${dm.textSoft}`}>{s.sellerName}</p>
                  </div>

                  {/* Price */}
                  <div className={`mt-auto pt-3 border-t ${dm.border}`}>
                    <p className={`font-bold text-sm ${dm.text}`}>From ₦{Number(s.price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      <BottomNav
        dark={dark}
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
