import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function CustomerMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'conversations'), where('buyerId', '==', user.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [user])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/customer/dashboard" className="font-display font-extrabold text-xl text-ink">
            Your<span className="text-yellow-deep">Cart</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-8">
        <h1 className="font-display font-bold text-2xl text-ink mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="border border-dashed border-line rounded-3xl py-16 text-center">
            <p className="text-ink-soft">
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
                  className="flex items-center gap-3 border border-line rounded-2xl p-4 hover:border-ink transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-yellow-pale flex-shrink-0">
                    {c.productImage && (
                      <img src={c.productImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{c.productName}</p>
                    <p className="text-xs text-ink-soft truncate">
                      {c.sellerName}: {c.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </main>

      <div className="h-16 md:hidden" />
    </div>
  )
}