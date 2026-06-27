import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { payWithPaystack } from '../paystack.js'

const CLOUDINARY_CLOUD_NAME = 'dzbn1ymxq'
const CLOUDINARY_UPLOAD_PRESET = 'yourcart_unsigned'

async function uploadToCloudinary(file, resourceType = 'image') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) throw new Error('Upload failed')
  const data = await response.json()
  return data.secure_url
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MessageThread() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const { dark } = useTheme()

  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  const dm = {
    page: dark ? 'bg-[#1e1e1e]' : 'bg-white',
    header: dark ? 'bg-[#252525] border-[#333]' : 'bg-white border-line',
    text: dark ? 'text-gray-100' : 'text-ink',
    textSoft: dark ? 'text-gray-400' : 'text-ink-soft',
    border: dark ? 'border-[#333]' : 'border-line',
    input: dark ? 'bg-[#2e2e2e] border-[#444] text-gray-100 placeholder-gray-500' : 'border-line text-ink',
    bubbleOther: dark ? 'bg-[#2e2e2e] text-gray-100' : 'bg-yellow-pale text-ink',
    recordBar: dark ? 'bg-[#2e2e2e]' : 'bg-yellow-pale',
    iconBtn: dark ? 'border-[#444] text-gray-300 hover:border-yellow-deep' : 'border-line hover:border-ink',
  }

  useEffect(() => {
    async function loadConvo() {
      const snap = await getDoc(doc(db, 'conversations', id))
      if (snap.exists()) setConversation({ id: snap.id, ...snap.data() })
      setLoading(false)
    }
    loadConvo()
  }, [id])

  useEffect(() => {
    const q = query(collection(db, 'conversations', id, 'messages'), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setMessages(msgs)
      msgs.forEach((m) => {
        if (m.senderId !== user.uid && m.read === false) {
          updateDoc(doc(db, 'conversations', id, 'messages', m.id), { read: true })
        }
      })
    })
    return unsubscribe
  }, [id, user.uid])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(data) {
    await addDoc(collection(db, 'conversations', id, 'messages'), {
      senderId: user.uid,
      senderName: profile?.name || 'User',
      createdAt: serverTimestamp(),
      read: false,
      type: 'text',
      ...data,
    })

    const previewText =
      data.type === 'image' ? '📷 Photo' : data.type === 'audio' ? '🎤 Voice message' : data.text

    await updateDoc(doc(db, 'conversations', id), {
      lastMessage: previewText,
      lastMessageAt: serverTimestamp(),
    })
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    const messageText = text.trim()
    setText('')
    await sendMessage({ type: 'text', text: messageText })
  }

  async function handleBuyNow() {
    setPlacingOrder(true)
    try {
      payWithPaystack({
        email: profile?.email || user.email,
        amountNaira: Number(conversation.productPrice || 0) + Number(conversation.deliveryFee || 0),
        onSuccess: async (response) => {
          try {
            await addDoc(collection(db, 'orders'), {
              buyerId: conversation.buyerId,
              buyerName: conversation.buyerName,
              sellerId: conversation.sellerId,
              sellerName: conversation.sellerName,
              items: [
                {
                  productId: conversation.productId,
                  name: conversation.productName,
                  price: conversation.productPrice,
                  quantity: 1,
                  image: conversation.productImage,
                },
              ],
              subtotal: conversation.productPrice,
              deliveryFee: conversation.deliveryFee || 0,
              total: Number(conversation.productPrice || 0) + Number(conversation.deliveryFee || 0),
              status: 'paid',
              disputeReason: null,
              createdAt: serverTimestamp(),
            })

            await sendMessage({
              type: 'text',
              text: `✅ Payment of ₦${Number(conversation.productPrice || 0).toLocaleString()} received. Order placed.`,
            })

            alert('Payment successful! Your order has been placed.')
          } catch (err) {
            console.error(err)
            alert(
              'Payment succeeded, but we could not save your order. Please contact support with reference: ' +
                response.reference
            )
          }
          setPlacingOrder(false)
        },
        onClose: () => {
          setPlacingOrder(false)
        },
      })
    } catch (err) {
      console.error(err)
      alert('Something went wrong starting payment. Please try again.')
      setPlacingOrder(false)
    }
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSending(true)
    try {
      const url = await uploadToCloudinary(file, 'image')
      await sendMessage({ type: 'image', imageUrl: url })
    } catch (err) {
      console.error(err)
      alert('Could not send image. Please try again.')
    }
    setSending(false)
    e.target.value = ''
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        clearInterval(timerRef.current)
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (blob.size > 0) {
          setSending(true)
          try {
            const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
            const url = await uploadToCloudinary(file, 'video')
            await sendMessage({ type: 'audio', audioUrl: url })
          } catch (err) {
            console.error(err)
            alert('Could not send voice message. Please try again.')
          }
          setSending(false)
        }
        setRecordSeconds(0)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordSeconds(0)
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch (err) {
      console.error(err)
      alert('Microphone access was denied or is unavailable.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  function cancelRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop())
      }
      mediaRecorderRef.current.stop()
    }
    clearInterval(timerRef.current)
    setIsRecording(false)
    setRecordSeconds(0)
    audioChunksRef.current = []
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dm.page}`}>
        <p className={dm.textSoft}>Loading...</p>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dm.page}`}>
        <p className={dm.textSoft}>Conversation not found.</p>
      </div>
    )
  }

  const isSeller = profile?.role === 'seller'
  const isAdmin = profile?.role === 'admin'
  const backTo = isAdmin ? '/admin/dashboard' : isSeller ? '/seller/dashboard' : '/customer/dashboard'

  return (
    <div className={`min-h-screen ${dm.page} flex flex-col transition-colors duration-300`}>
      <header className={`border-b ${dm.header}`}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to={backTo} className={`text-sm font-semibold ${dm.textSoft} hover:text-yellow-deep`}>
            ← Back
          </Link>
        </div>
        <div className="max-w-3xl mx-auto px-5 md:px-8 pb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-yellow-pale flex-shrink-0">
            {conversation.productImage ? (
              <img
                src={conversation.productImage}
                alt={conversation.productName}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${dm.text}`}>{conversation.productName}</p>
            <p className={`text-xs ${dm.textSoft}`}>
              ₦{Number(conversation.productPrice || 0).toLocaleString()}
            </p>
          </div>
          {!isSeller && !isAdmin && (
            <button
              onClick={handleBuyNow}
              disabled={placingOrder}
              className="flex-shrink-0 bg-ink text-white text-xs font-semibold px-4 py-2.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60"
            >
              {placingOrder ? 'Processing...' : `Pay ₦${Number(conversation.productPrice || 0).toLocaleString()}`}
            </button>
          )}
        </div>

        <div className={`max-w-3xl mx-auto px-5 md:px-8 pb-3 flex items-center gap-2.5 border-t pt-3 ${dm.border}`}>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-ink flex items-center justify-center flex-shrink-0">
            {isSeller ? (
              <span className="text-white text-xs font-semibold">
                {(conversation.buyerName || '?').charAt(0).toUpperCase()}
              </span>
            ) : conversation.sellerPhotoURL ? (
              <img src={conversation.sellerPhotoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold">
                {(conversation.sellerName || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <p className={`text-sm font-medium ${dm.text}`}>
            {isSeller ? conversation.buyerName : conversation.sellerName}
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-5 md:px-8 py-6 overflow-y-auto">
        {messages.length === 0 ? (
          <p className={`text-sm text-center mt-10 ${dm.textSoft}`}>
            No messages yet. Say hello and ask about this product.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const isMine = m.senderId === user.uid
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl text-sm overflow-hidden ${
                      m.type === 'image' || m.type === 'audio'
                        ? isMine
                          ? 'bg-ink'
                          : dm.bubbleOther
                        : isMine
                        ? 'bg-ink text-white px-4 py-2.5'
                        : `${dm.bubbleOther} px-4 py-2.5`
                    }`}
                  >
                    {m.type === 'image' && (
                      <img
                        src={m.imageUrl}
                        alt="Sent attachment"
                        className="max-w-full max-h-80 object-cover"
                      />
                    )}
                    {m.type === 'audio' && (
                      <audio
                        controls
                        src={m.audioUrl}
                        className="p-2 w-56"
                        style={{ filter: isMine ? 'invert(0)' : 'none' }}
                      />
                    )}
                    {(!m.type || m.type === 'text') && m.text}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <div className={`border-t p-4 ${dm.border}`}>
        <div className="max-w-3xl mx-auto">
          {isRecording ? (
            <div className={`flex items-center gap-3 rounded-full px-4 py-3 ${dm.recordBar}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <span className={`text-sm font-medium flex-1 ${dm.text}`}>
                Recording... {formatTime(recordSeconds)}
              </span>
              <button
                type="button"
                onClick={cancelRecording}
                className={`text-sm font-semibold ${dm.textSoft} hover:text-yellow-deep`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="bg-ink text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors"
              >
                Send
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${dm.iconBtn}`}
                aria-label="Attach image"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </button>

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                type="text"
                placeholder="Type a message..."
                disabled={sending}
                className={`flex-1 border rounded-full px-4 py-3 text-sm focus:outline-none focus:border-yellow-deep disabled:opacity-60 ${dm.input}`}
              />

              {text.trim() ? (
                <button
                  type="submit"
                  className="bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors"
                >
                  Send
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={sending}
                  className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full bg-ink text-white hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-50"
                  aria-label="Record voice message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                </button>
              )}
            </form>
          )}
          {sending && <p className={`text-xs mt-2 ${dm.textSoft}`}>Sending...</p>}
        </div>
      </div>
    </div>
  )
} 