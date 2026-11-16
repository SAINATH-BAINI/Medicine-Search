import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SearchPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [locationBoxVisible, setLocationBoxVisible] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [searchBarVisible, setSearchBarVisible] = useState(true);
  const [medicine, setMedicine] = useState('');
  const [pharmacyList, setPharmacyList] = useState([]);

  const initMap = () => {
    if (!window.L || mapInstanceRef.current) return;

    const map = window.L.map('map').setView([17.385, 78.4867], 12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
  };

  useEffect(() => {
    initMap();
  }, []);

  const addUserMarker = (lat, lon) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (window.userMarker) {
      map.removeLayer(window.userMarker);
    }

    window.userMarker = window.L.circleMarker([lat, lon], {
      radius: 8,
      fillColor: '#4285F4',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    }).addTo(map).bindPopup('📍 You are here').openPopup();

    map.setView([lat, lon], 13);
  };

  const closePopupAfterDelay = () => {
    setTimeout(() => {
      setLocationBoxVisible(false);
      setSearchBarVisible(true);
    }, 1000);
  };

  const handleDetectLocation = () => {
    setStatusMsg('Detecting location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          sessionStorage.setItem('latitude', lat);
          sessionStorage.setItem('longitude', lon);
          setStatusMsg('✅ Location detected!');
          closePopupAfterDelay();
          addUserMarker(lat, lon);
        },
        (err) => {
          setStatusMsg('❌ Error: ' + err.message);
        }
      );
    } else {
      setStatusMsg('Geolocation not supported.');
    }
  };

  const handleManualLocation = async () => {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
      alert('Please enter a city name.');
      return;
    }

    setStatusMsg('Fetching coordinates for ' + city + '...');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        sessionStorage.setItem('latitude', lat);
        sessionStorage.setItem('longitude', lon);
        setStatusMsg('✅ Coordinates saved for ' + city);
        closePopupAfterDelay();
        addUserMarker(lat, lon);
      } else {
        setStatusMsg('❌ Could not find city.');
      }
    } catch (err) {
      setStatusMsg('⚠️ Network error.');
    }
  };

  const displayResults = (pharmacies) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    if (!Array.isArray(pharmacies) || pharmacies.length === 0) {
      setPharmacyList([]);
      return;
    }

    setPharmacyList(pharmacies);

    pharmacies.forEach((pharma) => {
      const marker = window.L.circleMarker([pharma.latitude, pharma.longitude], {
        radius: 8,
        fillColor: '#FF0000',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map).bindPopup(`<b>${pharma.name}</b><br>${pharma.address}<br>${pharma.city}`);

      marker.on('click', () => {
        map.setView([pharma.latitude, pharma.longitude], 15);
      });

      markersRef.current.push(marker);
    });

    map.setView([pharmacies[0].latitude, pharmacies[0].longitude], 13);
  };

  const searchMedicine = () => {
    const medicineValue = medicine.trim();
    if (!medicineValue) {
      alert('Please enter a medicine name!');
      return;
    }

    const lat = parseFloat(sessionStorage.getItem('latitude'));
    const lon = parseFloat(sessionStorage.getItem('longitude'));

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      alert('Please set your location first 📍');
      return;
    }

    const data = {
      medicineName: medicineValue,
      useAlternative: false,
      userLat: lat,
      userLon: lon
    };

    fetch('http://localhost:8989/api/medicine/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then((res) => res.json())
      .then((result) => displayResults(result))
      .catch((err) => console.error(err));
  };

  return (
    <div className="search-page-body">
      <div className="search-page">
        <header>
          <div className="navbar">
            <div className="logo">MediLocator</div>
            <nav>
              <Link to="/">Home</Link>
              <Link to="/login">Logout</Link>
            </nav>
          </div>
        </header>

        <section className="main-section">
          {searchBarVisible && (
            <div id="searchBar" className="search-bar">
              <input type="text" id="medicineInput" placeholder="Search for medicine..." value={medicine} onChange={(e) => setMedicine(e.target.value)} />
              <button id="searchBtn" className="icon-btn" onClick={searchMedicine}>🔍</button>
              <button id="locationBtn" className="icon-btn" onClick={() => {
                setSearchBarVisible(false);
                setLocationBoxVisible(true);
              }}>📍</button>
            </div>
          )}

          {locationBoxVisible && (
            <div id="locationBox" className="popup">
              <div className="popup-content">
                <h3>📍 Select Location</h3>
                <p>You can detect automatically or enter manually:</p>

                <button id="detectBtn" type="button" onClick={handleDetectLocation}>Detect My Location</button>

                <h5><p>OR</p></h5>

                <input type="text" id="cityInput" placeholder="Enter city name..." />
                <button id="manualBtn" type="button" onClick={handleManualLocation}>Use This City</button>

                <p id="statusMsg">{statusMsg}</p>
              </div>
            </div>
          )}

          <div className="content">
            <div className="left-panel" id="pharmacyList">
              {pharmacyList.length > 0 ? (
                pharmacyList.map((pharma, index) => (
                  <div key={`${pharma.name}-${index}`} className="pharmacy-item" onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([pharma.latitude, pharma.longitude], 15);
                    }
                  }}>
                    <strong>{pharma.name}</strong><br />
                    📍 {pharma.address}, {pharma.city}<br />
                    📞 {pharma.phone}<br />
                    📧 {pharma.email || 'N/A'}<br />
                    📏 Distance: {pharma.distance ? pharma.distance.toFixed(2) : 'N/A'} km
                  </div>
                ))
              ) : (
                <p>No pharmacies found.</p>
              )}
            </div>

            <div className="map" id="map" ref={mapRef}></div>
          </div>
        </section>
      </div>
    </div>
  );
}
