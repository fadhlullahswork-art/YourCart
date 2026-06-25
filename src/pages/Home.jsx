import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const whyCards = [
  {
    title: 'Trusted Marketplace',
    text: 'A safer place where buyers and sellers connect and trade with confidence.',
  },
  {
    title: 'Easy Communication',
    text: 'Buyers can chat directly with sellers from the product they are interested in.',
  },
  {
    title: 'Simple Buying Experience',
    text: 'Search, choose, communicate, and order — without the usual back and forth.',
  },
  {
    title: 'Seller Growth',
    text: 'Small businesses can reach more customers without needing their own website.',
  },
]

const escrowSteps = [
  'Buyer chooses a product',
  'Buyer pays securely to YourCart',
  'Payment is held and protected',
  'Seller delivers the product',
  'Buyer confirms it arrived',
  'Seller receives payment',
]

const safetyCards = [
  { title: 'Verified Sellers', text: 'Sellers can complete verification to build trust with buyers.' },
  { title: 'Secure Accounts', text: 'User information and accounts are protected on the platform.' },
  { title: 'Product-Based Chat', text: 'Messages stay attached to the product, so context is never lost.' },
  { title: 'Support System', text: 'Help is available whenever something goes wrong.' },
]

export default function Home() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* HERO */}
      <section id="home" className="pt-32 md:pt-40 pb-16 md:pb-24 px-5 md:px-8 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-semibold tracking-wide uppercase bg-yellow-pale text-yellow-deep px-3 py-1.5 rounded-full">
              Made for Nigerian buyers & sellers
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl leading-[1.05] mt-5 text-ink">
              Buy and sell safely across Nigeria
            </h1>
            <p className="text-ink-soft text-base md:text-lg mt-5 max-w-md">
              YourCart connects buyers and sellers in one trusted marketplace where people can
              discover products, communicate easily, and trade with confidence.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/get-started"
                className="bg-ink text-white font-semibold px-6 py-3.5 rounded-full hover:bg-yellow-deep hover:text-ink transition-colors"
              >
                Start Shopping
              </Link>
              <Link
                to="/get-started"
                className="border border-line text-ink font-semibold px-6 py-3.5 rounded-full hover:border-ink transition-colors"
              >
                Become a Seller
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden bg-yellow-pale">
              <img
                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=900&q=80"
                alt="Nigerian small business owner packaging products to sell online"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 bg-white border border-line rounded-2xl px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hidden sm:block">
              <p className="text-sm font-semibold text-ink">Payment protected</p>
              <p className="text-xs text-ink-soft">Held safely until delivery is confirmed</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY YOURCART */}
      <section id="why" className="py-16 md:py-24 px-5 md:px-8 max-w-6xl mx-auto">
        <div className="max-w-xl">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-ink">Why YourCart?</h2>
          <p className="text-ink-soft mt-4">
            Many people struggle to find trusted sellers, worry about online scams, and find it
            hard to communicate clearly before buying. Small businesses, meanwhile, struggle to
            reach buyers at all. YourCart was built to fix both sides at once.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {whyCards.map((c) => (
            <div key={c.title} className="border border-line rounded-2xl p-6 hover:border-yellow transition-colors">
              <h3 className="font-display font-semibold text-lg text-ink">{c.title}</h3>
              <p className="text-ink-soft text-sm mt-2">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ESCROW — signature section */}
      <section id="escrow" className="py-16 md:py-24 px-5 md:px-8 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-ink">
              Your payment is protected
            </h2>
            <p className="text-ink-soft mt-4 max-w-md">
              YourCart holds your payment securely on the platform until the buying process is
              completed — so sellers can't run off with your money, and buyers can't disappear
              without paying.
            </p>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden mt-8 hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1591696331111-ef9586a5b17a?auto=format&fit=crop&w=900&q=80"
                alt="Secure online payment on a phone"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Connected step flow */}
          <div className="relative pl-8">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-line" />
            <ol className="space-y-7">
              {escrowSteps.map((step, i) => {
                const isProtected = i === 2
                return (
                  <li key={step} className="relative">
                    <span
                      className={`absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-[11px] font-bold ${
                        isProtected
                          ? 'bg-yellow border-yellow-deep text-ink'
                          : 'bg-white border-line text-ink-soft'
                      }`}
                    >
                      {isProtected && <span className="absolute w-full h-full rounded-full bg-yellow animate-ping opacity-40" />}
                      {i + 1}
                    </span>
                    <p className={`text-sm md:text-base ${isProtected ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                      {step}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* YOUTH */}
      <section id="youth" className="py-16 md:py-24 px-5 md:px-8 max-w-6xl mx-auto">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-ink max-w-lg">
          Building opportunities for Nigerian youth
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="rounded-3xl overflow-hidden bg-yellow-pale">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80"
              alt="Young Nigerian entrepreneur working on a laptop"
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3 className="font-display font-semibold text-lg text-ink">For young entrepreneurs</h3>
              <p className="text-ink-soft text-sm mt-2">
                Create a store, sell products, and grow a real business — no website or coding needed.
              </p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden bg-yellow-pale">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
              alt="Nigerian students studying together"
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3 className="font-display font-semibold text-lg text-ink">For students</h3>
              <p className="text-ink-soft text-sm mt-2">
                Earn while you study with a trusted platform that protects your money and your time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section id="trust" className="py-16 md:py-24 px-5 md:px-8 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-ink">Safety comes first</h2>
            <p className="text-ink-soft mt-4 max-w-md">
              YourCart is built around one priority: making this a marketplace people can actually
              trust with their money and their information.
            </p>
            <div className="rounded-3xl overflow-hidden mt-8 hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80"
                alt="Secure identity verification on a phone"
                className="w-full h-72 object-cover"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {safetyCards.map((c) => (
              <div key={c.title} className="border border-line rounded-2xl p-6 hover:border-yellow transition-colors">
                <h3 className="font-display font-semibold text-base text-ink">{c.title}</h3>
                <p className="text-ink-soft text-sm mt-2">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section className="py-16 md:py-24 px-5 md:px-8 max-w-6xl mx-auto">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-ink">Explore products</h2>

        {/* No products yet — wired for real data later */}
        <div className="mt-10 border border-dashed border-line rounded-3xl py-16 text-center">
          <p className="text-ink-soft">No products available yet. Sellers will start adding products soon.</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="support" className="py-16 md:py-24 px-5 md:px-8 max-w-6xl mx-auto">
        <div className="bg-ink rounded-3xl px-8 md:px-16 py-14 md:py-20 text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white">
            Ready to join YourCart?
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link
              to="/get-started"
              className="bg-yellow text-ink font-semibold px-6 py-3.5 rounded-full hover:bg-yellow-deep transition-colors"
            >
              Start Shopping
            </Link>
            <Link
              to="/get-started"
              className="border border-white/30 text-white font-semibold px-6 py-3.5 rounded-full hover:border-white transition-colors"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}