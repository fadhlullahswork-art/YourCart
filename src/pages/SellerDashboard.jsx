import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import NotificationBell from '../components/NotificationBell.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { signOut } from 'firebase/auth'
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc, orderBy } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import AddProductForm from '../components/AddProductForm.jsx'
import ProductCard from '../components/ProductCard.jsx'

const CLOUDINARY_CLOUD_NAME = 'dzbn1ymxq'
const CLOUDINARY_UPLOAD_PRESET = 'yourcart_unsigned'

async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!response.ok) throw new Error('Upload failed')
  const data = await response.json()
  return data.secure_url
}

export default function SellerDashboard() {
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()
  const [tab, setTab] = useState('products')
  const [meSection, setMeSection] = useState(null) // null = menu, or 'store' | 'verification' | 'payment' | 'earnings'

  const [storeName, setStoreName] = useState(profile?.verification?.storeName || '')
  const [category, setCategory] = useState(profile?.verification?.category || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [bankForm, setBankForm] = useState({
    bankName: profile?.bankDetails?.bankName || '',
    accountNumber: profile?.bankDetails?.accountNumber || '',
    accountName: profile?.bankDetails?.accountName || '',
  })
  const [bankSaving, setBankSaving] = useState(false)
  const [bankSaved, setBankSaved] = useState(false)
  const [bankError, setBankError] = useState('')

  const [verifyForm, setVerifyForm] = useState({
    fullName: profile?.name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    idDocument: null,
  })
  const [verifySubmitting, setVerifySubmitting] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)

  useEffect(() => {
    if (tab === 'products') loadProducts()
    if (tab === 'messages') loadConversations()
    if (tab === 'orders' || tab === 'earnings' || meSection === 'earnings') loadOrders()
  }, [tab, meSection, user])

  async function loadProducts() {
    if (!user) return
    setProductsLoading(true)
    const q = query(collection(db, 'products'), where('sellerId', '==', user.uid))
    const snap = await getDocs(q)
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setProductsLoading(false)
  }

  async function loadOrders() {
    if (!user) return
    setOrdersLoading(true)
    const q = query(collection(db, 'orders'), where('sellerId', '==', user.uid), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setOrdersLoading(false)
  }

  async function handleUpdateOrderStatus(orderId, newStatus) {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus })
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
  }

  async function loadConversations() {
    if (!user) return
    setConversationsLoading(true)
    const q = query(collection(db, 'conversations'), where('sellerId', '==', user.uid))
    const snap = await getDocs(q)
    setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setConversationsLoading(false)
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  async function handleSaveStore(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await updateDoc(doc(db, 'users', user.uid), {
      'verification.storeName': storeName,
      'verification.category': category,
    })
    setSaving(false)
    setSaved(true)
  }

  async function handleDeleteProduct(productId) {
    if (!confirm('Remove this product?')) return
    await deleteDoc(doc(db, 'products', productId))
    setProducts(products.filter((p) => p.id !== productId))
  }

  async function handleSubmitVerification(e) {
    e.preventDefault()
    setVerifyError('')

    if (!verifyForm.fullName || !verifyForm.phone || !verifyForm.location || !verifyForm.idDocument) {
      setVerifyError('Please fill in every field and upload your ID document.')
      return
    }

    setVerifySubmitting(true)
    try {
      const idUrl = await uploadToCloudinary(verifyForm.idDocument)

      await updateDoc(doc(db, 'users', user.uid), {
        phone: verifyForm.phone,
        location: verifyForm.location,
        'verification.fullName': verifyForm.fullName,
        'verification.idDocumentUrl': idUrl,
        'verification.status': 'pending',
        'verification.submittedAt': new Date().toISOString(),
      })

      alert('Verification submitted. An admin will review it shortly.')
    } catch (err) {
      console.error(err)
      setVerifyError('Something went wrong submitting your verification. Please try again.')
    }
    setVerifySubmitting(false)
  }

  async function handleSaveBankDetails(e) {
    e.preventDefault()
    setBankError('')
    setBankSaved(false)

    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName) {
      setBankError('Please fill in every field.')
      return
    }
    if (!/^\d{10}$/.test(bankForm.accountNumber)) {
      setBankError('Account number must be exactly 10 digits.')
      return
    }

    setBankSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bankDetails: {
          bankName: bankForm.bankName,
          accountNumber: bankForm.accountNumber,
          accountName: bankForm.accountName,
          status: 'pending',
        },
      })
      setBankSaved(true)
    } catch (err) {
      console.error(err)
      setBankError('Something went wrong saving your bank details. Please try again.')
    }
    setBankSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft">Loading...</p>
      </div>
    )
  }
 async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Could not upload photo. Please try again.')
      setPhotoUploading(false)
    }
    e.target.value = ''
  }

  const verificationStatus = profile?.verification?.status || 'pending'

  // ---- Reusable section content (used by BOTH desktop tabs and mobile "Me" menu) ----

  const storeProfileContent = (
    <form onSubmit={handleSaveStore} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Store Name</label>
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          type="text"
          className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
          placeholder="e.g. ABC Store"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          type="text"
          className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
          placeholder="e.g. Fashion, Electronics"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Store Profile'}
      </button>
      {saved && <p className="text-sm text-green-700">Store profile saved.</p>}
    </form>
  )

  const verificationContent = (
    <div className="max-w-md">
      {verificationStatus === 'approved' ? (
        <div className="border border-green-200 bg-green-50 rounded-2xl p-5">
          <p className="font-semibold text-green-700">✓ Your account is verified</p>
          <p className="text-sm text-green-700 mt-1">Buyers can see your store as a Verified Seller.</p>
        </div>
      ) : (
        <>
          {verificationStatus === 'rejected' && (
            <div className="border border-red-200 bg-red-50 rounded-2xl p-4 mb-5">
              <p className="text-sm text-red-700">
                Your last submission was rejected. Please check your details and resubmit.
              </p>
            </div>
          )}
          {verificationStatus === 'pending' && profile?.verification?.idDocumentUrl && (
            <div className="border border-yellow-200 bg-yellow-pale rounded-2xl p-4 mb-5">
              <p className="text-sm text-yellow-deep font-medium">Your verification is under review.</p>
            </div>
          )}

          <form onSubmit={handleSubmitVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
              <input
                value={verifyForm.fullName}
                onChange={(e) => setVerifyForm({ ...verifyForm, fullName: e.target.value })}
                type="text"
                className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Phone Number</label>
              <input
                value={verifyForm.phone}
                onChange={(e) => setVerifyForm({ ...verifyForm, phone: e.target.value })}
                type="tel"
                className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Location</label>
              <input
                value={verifyForm.location}
                onChange={(e) => setVerifyForm({ ...verifyForm, location: e.target.value })}
                type="text"
                className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Upload ID Document (NIN slip, driver's license, or international passport)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setVerifyForm({ ...verifyForm, idDocument: e.target.files[0] })}
                className="w-full text-sm text-ink-soft"
              />
            </div>

            {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}

            <button
              type="submit"
              disabled={verifySubmitting}
              className="bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60"
            >
              {verifySubmitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>
        </>
      )}
    </div>
  )

  const paymentContent = (
    <div className="max-w-md">
      <p className="text-sm text-ink-soft mb-5">
        Add the bank account where you'll receive payouts after buyers confirm their orders. Only
        you and YourCart admin can see these details — buyers never see your bank information.
      </p>

      {profile?.bankDetails?.status === 'verified' && (
        <div className="border border-green-200 bg-green-50 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-green-700">✓ Verified for payouts</p>
        </div>
      )}
      {profile?.bankDetails?.status === 'pending' && (
        <div className="border border-yellow-200 bg-yellow-pale rounded-2xl p-4 mb-5">
          <p className="text-sm font-medium text-yellow-deep">Saved — pending verification by admin</p>
        </div>
      )}

      <form onSubmit={handleSaveBankDetails} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Bank Name</label>
          <input
            value={bankForm.bankName}
            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
            type="text"
            className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
            placeholder="e.g. GTBank"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Account Number</label>
          <input
            value={bankForm.accountNumber}
            onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
            type="text"
            inputMode="numeric"
            maxLength={10}
            className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
            placeholder="0123456789"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Account Name</label>
          <input
            value={bankForm.accountName}
            onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
            type="text"
            className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
            placeholder="Must match your bank account"
          />
        </div>

        {bankError && <p className="text-sm text-red-600">{bankError}</p>}

        <button
          type="submit"
          disabled={bankSaving}
          className="bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60"
        >
          {bankSaving ? 'Saving...' : 'Save Bank Details'}
        </button>
        {bankSaved && <p className="text-sm text-green-700">Bank details saved successfully.</p>}
      </form>
    </div>
  )

  const earningsContent = (() => {
    const completedOrders = orders.filter((o) => o.status === 'confirmed')
    const pendingOrders = orders.filter((o) => o.status !== 'confirmed' && o.status !== 'disputed')
    const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const pendingPayment = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0)

    return (
      <div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Sales', value: totalSales },
            { label: 'Pending Payment', value: pendingPayment },
            { label: 'Available Balance', value: totalSales },
          ].map((s) => (
            <div key={s.label} className="border border-line rounded-2xl p-5">
              <p className="text-xs text-ink-soft">{s.label}</p>
              <p className="font-display font-bold text-xl text-ink mt-1">₦{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-soft mt-4">
          Note: these figures will update automatically as your orders move to "Completed."
        </p>
        {!profile?.bankDetails && (
          <p className="text-sm text-yellow-deep mt-3 font-medium">
            ⚠ Add your bank details under "Payment Setup" so we know where to send your payouts.
          </p>
        )}
      </div>
    )
  })()

  const meMenuItems = [
    { id: 'store', label: 'Store Profile' },
    { id: 'verification', label: 'Verification' },
    { id: 'payment', label: 'Payment Setup' },
    { id: 'earnings', label: 'Earnings' },
  ]

  const meSectionContent = {
    store: storeProfileContent,
    verification: verificationContent,
    payment: paymentContent,
    earnings: earningsContent,
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-extrabold text-xl text-ink">
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
        <div className="flex items-center gap-4">
            <NotificationBell />
          <div className="relative flex-shrink-0">
              <label className="w-9 h-9 rounded-full overflow-hidden bg-yellow-pale cursor-pointer block">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-soft text-xs">
                    +
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={photoUploading} />
              </label>
             {verificationStatus === 'approved' && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-[9px] border-2 border-white">
                  ✓
                </span>
              )}
            </div>
            <span className="text-sm text-ink-soft hidden sm:inline">
              {profile?.name?.split(' ')[0] || 'Seller'}
            </span>
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex text-sm font-semibold border border-line px-4 py-2 rounded-full hover:border-ink transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">Seller Dashboard</h1>
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              verificationStatus === 'approved'
                ? 'bg-green-100 text-green-700'
                : verificationStatus === 'rejected'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-pale text-yellow-deep'
            }`}
          >
            Verification: {verificationStatus}
          </span>
        </div>

        <div className="bg-yellow-pale rounded-2xl p-5 mt-6 flex items-start gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <p className="text-sm font-semibold text-ink">How payouts work</p>
            <p className="text-xs text-ink-soft mt-1">
              When a buyer pays, YourCart holds the money securely. Once you mark an order as
              shipped and the buyer confirms they've received it, the payment is released to your
              balance. This protects both you and the buyer.
            </p>
          </div>
        </div>

        {/* Desktop-only tab bar — on mobile, the bottom nav + "Me" menu replace this */}
        <div className="hidden md:flex gap-2 mt-8 border-b border-line overflow-x-auto">
          {[
            { id: 'store', label: 'Store Profile' },
            { id: 'verification', label: 'Verification' },
            { id: 'payment', label: 'Payment Setup' },
            { id: 'products', label: 'Products' },
            { id: 'orders', label: 'Orders' },
            { id: 'messages', label: 'Messages' },
            { id: 'earnings', label: 'Earnings' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? 'border-ink text-ink' : 'border-transparent text-ink-soft'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* On mobile, a simple heading instead of the tab bar */}
        <h2 className="md:hidden mt-8 font-display font-bold text-lg text-ink capitalize">
          {tab === 'me' ? 'Me' : tab}
        </h2>

        <div className="mt-6 md:mt-8">
          {tab === 'store' && storeProfileContent}
          {tab === 'verification' && verificationContent}
          {tab === 'payment' && paymentContent}

          {tab === 'products' && (
            <div>
              <h2 className="font-display font-semibold text-lg text-ink mb-4 hidden md:block">
                Add a new product
              </h2>
              <AddProductForm onAdded={loadProducts} />

              <h2 className="font-display font-semibold text-lg text-ink mt-12 mb-4">Your products</h2>
              {productsLoading ? (
                <p className="text-ink-soft">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-ink-soft">You haven't added any products yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      actions={
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-sm font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'orders' && (
            <div>
              {ordersLoading ? (
                <p className="text-ink-soft">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="border border-dashed border-line rounded-3xl py-16 text-center">
                  <p className="text-ink-soft">No orders yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  {orders.map((o) => (
                    <div key={o.id} className="border border-line rounded-2xl p-5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-semibold text-ink">Order from {o.buyerName}</p>
                          {o.status === 'disputed' ? (
                            <span className="inline-block mt-1 text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                              Issue reported by buyer
                            </span>
                          ) : (
                            <span className="inline-block mt-1 text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                              🔒 Payment secured
                            </span>
                          )}
                        </div>

                        {(o.status === 'paid' || o.status === 'preparing' || o.status === 'shipped') && (
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="text-xs font-semibold border border-line rounded-full px-3 py-1.5 focus:outline-none focus:border-ink"
                          >
                            <option value="paid">Payment received</option>
                            <option value="preparing">Preparing item</option>
                            <option value="shipped">Shipped</option>
                          </select>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
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

                      {o.status === 'shipped' && (
                        <p className="text-xs text-ink-soft mt-3 pt-3 border-t border-line">
                          Waiting for buyer to confirm receipt before payout is released.
                        </p>
                      )}
                      {o.status === 'confirmed' && (
                        <p className="text-sm text-green-700 font-medium mt-3 pt-3 border-t border-line">
                          ✓ Buyer confirmed — payout released to your balance
                        </p>
                      )}
                      {o.status === 'disputed' && o.disputeReason && (
                        <p className="text-sm text-red-700 mt-3 pt-3 border-t border-line">
                          Buyer's report: "{o.disputeReason}" — our team will reach out to resolve this.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'messages' && (
            <div>
              {conversationsLoading ? (
                <p className="text-ink-soft">Loading messages...</p>
              ) : conversations.length === 0 ? (
                <div className="border border-dashed border-line rounded-3xl py-16 text-center">
                  <p className="text-ink-soft">No messages yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-xl">
                  {conversations.map((c) => (
                    <Link
                      key={c.id}
                      to={`/messages/${c.id}`}
                      className="flex items-center gap-3 border border-line rounded-2xl p-4 hover:border-ink transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-yellow-pale flex-shrink-0">
                        {c.productImage && <img src={c.productImage} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{c.productName}</p>
                        <p className="text-xs text-ink-soft truncate">
                          {c.buyerName}: {c.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'earnings' && earningsContent}

          {/* "Me" — mobile-only consolidated menu covering Store Profile, Verification, Payment, Earnings */}
          {tab === 'me' && (
            <div>
              {meSection === null ? (
                <div className="space-y-2 max-w-md">
                  {meMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setMeSection(item.id)}
                      className="w-full flex items-center justify-between border border-line rounded-2xl px-4 py-3.5 text-left hover:border-ink transition-colors"
                    >
                      <span className="text-sm font-semibold text-ink">{item.label}</span>
                      <span className="text-ink-soft">→</span>
                    </button>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full border border-line text-red-600 font-semibold py-3.5 rounded-full hover:border-red-300 transition-colors mt-4"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setMeSection(null)}
                    className="text-sm font-semibold text-ink-soft hover:text-ink mb-5"
                  >
                    ← Back
                  </button>
                  {meSectionContent[meSection]}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav
        items={[
          { label: 'Store', icon: 'store', onClick: () => setTab('products'), active: tab === 'products' },
          { label: 'Orders', icon: 'orders', onClick: () => setTab('orders'), active: tab === 'orders' },
          { label: 'Messages', icon: 'messages', onClick: () => setTab('messages'), active: tab === 'messages' },
          {
            label: 'Me',
            icon: 'account',
            onClick: () => {
              setTab('me')
              setMeSection(null)
            },
            active: tab === 'me',
          },
        ]}
      />
      <div className="h-16 md:hidden" />
    </div>
  )
}