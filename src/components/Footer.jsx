const links = [
  { label: 'Home', href: '#home' },
  { label: 'Why YourCart', href: '#why' },
  { label: 'Escrow', href: '#escrow' },
  { label: 'Youth', href: '#youth' },
  { label: 'Safety', href: '#trust' },
  { label: 'Support', href: '#support' },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="font-display font-extrabold text-lg text-ink">
            Your<span className="text-yellow-deep">Cart</span>
          </p>
          <p className="text-sm text-ink-soft mt-1">Buy and sell safely across Nigeria.</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-ink transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-line">
        <p className="max-w-6xl mx-auto px-5 md:px-8 py-5 text-xs text-ink-soft">
          © {new Date().getFullYear()} YourCart. All rights reserved.
        </p>
      </div>
    </footer>
  )
}