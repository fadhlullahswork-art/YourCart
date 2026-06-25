import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

const steps = ['paid', 'preparing', 'shipped', 'delivered', 'confirmed']

const stepLabels = {
  paid: 'Payment received',
  preparing: 'Seller preparing item',
  shipped: 'Shipped',
  delivered: 'Out for delivery',
  confirmed: 'Confirmed — completed',
}

function StatusStepper({ status }) {
  if (status === 'disputed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 font-medium">
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
              i <= currentIndex ? 'bg-ink' : 'bg-line'
            }`}
          />
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 ${i < currentIndex ? 'bg-ink' : 'bg-line'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CustomerOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

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
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/customer/dashboard" className="font-display font-extrabold text-xl text-ink">
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
          <Link to="/customer/dashboard" className="text-sm font-semibold text-ink-soft hover:text-ink">
            ← Back to marketplace
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-10">
        <h1 className="font-display font-bold text-2xl text-ink">Your Orders</h1>

        {loading ? (
          <p className="text-ink-soft mt-6">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="mt-10 border border-dashed border-line rounded-3xl py-16 text-center">
            <p className="text-ink-soft">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {orders.map((o) => (
              <div key={o.id} className="border border-line rounded-2xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">Order from {o.sellerName}</p>
                    {o.status !== 'disputed' && (
                      <p className="text-xs text-ink-soft mt-0.5">{stepLabels[o.status] || 'Processing'}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    🔒 Payment held safely
                  </span>
                </div>

                <StatusStepper status={o.status} />

                <div className="mt-4 space-y-2">
                  {o.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-yellow-pale flex-shrink-0">
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-ink-soft flex-1">{item.name} × {item.quantity}</span>
                      <span className="text-ink font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <p className="text-right font-bold text-ink mt-3 pt-3 border-t border-line">
                  Total: ₦{Number(o.total).toLocaleString()}
                </p>

                {o.status === 'disputed' && o.disputeReason && (
                  <p className="text-xs text-red-700 mt-2">Your report: "{o.disputeReason}"</p>
                )}

                {/* Buyer actions — only once seller has shipped, and not already resolved */}
                {(o.status === 'shipped' || o.status === 'delivered') && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-line">
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
                      className="border border-line text-red-600 text-sm font-semibold px-5 py-2.5 rounded-full hover:border-red-300 transition-colors disabled:opacity-60"
                    >
                      Report Issue
                    </button>
                  </div>
                )}

                {o.status === 'confirmed' && (
                  <p className="text-sm text-green-700 font-medium mt-4 pt-4 border-t border-line">
                    ✓ Order completed — payment released to seller
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}