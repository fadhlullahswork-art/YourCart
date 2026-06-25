import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { profile, loading } = useAuth()
  const [tab, setTab] = useState('users')

  const [customers, setCustomers] = useState([])
  const [sellers, setSellers] = useState([])
  const [products, setProducts] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [allOrders, setAllOrders] = useState([])

  useEffect(() => {
    if (tab === 'users' || tab === 'verification') loadUsers()
    if (tab === 'products') loadProducts()
    if (tab === 'disputes' || tab === 'transactions') loadOrders()
  }, [tab])

  async function loadOrders() {
    setDataLoading(true)
    const snap = await getDocs(collection(db, 'orders'))
    setAllOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setDataLoading(false)
  }

  async function handleResolveDispute(orderId, resolution) {
    await updateDoc(doc(db, 'orders', orderId), { status: resolution })
    setAllOrders(allOrders.map((o) => (o.id === orderId ? { ...o, status: resolution } : o)))
  }
  async function handleMarkPaidOut(orderId) {
    if (!confirm('Confirm that you have sent this payout to the seller?')) return
    await updateDoc(doc(db, 'orders', orderId), { payoutStatus: 'paid_out', paidOutAt: new Date().toISOString() })
    setAllOrders(allOrders.map((o) => (o.id === orderId ? { ...o, payoutStatus: 'paid_out' } : o)))
  }

  async function handleVerifyBankDetails(sellerId) {
    await updateDoc(doc(db, 'users', sellerId), { 'bankDetails.status': 'verified' })
    setSellers(sellers.map((s) => (s.id === sellerId ? { ...s, bankDetails: { ...s.bankDetails, status: 'verified' } } : s)))
  }

  async function loadUsers() {
    setDataLoading(true)
    const customersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')))
    const sellersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'seller')))
    setCustomers(customersSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setSellers(sellersSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setDataLoading(false)
  }

  async function loadProducts() {
    setDataLoading(true)
    const snap = await getDocs(collection(db, 'products'))
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setDataLoading(false)
  }

  async function handleApprove(sellerId) {
    await updateDoc(doc(db, 'users', sellerId), { 'verification.status': 'approved' })
    setSellers(sellers.map((s) => (s.id === sellerId ? { ...s, verification: { ...s.verification, status: 'approved' } } : s)))
    setSelectedSeller(null)
  }

  async function handleReject(sellerId) {
    await updateDoc(doc(db, 'users', sellerId), { 'verification.status': 'rejected' })
    setSellers(sellers.map((s) => (s.id === sellerId ? { ...s, verification: { ...s.verification, status: 'rejected' } } : s)))
    setSelectedSeller(null)
  }

  async function handleRemoveProduct(productId) {
    if (!confirm('Remove this product from the marketplace?')) return
    await deleteDoc(doc(db, 'products', productId))
    setProducts(products.filter((p) => p.id !== productId))
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft">Loading...</p>
      </div>
    )
  }

  const pendingSellers = sellers.filter((s) => s.verification?.status === 'pending' && s.verification?.idDocumentUrl)

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-extrabold text-xl text-ink">
            Your<span className="text-yellow-deep">Cart</span>{' '}
            <span className="text-ink-soft text-sm font-medium">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-soft hidden sm:inline">{profile?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold border border-line px-4 py-2 rounded-full hover:border-ink transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col md:flex-row gap-8 py-8">
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:w-56 flex-shrink-0">
          {[
            { id: 'users', label: 'Users' },
            { id: 'verification', label: `Seller Verification${pendingSellers.length ? ` (${pendingSellers.length})` : ''}` },
            { id: 'products', label: 'Products' },
            { id: 'transactions', label: 'Transactions' },
            { id: 'disputes', label: 'Disputes' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-ink text-white' : 'text-ink-soft hover:bg-yellow-pale'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          {tab === 'users' && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-4">Customers ({customers.length})</h2>
              <div className="border border-line rounded-2xl overflow-hidden mb-10">
                <table className="w-full text-sm">
                  <thead className="bg-yellow-pale text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-ink">Name</th>
                      <th className="px-4 py-3 font-semibold text-ink">Email</th>
                      <th className="px-4 py-3 font-semibold text-ink">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-t border-line">
                        <td className="px-4 py-3 text-ink">{c.name}</td>
                        <td className="px-4 py-3 text-ink-soft">{c.email}</td>
                        <td className="px-4 py-3 text-ink-soft">{c.status || 'active'}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                          No customers yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h2 className="font-display font-bold text-xl text-ink mb-4">Sellers ({sellers.length})</h2>
              <div className="border border-line rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-yellow-pale text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-ink">Name</th>
                      <th className="px-4 py-3 font-semibold text-ink">Store</th>
                      <th className="px-4 py-3 font-semibold text-ink">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((s) => (
                      <tr key={s.id} className="border-t border-line">
                        <td className="px-4 py-3 text-ink">{s.name}</td>
                        <td className="px-4 py-3 text-ink-soft">{s.verification?.storeName || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              s.verification?.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : s.verification?.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-pale text-yellow-deep'
                            }`}
                          >
                            {s.verification?.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sellers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                          No sellers yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'verification' && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-4">
                Pending Seller Verifications ({pendingSellers.length})
              </h2>
              {pendingSellers.length === 0 ? (
                <p className="text-ink-soft">No pending verification requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingSellers.map((s) => (
                    <div key={s.id} className="border border-line rounded-2xl p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="font-semibold text-ink">{s.verification?.fullName || s.name}</p>
                          <p className="text-xs text-ink-soft">
                            {s.verification?.storeName || 'No store name'} · {s.phone} · {s.location}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedSeller(s)}
                          className="text-sm font-semibold text-ink border border-line px-4 py-2 rounded-full hover:border-ink"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'products' && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-4">
                All Products ({products.length})
              </h2>
              {dataLoading ? (
                <p className="text-ink-soft">Loading...</p>
              ) : products.length === 0 ? (
                <p className="text-ink-soft">No products yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div key={p.id} className="border border-line rounded-2xl overflow-hidden">
                      <div className="aspect-square bg-yellow-pale">
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                        <p className="text-xs text-ink-soft">₦{Number(p.price).toLocaleString()} · {p.sellerName}</p>
                        <button
                          onClick={() => handleRemoveProduct(p.id)}
                          className="text-xs font-semibold text-red-600 hover:underline mt-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'transactions' && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-4">
                All Transactions ({allOrders.length})
              </h2>
              {dataLoading ? (
                <p className="text-ink-soft">Loading...</p>
              ) : allOrders.length === 0 ? (
                <p className="text-ink-soft">No transactions yet.</p>
              ) : (
                <div className="border border-line rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                 <thead className="bg-yellow-pale text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-ink">Buyer</th>
                        <th className="px-4 py-3 font-semibold text-ink">Seller</th>
                        <th className="px-4 py-3 font-semibold text-ink">Amount</th>
                        <th className="px-4 py-3 font-semibold text-ink">Status</th>
                        <th className="px-4 py-3 font-semibold text-ink">Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders
                        .slice()
                        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                        .map((o) => (
                       <tr key={o.id} className="border-t border-line">
                            <td className="px-4 py-3 text-ink">{o.buyerName}</td>
                            <td className="px-4 py-3 text-ink-soft">{o.sellerName}</td>
                            <td className="px-4 py-3 text-ink font-medium">
                              ₦{Number(o.total || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  o.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : o.status === 'disputed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-pale text-yellow-deep'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {o.status !== 'confirmed' ? (
                                <span className="text-xs text-ink-soft">—</span>
                              ) : o.payoutStatus === 'paid_out' ? (
                                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                                  Paid out
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleMarkPaidOut(o.id)}
                                  className="text-xs font-semibold text-ink underline"
                                >
                                  Mark as paid out
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'disputes' && (
            <div>
              {(() => {
                const disputedOrders = allOrders.filter((o) => o.status === 'disputed')
                return (
                  <>
                    <h2 className="font-display font-bold text-xl text-ink mb-4">
                      Disputed Orders ({disputedOrders.length})
                    </h2>
                    {dataLoading ? (
                      <p className="text-ink-soft">Loading...</p>
                    ) : disputedOrders.length === 0 ? (
                      <p className="text-ink-soft">No disputes right now.</p>
                    ) : (
                      <div className="space-y-4 max-w-2xl">
                        {disputedOrders.map((o) => (
                          <div key={o.id} className="border border-red-200 bg-red-50/40 rounded-2xl p-5">
                            <p className="text-sm font-semibold text-ink">
                              Buyer: {o.buyerName} · Seller: {o.sellerName}
                            </p>
                            <p className="text-sm text-red-700 mt-2">Issue: "{o.disputeReason}"</p>
                            <p className="text-sm text-ink-soft mt-1">
                              Order total: ₦{Number(o.total).toLocaleString()}
                            </p>
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => handleResolveDispute(o.id, 'refunded')}
                                className="text-sm font-semibold border border-line px-4 py-2 rounded-full hover:border-ink"
                              >
                                Refund Buyer
                              </button>
                              <button
                                onClick={() => handleResolveDispute(o.id, 'confirmed')}
                                className="text-sm font-semibold bg-ink text-white px-4 py-2 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors"
                              >
                                Release to Seller
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      {selectedSeller && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5"
          onClick={() => setSelectedSeller(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-lg text-ink">
              {selectedSeller.verification?.fullName || selectedSeller.name}
            </h3>
           <div className="space-y-2 mt-4 text-sm">
              <p><span className="text-ink-soft">Email:</span> {selectedSeller.email}</p>
              <p><span className="text-ink-soft">Phone:</span> {selectedSeller.phone}</p>
              <p><span className="text-ink-soft">Location:</span> {selectedSeller.location}</p>
              <p><span className="text-ink-soft">Store:</span> {selectedSeller.verification?.storeName || '—'}</p>
              <p><span className="text-ink-soft">Category:</span> {selectedSeller.verification?.category || '—'}</p>
            </div>

            {selectedSeller.bankDetails && (
              <div className="border border-line rounded-xl p-3 mt-4 text-sm space-y-1">
                <p className="font-medium text-ink">Bank Details (view only)</p>
                <p className="text-ink-soft">{selectedSeller.bankDetails.bankName}</p>
                <p className="text-ink-soft">{selectedSeller.bankDetails.accountNumber}</p>
                <p className="text-ink-soft">{selectedSeller.bankDetails.accountName}</p>
                {selectedSeller.bankDetails.status === 'verified' ? (
                  <span className="inline-block text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full mt-1">
                    ✓ Verified
                  </span>
                ) : (
                  <button
                    onClick={() => handleVerifyBankDetails(selectedSeller.id)}
                    className="text-xs font-semibold text-ink underline mt-1"
                  >
                    Mark as verified
                  </button>
                )}
              </div>
            )}

            {selectedSeller.verification?.idDocumentUrl && (
              <div className="mt-4">
                <p className="text-sm text-ink-soft mb-2">ID Document:</p>
                <img
                  src={selectedSeller.verification.idDocumentUrl}
                  alt="ID document"
                  className="w-full rounded-xl border border-line"
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleReject(selectedSeller.id)}
                className="flex-1 border border-red-200 text-red-600 font-semibold py-2.5 rounded-full hover:bg-red-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedSeller.id)}
                className="flex-1 bg-ink text-white font-semibold py-2.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}