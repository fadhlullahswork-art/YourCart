import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import BottomNav from '../components/BottomNav.jsx'

export default function CustomerMessages() {
  const { user } = useAuth()
  const { dark } = useTheme()
  const [conversations, setConversations] = useState([])

  const dm = {
    page: dark ? 'bg-[#1e1e1e]' : 'bg-white',
    header: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
    text: dark ? 'text-gray-100' : 'text-ink',
    textSoft: dark ? 'text-gray-400' : 'text-ink-soft',
    border: dark ? 'border-[#333]' : 'border-line',
    card: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
  }

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'conversations'), where('buyerId', '==', user.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [user])

  return (
    <div className={`min-h-screen ${dm.page} transition-colors duration-300`}>
      <header className={`border-b ${dm.header}`}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/customer/dashboard" className={`font-display font-extrabold text-xl ${dm.text}`}>
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-8">
        <h1 className={`font-display font-bold text-2xl mb-6 ${dm.text}`}>Messages</h1>

        {conversations.length === 0 ? (
          <div className={`border border-dashed rounded-3xl py-16 text-center ${dm.border}`}>
            <p className={dm.textSoft}>
              No conversations yet. Message a seller from a product page to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations
              .slice()
              .sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0))
              .map((c) => (
                <Link
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className={`flex items-center gap-3 border rounded-2xl p-4 transition-colors ${dm.card} hover:border-yellow-deep`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-yellow-pale flex-shrink-0">
                    {c.productImage && (
                      <img src={c.productImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${dm.text}`}>{c.productName}</p>
                    <p className={`text-xs truncate ${dm.textSoft}`}>
                      {c.sellerName}: {c.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </Link>
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