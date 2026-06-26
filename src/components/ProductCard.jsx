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
          <div className="flex items-center gap-1.5 mt-2">
            <div className="relative w-5 h-5 flex-shrink-0">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-yellow-pale">
                {product.sellerPhotoURL && (
                  <img src={product.sellerPhotoURL} alt="" className="w-full h-full object-cover" />
                )}
              </div>
           {product.sellerVerified && (
                <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-green-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold leading-none">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft truncate">{product.sellerName}</p>
          </div>
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