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

  if (!response.ok) {
    throw new Error('Image upload failed')
  }

  const data = await response.json()
  return data.secure_url
}

export default function AddProductForm({ onAdded }) {
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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleFiles(e) {
    setFiles(Array.from(e.target.files).slice(0, 4)) // max 4 images
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
      // Upload each image to Cloudinary, collect their URLs
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

      setForm({
        name: '',
        description: '',
        category: '',
        price: '',
        quantity: '',
        location: '',
        deliveryFee: '',
      })
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
        <label className="block text-sm font-medium text-ink mb-1.5">Product Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          type="text"
          className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
          placeholder="e.g. Black Sneakers"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
          placeholder="Describe the product"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Category</label>
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          type="text"
          className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
          placeholder="e.g. Fashion"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Price (₦)</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            type="number"
            min="0"
            className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
            placeholder="15000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Quantity</label>
          <input
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            type="number"
            min="0"
            className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
            placeholder="10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            type="text"
            className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
            placeholder="e.g. Lagos"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Delivery Fee (₦)</label>
          <input
            name="deliveryFee"
            value={form.deliveryFee}
            onChange={handleChange}
            type="number"
            min="0"
            className="w-full border border-line rounded-xl px-4 py-3 focus:outline-none focus:border-ink"
            placeholder="1500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Product Images (up to 4)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="w-full text-sm text-ink-soft"
        />
        {files.length > 0 && (
          <p className="text-xs text-ink-soft mt-1">{files.length} image(s) selected</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors disabled:opacity-60"
      >
        {uploading ? 'Uploading...' : 'Add Product'}
      </button>
    </form>
  )
}