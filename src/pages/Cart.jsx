import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { payWithPaystack } from '../paystack.js'
import { useTheme } from '../context/ThemeContext.jsx'
import BottomNav from '../components/BottomNav.jsx'

export default function Cart() {
  const { dark } = useTheme()
  const dm = {
    page: dark ? 'bg-[#1e1e1e]' : 'bg-white',
    header: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
    text: dark ? 'text-gray-100' : 'text-ink',
    textSoft: dark ? 'text-gray-400' : 'text-ink-soft',
    border: dark ? 'border-[#333]' : 'border-line',
    card: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
  }

  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, deliveryTotal, total } = useCart()
  const [placing, setPlacing] = useState(false)

  async function createOrders() {
    const bySeller = {}
    items.forEach((item) => {
      if (!bySeller[item.sellerId]) bySeller[item.sellerId] = []
      bySeller[item.sellerId].push(item)
    })

    for (const sellerId of Object.keys(bySeller)) {
      const sellerItems = bySeller[sellerId]
      const sellerSubtotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const sellerDelivery = sellerItems.reduce((sum, i) => sum + i.deliveryFee * i.quantity, 0)

      await addDoc(collection(db, 'orders'), {
        buyerId: user.uid,
        buyerName: profile?.name || 'Buyer',
        sellerId,
        sellerName: sellerItems[0].sellerName,
        items: sellerItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        subtotal: sellerSubtotal,
        deliveryFee: sellerDelivery,
        total: sellerSubtotal + sellerDelivery,
        status: 'paid',
        disputeReason: null,
        createdAt: serverTimestamp(),
      })
    }
  }

  async function handlePlaceOrder() {
    if (items.length === 0) return
    setPlacing(true)

    try {
      payWithPaystack({
        email: profile?.email || user.email,
        amountNaira: total,
        onSuccess: async (response) => {
          try {
            await createOrders()
            clearCart()
            navigate('/customer/orders')
          } catch (err) {
            console.error(err)
            alert(
              'Payment succeeded, but we could not save your order. Please contact support with reference: ' +
                response.reference
            )
          }
          setPlacing(false)
        },
        onClose: () => {
          setPlacing(false)
        },
      })
    } catch (err) {
      console.error(err)
      alert('Something went wrong starting payment. Please try again.')
      setPlacing(false)
    }
  }

  return (
    <div className={`min-h-screen ${dm.page} transition-colors duration-300`}>
      <header className={`border-b ${dm.header}`}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/customer/dashboard" className={`font-display font-extrabold text-xl ${dm.text}`}>
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
          <Link to="/customer/dashboard" className={`text-sm font-semibold ${dm.textSoft} hover:text-yellow-deep`}>
            ← Continue shopping
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-10">
        <h1 className={`font-display font-bold text-2xl ${dm.text}`}>Your Cart</h1>

        {items.length === 0 ? (
          <div className={`mt-10 border border-dashed rounded-3xl py-16 text-center ${dm.border}`}>
            <p className={dm.textSoft}>Your cart is empty.</p>
            <Link
              to="/customer/dashboard"
              className={`inline-block mt-4 text-sm font-semibold underline ${dm.text}`}
            >
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className={`flex items-center gap-4 border rounded-2xl p-4 ${dm.card}`}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-yellow-pale flex-shrink-0">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${dm.text}`}>{item.name}</p>
                    <p className={`text-xs ${dm.textSoft}`}>Sold by {item.sellerName}</p>
                    <p className={`text-sm font-bold mt-1 ${dm.text}`}>₦{item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className={`w-8 h-8 rounded-full border ${dm.border} ${dm.text} hover:border-yellow-deep`}
                    >
                      −
                    </button>
                    <span className={`text-sm w-6 text-center ${dm.text}`}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className={`w-8 h-8 rounded-full border ${dm.border} ${dm.text} hover:border-yellow-deep`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className={`border-t mt-8 pt-6 space-y-2 max-w-sm ml-auto ${dm.border}`}>
              <div className={`flex justify-between text-sm ${dm.textSoft}`}>
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className={`flex justify-between text-sm ${dm.textSoft}`}>
                <span>Delivery</span>
                <span>₦{deliveryTotal.toLocaleString()}</span>
              </div>
              <div className={`flex justify-between font-bold text-base pt-2 border-t ${dm.border} ${dm.text}`}>
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full sm:w-auto sm:ml-auto sm:flex bg-ink text-white font-semibold px-8 py-3.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60 mt-6"
            >
              {placing ? 'Opening payment...' : `Pay ₦${total.toLocaleString()}`}
            </button>
          </>
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