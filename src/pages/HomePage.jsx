import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <>
      <header>
        <div className="navbar">
          <div className="logo">MediLocator</div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/login">Login/Register</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Find Medicines & Pharmacies Near You</h1>
          <p>Search medicines, check availability, and locate nearby pharmacies instantly.</p>
          <Link to="/login" className="btn">Get Started</Link>
        </div>
      </section>

      <section className="features">
        <h2>Features</h2>
        <div className="features-list">
          <div className="feature-item">🔍 Search Medicines</div>
          <div className="feature-item">🏥 Nearby Pharmacies</div>
          <div className="feature-item">📍 Location on Map</div>
        </div>
      </section>

      <footer>
        <p>© 2025 MediLocator | Built by Chaithanya</p>
      </footer>
    </>
  );
}
