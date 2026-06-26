import "./WelcomeScreen.css";

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-illustration">
        <svg viewBox="0 0 320 220" className="float-art">
          <circle cx="80" cy="90" r="22" className="line-shape buyer" />
          <path d="M50 150 Q80 120 110 150" className="line-shape buyer" />
          <rect x="140" y="95" width="40" height="30" rx="6" className="line-shape lock" />
          <path d="M150 95 v-10 a10 10 0 0 1 20 0 v10" className="line-shape lock" />
          <circle cx="240" cy="90" r="22" className="line-shape seller" />
          <path d="M210 150 Q240 120 270 150" className="line-shape seller" />
        </svg>
      </div>

      <div className="welcome-content">
        <h1 className="fade-in">Welcome to YourCart</h1>
        <p className="fade-in delay-1">
          Nigeria's trusted marketplace — buyers and sellers, one safe place.
        </p>

        <div className="feature-cards">
          <div className="card slide-up delay-1">
            <span className="card-icon">🛒</span>
            <p>Shop safely, every time</p>
          </div>
          <div className="card slide-up delay-2">
            <span className="card-icon">🏷️</span>
            <p>List and sell with ease</p>
          </div>
          <div className="card slide-up delay-3">
            <span className="card-icon">🔒</span>
            <p>Every transaction protected</p>
          </div>
        </div>

        <p className="trust-line fade-in delay-2">
          Secure. Verified. Easy to use.
        </p>

        <button className="cta-pulse" onClick={onGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  );
}