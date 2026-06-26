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

      // Always check the seller's CURRENT photo + verification status, not a stored snapshot
      const sellerSnap = await getDoc(doc(db, 'users', productData.sellerId))
      const sellerData = sellerSnap.exists() ? sellerSnap.data() : null

      setProduct({
        ...productData,
        sellerVerified: sellerData?.verification?.status === 'approved',
        sellerPhotoURL: sellerData?.photoURL || '',
      })
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
      sellerPhotoURL: product.sellerPhotoURL || '',
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
           {/* Seller info — sits at the top of the details column, beside the images */}
            <Link
              to={`/seller/${product.sellerId}`}
              className="flex items-center gap-3 mb-5 group"
            >
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink flex items-center justify-center ring-2 ring-line group-hover:ring-yellow transition-all">
                  {product.sellerPhotoURL ? (
                    <img src={product.sellerPhotoURL} alt={product.sellerName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-lg sm:text-xl font-semibold">
                      {(product.sellerName || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {product.sellerVerified && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-ink leading-tight truncate group-hover:underline">
                  {product.sellerName}
                </p>
                <p className="text-sm text-ink-soft leading-tight mt-0.5">
                  {product.sellerVerified ? 'Verified Seller' : 'Not yet verified'}
                  {product.location ? ` · ${product.location}` : ''}
                </p>
              </div>
            </Link>

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