import { Link } from 'react-router-dom'

export default function ProductCard({ product, actions, linkTo, dark }) {
  const content = (
    <div
      className={`border rounded-2xl overflow-hidden transition-colors ${
        dark ? 'bg-[#252525] border-[#333] hover:border-yellow-deep' : 'border-line hover:border-ink'
      }`}
    >
      <div className="aspect-square bg-yellow-pale">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-sm ${dark ? 'text-gray-500' : 'text-ink-soft'}`}>
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className={`font-display font-semibold truncate ${dark ? 'text-gray-100' : 'text-ink'}`}>
          {product.name}
        </h3>
        <p className={`font-bold mt-1 ${dark ? 'text-gray-100' : 'text-ink'}`}>
          ₦{Number(product.price).toLocaleString()}
        </p>
        <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-ink-soft'}`}>
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
            <p className={`text-xs truncate ${dark ? 'text-gray-400' : 'text-ink-soft'}`}>{product.sellerName}</p>
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