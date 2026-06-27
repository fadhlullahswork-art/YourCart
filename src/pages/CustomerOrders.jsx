import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import BottomNav from '../components/BottomNav.jsx'

const steps = ['paid', 'preparing', 'shipped', 'delivered', 'confirmed']

const stepLabels = {
  paid: 'Payment received',
  preparing: 'Seller preparing item',
  shipped: 'Shipped',
  delivered: 'Out for delivery',
  confirmed: 'Confirmed — completed',
}

function StatusStepper({ status, dark }) {
  if (status === 'disputed') {
    return (
      <div className={`border rounded-xl px-4 py-2.5 text-sm font-medium ${
        dark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        Issue reported — our team is reviewing this order
      </div>
    )
  }

  const currentIndex = steps.indexOf(status)

  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              i <= currentIndex ? 'bg-yellow-deep' : dark ? 'bg-[#3a3a3a]' : 'bg-line'
            }`}
          />
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 ${i < currentIndex ? 'bg-yellow-deep' : dark ? 'bg-[#3a3a3a]' : 'bg-line'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CustomerOrders() {
  const { user } = useAuth()
  const { dark } = useTheme()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const dm = {
    page: dark ? 'bg-[#1e1e1e]' : 'bg-white',
    header: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
    text: dark ? 'text-gray-100' : 'text-ink',
    textSoft: dark ? 'text-gray-400' : 'text-ink-soft',
    border: dark ? 'border-[#333]' : 'border-line',
    card: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
  }

  useEffect(() => {
    load()
  }, [user])

  async function load() {
    if (!user) return
    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  async function handleConfirmReceived(orderId) {
    setBusyId(orderId)
    await updateDoc(doc(db, 'orders', orderId), { status: 'confirmed' })
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: 'confirmed' } : o)))
    setBusyId(null)
  }

  async function handleReportIssue(orderId) {
    const reason = prompt('Briefly describe the issue with this order:')
    if (!reason) return
    setBusyId(orderId)
    await updateDoc(doc(db, 'orders', orderId), { status: 'disputed', disputeReason: reason })
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: 'disputed', disputeReason: reason } : o)))
    setBusyId(null)
  }

  return (
    <div className={`min-h-screen ${dm.page} transition-colors duration-300`}>
      <header className={`border-b ${dm.header}`}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/customer/dashboard" className={`font-display font-extrabold text-xl ${dm.text}`}>
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
          <Link to="/customer/dashboard" className={`text-sm font-semibold ${dm.textSoft} hover:text-yellow-deep`}>
            ← Back to marketplace
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-10">
        <h1 className={`font-display font-bold text-2xl ${dm.text}`}>Your Orders</h1>

        {loading ? (
          <p className={`mt-6 ${dm.textSoft}`}>Loading...</p>
        ) : orders.length === 0 ? (
          <div className={`mt-10 border border-dashed rounded-3xl py-16 text-center ${dm.border}`}>
            <p className={dm.textSoft}>You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {orders.map((o) => (
              <div key={o.id} className={`border rounded-2xl p-5 ${dm.card}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className={`text-sm font-semibold ${dm.text}`}>Order from {o.sellerName}</p>
                    {o.status !== 'disputed' && (
                      <p className={`text-xs mt-0.5 ${dm.textSoft}`}>{stepLabels[o.status] || 'Processing'}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    🔒 Payment held safely
                  </span>
                </div>

                <StatusStepper status={o.status} dark={dark} />

                <div className="mt-4 space-y-2">
                  {o.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-yellow-pale flex-shrink-0">
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className={`flex-1 ${dm.textSoft}`}>{item.name} × {item.quantity}</span>
                      <span className={`font-medium ${dm.text}`}>₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <p className={`text-right font-bold mt-3 pt-3 border-t ${dm.border} ${dm.text}`}>
                  Total: ₦{Number(o.total).toLocaleString()}
                </p>

                {o.status === 'disputed' && o.disputeReason && (
                  <p className="text-xs text-red-500 mt-2">Your report: "{o.disputeReason}"</p>
                )}

                {(o.status === 'shipped' || o.status === 'delivered') && (
                  <div className={`flex gap-3 mt-4 pt-4 border-t ${dm.border}`}>
                    <button
                      onClick={() => handleConfirmReceived(o.id)}
                      disabled={busyId === o.id}
                      className="bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60"
                    >
                      Confirm Received
                    </button>
                    <button
                      onClick={() => handleReportIssue(o.id)}
                      disabled={busyId === o.id}
                      className={`border text-red-500 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors disabled:opacity-60 ${dm.border} hover:border-red-400`}
                    >
                      Report Issue
                    </button>
                  </div>
                )}

                {o.status === 'confirmed' && (
                  <p className={`text-sm text-green-500 font-medium mt-4 pt-4 border-t ${dm.border}`}>
                    ✓ Order completed — payment released to seller
                  </p>
                )}
              </div>
            ))}
          </div>
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