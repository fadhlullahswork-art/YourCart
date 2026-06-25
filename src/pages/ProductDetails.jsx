import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [messaging, setMessaging] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [id])

 async function loadProduct() {
    setLoading(true)
    const snap = await getDoc(doc(db, 'products', id))
    if (snap.exists()) {
      const productData = { id: snap.id, ...snap.data() }

      // Always check the seller's CURRENT verification status, not a stored snapshot
      const sellerSnap = await getDoc(doc(db, 'users', productData.sellerId))
      const isVerified = sellerSnap.exists() && sellerSnap.data()?.verification?.status === 'approved'

      setProduct({ ...productData, sellerVerified: isVerified })
    }
    setLoading(false)
  }

  async function handleMessageSeller() {
    if (!user || !product) return
    setMessaging(true)

    // Check if a conversation for this buyer + product already exists
    const q = query(
      collection(db, 'conversations'),
      where('buyerId', '==', user.uid),
      where('productId', '==', product.id)
    )
    const existing = await getDocs(q)

    if (!existing.empty) {
      navigate(`/messages/${existing.docs[0].id}`)
      return
    }

    // Otherwise create a new conversation
  const newConvo = await addDoc(collection(db, 'conversations'), {
      buyerId: user.uid,
      buyerName: profile?.name || 'Buyer',
      sellerId: product.sellerId,
      sellerName: product.sellerName || 'Seller',
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || '',
      productPrice: product.price,
      deliveryFee: product.deliveryFee || 0,
      lastMessage: '',
      createdAt: serverTimestamp(),
    })

    navigate(`/messages/${newConvo.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft">Product not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/customer/dashboard" className="font-display font-extrabold text-xl text-ink">
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
          <Link to="/customer/dashboard" className="text-sm font-semibold text-ink-soft hover:text-ink">
            ← Back to marketplace
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-yellow-pale">
              {product.images?.[activeImage] ? (
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-soft">
                  No image
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${
                      activeImage === i ? 'border-ink' : 'border-line'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">{product.name}</h1>

            <div className="flex items-center gap-2 mt-3">
              <p className="font-display font-extrabold text-2xl text-ink">
                ₦{Number(product.price).toLocaleString()}
              </p>
              <span className="text-sm text-ink-soft">
                + ₦{Number(product.deliveryFee || 0).toLocaleString()} delivery
              </span>
            </div>

            <p className="text-ink-soft mt-4">{product.description || 'No description provided.'}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs font-medium bg-yellow-pale text-yellow-deep px-3 py-1.5 rounded-full">
                {product.category}
              </span>
              {product.location && (
                <span className="text-xs font-medium bg-line/60 text-ink-soft px-3 py-1.5 rounded-full">
                  {product.location}
                </span>
              )}
            </div>

            {/* Seller info */}
            <div className="border border-line rounded-2xl p-4 mt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{product.sellerName}</p>
                <p className="text-xs text-ink-soft">Seller</p>
              </div>
              {product.sellerVerified ? (
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                  ✓ Verified Seller
                </span>
              ) : (
                <span className="text-xs font-semibold bg-line/60 text-ink-soft px-3 py-1.5 rounded-full">
                  Not yet verified
                </span>
              )}
            </div>

          <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => {
                  addToCart(product)
                  setAdded(true)
                  setTimeout(() => setAdded(false), 2000)
                }}
                className="bg-ink text-white font-semibold px-6 py-3.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors"
              >
                {added ? '✓ Added to Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => {
                  addToCart(product)
                  navigate('/cart')
                }}
                className="border border-line text-ink font-semibold px-6 py-3.5 rounded-full hover:border-ink transition-colors"
              >
                Buy Now
              </button>
              <button
                onClick={handleMessageSeller}
                disabled={messaging}
                className="border border-ink text-ink font-semibold px-6 py-3.5 rounded-full hover:bg-ink hover:text-white transition-colors disabled:opacity-60"
              >
                {messaging ? 'Opening chat...' : 'Message Seller'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}