import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

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
  if (!response.ok) throw new Error('Image upload failed')
  const data = await response.json()
  return data.secure_url
}

export default function AddProductForm({ onAdded, dark }) {
  const { user, profile } = useAuth()

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    location: '',
    deliveryFee: '',
  })
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const dm = {
    text: dark ? 'text-gray-100' : 'text-ink',
    textSoft: dark ? 'text-gray-400' : 'text-ink-soft',
    input: dark
      ? 'bg-[#2e2e2e] border-[#444] text-gray-100 placeholder-gray-500'
      : 'border-line text-ink',
    btn: dark
      ? 'bg-yellow-deep text-ink hover:bg-yellow font-semibold px-6 py-3 rounded-full transition-colors disabled:opacity-60'
      : 'bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60',
  }

  const inputClass = `w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-deep ${dm.input}`

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleFiles(e) {
    setFiles(Array.from(e.target.files).slice(0, 4))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.price || !form.quantity || !form.category) {
      setError('Please fill in product name, category, price, and quantity.')
      return
    }
    setUploading(true)
    try {
      const imageUrls = []
      for (const file of files) {
        const url = await uploadToCloudinary(file)
        imageUrls.push(url)
      }
      await addDoc(collection(db, 'products'), {
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
        location: form.location,
        deliveryFee: Number(form.deliveryFee || 0),
        images: imageUrls,
        sellerId: user.uid,
        sellerName: profile?.verification?.storeName || profile?.name || 'Seller',
        sellerVerified: profile?.verification?.status === 'approved',
        sellerPhotoURL: profile?.photoURL || '',
        createdAt: serverTimestamp(),
      })
      setForm({ name: '', description: '', category: '', price: '', quantity: '', location: '', deliveryFee: '' })
      setFiles([])
      setUploading(false)
      onAdded?.()
    } catch (err) {
      console.error(err)
      setError('Something went wrong while adding the product. Please try again.')
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Product Name</label>
        <input name="name" value={form.name} onChange={handleChange} type="text" className={inputClass} placeholder="e.g. Black Sneakers" />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputClass} placeholder="Describe the product" />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Category</label>
        <input name="category" value={form.category} onChange={handleChange} type="text" className={inputClass} placeholder="e.g. Fashion" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Price (₦)</label>
          <input name="price" value={form.price} onChange={handleChange} type="number" min="0" className={inputClass} placeholder="15000" />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Quantity</label>
          <input name="quantity" value={form.quantity} onChange={handleChange} type="number" min="0" className={inputClass} placeholder="10" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Location</label>
          <input name="location" value={form.location} onChange={handleChange} type="text" className={inputClass} placeholder="e.g. Lagos" />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Delivery Fee (₦)</label>
          <input name="deliveryFee" value={form.deliveryFee} onChange={handleChange} type="number" min="0" className={inputClass} placeholder="1500" />
        </div>
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${dm.text}`}>Product Images (up to 4)</label>
        <input type="file" accept="image/*" multiple onChange={handleFiles} className={`w-full text-sm ${dm.textSoft}`} />
        {files.length > 0 && <p className={`text-xs mt-1 ${dm.textSoft}`}>{files.length} image(s) selected</p>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={uploading} className={dm.btn}>
        {uploading ? 'Uploading...' : 'Add Product'}
      </button>
    </form>
  )
}