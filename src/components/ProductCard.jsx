import { Link } from 'react-router-dom'

export default function ProductCard({ product, actions, linkTo }) {
  const content = (
    <div className="border border-line rounded-2xl overflow-hidden hover:border-ink transition-colors">
      <div className="aspect-square bg-yellow-pale">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-soft text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-ink truncate">{product.name}</h3>
        <p className="text-ink font-bold mt-1">₦{Number(product.price).toLocaleString()}</p>
        <p className="text-xs text-ink-soft mt-1">
          Delivery: ₦{Number(product.deliveryFee || 0).toLocaleString()}
        </p>
        {product.sellerName && (
          <p className="text-xs text-ink-soft mt-2">Sold by {product.sellerName}</p>
        )}
        {actions && <div className="mt-3">{actions}</div>}
      </div>
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>
  }
  return content
}