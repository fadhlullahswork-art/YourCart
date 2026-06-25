import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Why YourCart', href: '#why' },
  { label: 'Escrow', href: '#escrow' },
  { label: 'Youth', href: '#youth' },
  { label: 'Safety', href: '#trust' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md border-b border-line' : 'bg-white/0 border-b border-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <a href="#home" className="font-display font-extrabold text-xl tracking-tight text-ink">
          Your<span className="text-yellow-deep">Cart</span>
        </a>

        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-soft">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-ink transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-ink-soft hover:text-ink px-3 py-2 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/get-started"
            className="text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors"
          >
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span className={`block h-0.5 w-6 bg-ink transition-transform ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-6 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-ink transition-transform ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-white border-t border-line px-5 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-ink-soft font-medium">
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-line">
            <Link to="/login" onClick={() => setOpen(false)} className="text-center font-semibold py-2.5 text-ink-soft">
              Login
            </Link>
            <Link
              to="/get-started"
              onClick={() => setOpen(false)}
              className="text-center font-semibold bg-ink text-white py-2.5 rounded-full"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}