import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import NotificationBell from '../components/NotificationBell.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { signOut } from 'firebase/auth'
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import AddProductForm from '../components/AddProductForm.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

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
  const [hasPickedListingType, setHasPickedListingType] = useState(false)
  const [meSection, setMeSection] = useState(null)
  const { dark, setDark } = useTheme()
  const [showStoreSheet, setShowStoreSheet] = useState(false)

  const [storeName, setStoreName] = useState(profile?.verification?.storeName || '')
  const [category, setCategory] = useState(profile?.verification?.category || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

 const [serviceForm, setServiceForm] = useState({
    title: '', description: '', category: '', startingPrice: '', image: null,
  })
  const [serviceSubmitting, setServiceSubmitting] = useState(false)
  const [serviceError, setServiceError] = useState('')

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
    if ((tab === 'products' || tab === 'services') && !hasPickedListingType) {
      setShowStoreSheet(true)
    }
  }, [tab, hasPickedListingType])

  useEffect(() => {
    if (tab === 'products') loadProducts()
    if (tab === 'services') loadServices()
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

  async function loadServices() {
    if (!user) return
    setServicesLoading(true)
    const q = query(collection(db, 'services'), where('sellerId', '==', user.uid))
    const snap = await getDocs(q)
    setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setServicesLoading(false)
  }

async function handleAddService(e) {
    e.preventDefault()
    setServiceError('')
    if (!serviceForm.title || !serviceForm.startingPrice || !serviceForm.category) {
      setServiceError('Please fill in title, category, and starting price.')
      return
    }
    setServiceSubmitting(true)
    try {
      let imageUrl = ''
      if (serviceForm.image) imageUrl = await uploadToCloudinary(serviceForm.image)
      await addDoc(collection(db, 'services'), {
        title: serviceForm.title,
        description: serviceForm.description,
        category: serviceForm.category,
        startingPrice: Number(serviceForm.startingPrice),
        sellerPhotoURL: profile?.photoURL || '',
        imageUrl,
        sellerId: user.uid,
        sellerName: profile?.verification?.storeName || profile?.name || 'Seller',
        sellerVerified: profile?.verification?.status === 'approved',
        type: 'service',
        createdAt: serverTimestamp(),
      })
      setServiceForm({ title: '', description: '', category: '', startingPrice: '', image: null })
      loadServices()
    } catch (err) {
      console.error(err)
      setServiceError('Something went wrong. Please try again.')
    }
    setServiceSubmitting(false)
  }

  async function handleDeleteService(serviceId) {
    if (!confirm('Remove this service?')) return
    await deleteDoc(doc(db, 'services', serviceId))
    setServices(services.filter((s) => s.id !== serviceId))
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
      setVerifyError('Something went wrong. Please try again.')
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
      setBankError('Something went wrong. Please try again.')
    }
    setBankSaving(false)
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

  const dm = {
    page: dark ? 'bg-[#1e1e1e]' : 'bg-white',
    header: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
    text: dark ? 'text-gray-100' : 'text-ink',
    textSoft: dark ? 'text-gray-400' : 'text-ink-soft',
    border: dark ? 'border-[#333]' : 'border-line',
    input: dark ? 'bg-[#2e2e2e] border-[#444] text-gray-100 placeholder-gray-500' : 'border-line text-ink',
    banner: dark ? 'bg-[#2a2700]' : 'bg-yellow-pale',
    card: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
    sheet: dark ? 'bg-[#252525]' : 'bg-white',
    tab: (active) => active
      ? dark ? 'border-yellow-deep text-yellow-deep' : 'border-ink text-ink'
      : dark ? 'border-transparent text-gray-500' : 'border-transparent text-ink-soft',
    btn: dark
      ? 'bg-yellow-deep text-ink hover:bg-yellow font-semibold px-6 py-3 rounded-full transition-colors disabled:opacity-60'
      : 'bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60',
    menuItem: dark ? 'border-[#333] hover:border-yellow-deep' : 'border-line hover:border-ink',
  }

  const verificationStatus = profile?.verification?.status || 'pending'
  const inputClass = `w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-deep ${dm.input}`

  const storeProfileContent = (
    <form onSubmit={handleSaveStore} className="max-w-md space-y-4">
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Store Name</label>
        <input value={storeName} onChange={(e) => setStoreName(e.target.value)} type="text" className={inputClass} placeholder="e.g. ABC Store" />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Category</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} type="text" className={inputClass} placeholder="e.g. Fashion, Electronics" />
      </div>
      <button type="submit" disabled={saving} className={dm.btn}>{saving ? 'Saving...' : 'Save Store Profile'}</button>
      {saved && <p className="text-sm text-green-500">Store profile saved.</p>}
    </form>
  )

  const verificationContent = (
    <div className="max-w-md">
      {verificationStatus === 'approved' ? (
        <div className="border border-green-700 bg-green-900/20 rounded-2xl p-5">
          <p className="font-semibold text-green-400">✓ Your account is verified</p>
          <p className="text-sm text-green-400 mt-1">Buyers can see your store as a Verified Seller.</p>
        </div>
      ) : (
        <>
          {verificationStatus === 'rejected' && (
            <div className={`border rounded-2xl p-4 mb-5 ${dark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'}`}>
              <p className={`text-sm ${dark ? 'text-red-400' : 'text-red-700'}`}>Your last submission was rejected. Please check your details and resubmit.</p>
            </div>
          )}
          {verificationStatus === 'pending' && profile?.verification?.idDocumentUrl && (
            <div className={`border rounded-2xl p-4 mb-5 ${dm.banner}`}>
              <p className="text-sm text-yellow-deep font-medium">Your verification is under review.</p>
            </div>
          )}
          <form onSubmit={handleSubmitVerification} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Full Name</label>
              <input value={verifyForm.fullName} onChange={(e) => setVerifyForm({ ...verifyForm, fullName: e.target.value })} type="text" className={inputClass} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Phone Number</label>
              <input value={verifyForm.phone} onChange={(e) => setVerifyForm({ ...verifyForm, phone: e.target.value })} type="tel" className={inputClass} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Location</label>
              <input value={verifyForm.location} onChange={(e) => setVerifyForm({ ...verifyForm, location: e.target.value })} type="text" className={inputClass} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Upload ID Document</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setVerifyForm({ ...verifyForm, idDocument: e.target.files[0] })} className={`w-full text-sm ${dm.textSoft}`} />
            </div>
            {verifyError && <p className="text-sm text-red-500">{verifyError}</p>}
            <button type="submit" disabled={verifySubmitting} className={dm.btn}>{verifySubmitting ? 'Submitting...' : 'Submit for Verification'}</button>
          </form>
        </>
      )}
    </div>
  )

  const paymentContent = (
    <div className="max-w-md">
      <p className={`text-sm mb-5 ${dm.textSoft}`}>Add the bank account where you'll receive payouts after buyers confirm their orders.</p>
      {profile?.bankDetails?.status === 'verified' && (
        <div className="border border-green-700 bg-green-900/20 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-green-400">✓ Verified for payouts</p>
        </div>
      )}
      {profile?.bankDetails?.status === 'pending' && (
        <div className={`border rounded-2xl p-4 mb-5 ${dm.banner}`}>
          <p className="text-sm font-medium text-yellow-deep">Saved — pending verification by admin</p>
        </div>
      )}
      <form onSubmit={handleSaveBankDetails} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Bank Name</label>
          <input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} type="text" className={inputClass} placeholder="e.g. GTBank" />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Account Number</label>
          <input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })} type="text" inputMode="numeric" maxLength={10} className={inputClass} placeholder="0123456789" />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Account Name</label>
          <input value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} type="text" className={inputClass} placeholder="Must match your bank account" />
        </div>
        {bankError && <p className="text-sm text-red-500">{bankError}</p>}
        <button type="submit" disabled={bankSaving} className={dm.btn}>{bankSaving ? 'Saving...' : 'Save Bank Details'}</button>
        {bankSaved && <p className="text-sm text-green-500">Bank details saved successfully.</p>}
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
            <div key={s.label} className={`border rounded-2xl p-5 ${dm.card}`}>
              <p className={`text-xs ${dm.textSoft}`}>{s.label}</p>
              <p className={`font-display font-bold text-xl mt-1 ${dm.text}`}>₦{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <p className={`text-xs mt-4 ${dm.textSoft}`}>Figures update as orders move to "Completed."</p>
        {!profile?.bankDetails && (
          <p className="text-sm text-yellow-deep mt-3 font-medium">⚠ Add your bank details under "Payment Setup" so we know where to send your payouts.</p>
        )}
      </div>
    )
  })()

  const servicesContent = (
    <div>
      <h2 className={`font-display font-semibold text-lg mb-4 hidden md:block ${dm.text}`}>Add a new service</h2>
      <form onSubmit={handleAddService} className="max-w-md space-y-4 mb-12">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Service Title</label>
          <input value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} type="text" className={inputClass} placeholder="e.g. Logo Design, Video Editing" />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Description</label>
          <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} rows={3} className={inputClass} placeholder="Describe what you offer" />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Category</label>
          <input value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })} type="text" className={inputClass} placeholder="e.g. Design, Writing, Tech" />
        </div>
      <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Starting Price (₦)</label>
          <input value={serviceForm.startingPrice} onChange={(e) => setServiceForm({ ...serviceForm, startingPrice: e.target.value })} type="number" min="0" className={inputClass} placeholder="5000" />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Service Image (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.files[0] })} className={`w-full text-sm ${dm.textSoft}`} />
        </div>
        {serviceError && <p className="text-sm text-red-500">{serviceError}</p>}
        <button type="submit" disabled={serviceSubmitting} className={dm.btn}>{serviceSubmitting ? 'Adding...' : 'Add Service'}</button>
      </form>

      <h2 className={`font-display font-semibold text-lg mb-4 ${dm.text}`}>Your services</h2>
      {servicesLoading ? (
        <p className={dm.textSoft}>Loading services...</p>
      ) : services.length === 0 ? (
        <p className={dm.textSoft}>You haven't added any services yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {services.map((s) => (
            <div key={s.id} className={`border rounded-2xl overflow-hidden ${dm.card}`}>
              {s.imageUrl && <img src={s.imageUrl} alt={s.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <p className={`font-display font-semibold truncate ${dm.text}`}>{s.title}</p>
                <p className={`text-xs mt-1 ${dm.textSoft}`}>{s.category}</p>
               <p className={`font-bold mt-2 ${dm.text}`}>From ₦{Number(s.startingPrice).toLocaleString()}</p>
                <button onClick={() => handleDeleteService(s.id)} className="text-sm font-semibold text-red-500 hover:underline mt-3">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dm.page}`}>
        <p className={dm.textSoft}>Loading...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${dm.page} transition-colors duration-300`}>

      {/* Mobile store picker sheet */}
     {showStoreSheet && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowStoreSheet(false)}
          />
          <div
            className={`rounded-t-3xl p-6 pb-8 ${dm.sheet}`}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-display font-bold text-lg ${dm.text}`}>What are you listing?</h3>
              <button
                type="button"
                onClick={() => setShowStoreSheet(false)}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${dm.textSoft}`}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
           <button
                type="button"
                onClick={() => {
                  setTab('products')
                  setShowStoreSheet(false)
                  setHasPickedListingType(true)
                }}
                className={`flex flex-col items-center gap-2 border rounded-2xl py-5 transition-colors ${
                  tab === 'products' ? 'border-yellow-deep bg-yellow-pale text-ink' : `${dm.border} ${dm.text}`
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <span className="text-sm font-semibold">Products</span>
              </button>
            <button
                type="button"
                onClick={() => {
                  setTab('services')
                  setShowStoreSheet(false)
                  setHasPickedListingType(true)
                }}
                className={`flex flex-col items-center gap-2 border rounded-2xl py-5 transition-colors ${
                  tab === 'services' ? 'border-yellow-deep bg-yellow-pale text-ink' : `${dm.border} ${dm.text}`
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span className="text-sm font-semibold">Services</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={`border-b ${dm.header} transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className={`font-display font-extrabold text-xl ${dm.text}`}>
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationBell />
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
            <div className="relative flex-shrink-0">
              <label className="w-9 h-9 rounded-full overflow-hidden bg-yellow-pale cursor-pointer block">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-xs ${dm.textSoft}`}>+</div>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={photoUploading} />
              </label>
              {verificationStatus === 'approved' && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-[9px] border-2 border-white">✓</span>
              )}
            </div>
            <span className={`text-sm hidden sm:inline ${dm.textSoft}`}>{profile?.name?.split(' ')[0] || 'Seller'}</span>
            <button onClick={handleLogout} className={`hidden sm:inline-flex text-sm font-semibold border px-4 py-2 rounded-full transition-colors ${dm.border} ${dm.textSoft} hover:text-yellow-deep`}>Log Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className={`font-display font-bold text-2xl md:text-3xl ${dm.text}`}>Seller Dashboard</h1>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            verificationStatus === 'approved' ? 'bg-green-100 text-green-700' :
            verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-pale text-yellow-deep'
          }`}>
            Verification: {verificationStatus}
          </span>
        </div>

        <div className={`${dm.banner} rounded-2xl p-5 mt-6 flex items-start gap-3`}>
          <span className="text-xl">🔒</span>
          <div>
            <p className={`text-sm font-semibold ${dm.text}`}>How payouts work</p>
            <p className={`text-xs mt-1 ${dm.textSoft}`}>
              When a buyer pays, YourCart holds the money securely. Once you mark an order as shipped and the buyer confirms receipt, the payment is released to your balance.
            </p>
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex gap-2 mt-8 border-b overflow-x-auto" style={{ borderColor: dark ? '#333' : '' }}>
          {[
            { id: 'store', label: 'Store Profile' },
            { id: 'verification', label: 'Verification' },
            { id: 'payment', label: 'Payment Setup' },
            { id: 'products', label: 'Products' },
            { id: 'services', label: 'Services' },
            { id: 'orders', label: 'Orders' },
            { id: 'messages', label: 'Messages' },
            { id: 'earnings', label: 'Earnings' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${dm.tab(tab === t.id)}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <h2 className={`md:hidden mt-8 font-display font-bold text-lg capitalize ${dm.text}`}>
          {tab === 'me' ? 'Me' : tab}
        </h2>

      <div className="mt-6 md:mt-8">
          {tab === 'store' && storeProfileContent}
          {tab === 'verification' && verificationContent}
          {tab === 'payment' && paymentContent}

          {(tab === 'products' || tab === 'services') && (
            <div className="flex items-center justify-between mb-6">
              <span className={`text-sm font-medium ${dm.textSoft}`}>
                Showing: <span className={dm.text}>{tab === 'products' ? 'Products' : 'Services'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowStoreSheet(true)}
                className={`text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${dm.border} ${dm.textSoft} hover:border-yellow-deep`}
              >
                Switch
              </button>
            </div>
          )}

          {tab === 'services' && servicesContent}

          {tab === 'products' && (
            <div>
              <h2 className={`font-display font-semibold text-lg mb-4 hidden md:block ${dm.text}`}>Add a new product</h2>
              <AddProductForm onAdded={loadProducts} dark={dark} />
              <h2 className={`font-display font-semibold text-lg mt-12 mb-4 ${dm.text}`}>Your products</h2>
              {productsLoading ? (
                <p className={dm.textSoft}>Loading products...</p>
              ) : products.length === 0 ? (
                <p className={dm.textSoft}>You haven't added any products yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      dark={dark}
                      actions={
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-sm font-semibold text-red-500 hover:underline">Remove</button>
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
                <p className={dm.textSoft}>Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className={`border border-dashed rounded-3xl py-16 text-center ${dm.border}`}>
                  <p className={dm.textSoft}>No orders yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  {orders.map((o) => (
                    <div key={o.id} className={`border rounded-2xl p-5 ${dm.card}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className={`text-sm font-semibold ${dm.text}`}>Order from {o.buyerName}</p>
                          {o.status === 'disputed' ? (
                            <span className="inline-block mt-1 text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">Issue reported by buyer</span>
                          ) : (
                            <span className="inline-block mt-1 text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">🔒 Payment secured</span>
                          )}
                        </div>
                        {(o.status === 'paid' || o.status === 'preparing' || o.status === 'shipped') && (
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className={`text-xs font-semibold border rounded-full px-3 py-1.5 focus:outline-none ${dm.input}`}
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
                            <span className={`flex-1 ${dm.textSoft}`}>{item.name} × {item.quantity}</span>
                            <span className={`font-medium ${dm.text}`}>₦{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <p className={`text-right font-bold mt-3 pt-3 border-t ${dm.border} ${dm.text}`}>Total: ₦{Number(o.total).toLocaleString()}</p>
                      {o.status === 'shipped' && <p className={`text-xs mt-3 pt-3 border-t ${dm.border} ${dm.textSoft}`}>Waiting for buyer to confirm receipt before payout is released.</p>}
                      {o.status === 'confirmed' && <p className="text-sm text-green-500 font-medium mt-3 pt-3 border-t border-green-800">✓ Buyer confirmed — payout released to your balance</p>}
                      {o.status === 'disputed' && o.disputeReason && <p className="text-sm text-red-500 mt-3 pt-3 border-t border-red-800">Buyer's report: "{o.disputeReason}" — our team will reach out.</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'messages' && (
            <div>
              {conversationsLoading ? (
                <p className={dm.textSoft}>Loading messages...</p>
              ) : conversations.length === 0 ? (
                <div className={`border border-dashed rounded-3xl py-16 text-center ${dm.border}`}>
                  <p className={dm.textSoft}>No messages yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-xl">
                  {conversations.map((c) => (
                    <Link key={c.id} to={`/messages/${c.id}`} className={`flex items-center gap-3 border rounded-2xl p-4 transition-colors ${dm.card} hover:border-yellow-deep`}>
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-yellow-pale flex-shrink-0">
                        {c.productImage && <img src={c.productImage} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${dm.text}`}>{c.productName}</p>
                        <p className={`text-xs truncate ${dm.textSoft}`}>{c.buyerName}: {c.lastMessage || 'No messages yet'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'earnings' && earningsContent}

          {tab === 'me' && (
            <div>
              {meSection === null ? (
                <div className="space-y-2 max-w-md">
                  {meMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setMeSection(item.id)}
                      className={`w-full flex items-center justify-between border rounded-2xl px-4 py-3.5 text-left transition-colors ${dm.menuItem}`}
                    >
                      <span className={`text-sm font-semibold ${dm.text}`}>{item.label}</span>
                      <span className={dm.textSoft}>→</span>
                    </button>
                  ))}
                  <button onClick={handleLogout} className={`w-full border text-red-500 font-semibold py-3.5 rounded-full transition-colors mt-4 ${dm.border}`}>Log Out</button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setMeSection(null)} className={`text-sm font-semibold mb-5 ${dm.textSoft} hover:text-yellow-deep`}>← Back</button>
                  {meSectionContent[meSection]}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav
        dark={dark}
        items={[
    {
            label: 'Store',
            icon: 'store',
            onClick: () => {
              setTab('products')
              setShowStoreSheet(true)
            },
            active: tab === 'products' || tab === 'services',
          },
          { label: 'Orders', icon: 'orders', onClick: () => setTab('orders'), active: tab === 'orders' },
          { label: 'Messages', icon: 'messages', onClick: () => setTab('messages'), active: tab === 'messages' },
          {
            label: 'Me',
            icon: 'account',
            onClick: () => { setTab('me'); setMeSection(null) },
            active: tab === 'me',
          },
        ]}
      />
      <div className="h-16 md:hidden" />
    </div>
  )
}