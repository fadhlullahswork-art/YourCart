import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  query,
  where,
  onSnapshot,
  collectionGroup,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function NotificationBell() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [unreadMap, setUnreadMap] = useState({})

  // Load conversations this user is part of (as buyer or seller)
  useEffect(() => {
    if (!user) return

    const role = profile?.role
    const field = role === 'seller' ? 'sellerId' : 'buyerId'

    const q = query(collection(db, 'conversations'), where(field, '==', user.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [user, profile])

  // Listen for unread messages across all those conversations
 useEffect(() => {
    if (!user || conversations.length === 0) {
      setUnreadMap({})
      return
    }

    const unsubscribers = conversations.map((convo) => {
      const q = query(
        collection(db, 'conversations', convo.id, 'messages'),
        where('read', '==', false)
      )
    return onSnapshot(q, (snap) => {
        if (!user) return
        const unreadFromOthers = snap.docs.filter((d) => d.data().senderId !== user.uid)
        setUnreadMap((prev) => ({ ...prev, [convo.id]: unreadFromOthers.length }))
      })
    })

    return () => unsubscribers.forEach((unsub) => unsub())
  }, [conversations, user])

  const totalUnread = Object.values(unreadMap).reduce((sum, n) => sum + n, 0)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-yellow-pale transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white border-l border-line z-50 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-line">
          <h2 className="font-display font-bold text-lg text-ink">Messages</h2>
          <button onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-4rem)] px-3 py-3 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-ink-soft text-sm text-center mt-10">No conversations yet.</p>
          ) : (
            conversations
              .slice()
              .sort((a, b) => (unreadMap[b.id] || 0) - (unreadMap[a.id] || 0))
              .map((c) => {
                const unread = unreadMap[c.id] || 0
                const otherName = profile?.role === 'seller' ? c.buyerName : c.sellerName
                return (
                  <Link
                    key={c.id}
                    to={`/messages/${c.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl p-3 hover:bg-yellow-pale/60 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-yellow-pale flex-shrink-0">
                      {c.productImage && (
                        <img src={c.productImage} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{c.productName}</p>
                      <p className="text-xs text-ink-soft truncate">
                        {otherName}: {c.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}