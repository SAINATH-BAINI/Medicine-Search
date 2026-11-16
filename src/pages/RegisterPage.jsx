import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [role, setRole] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [showOtpPage, setShowOtpPage] = useState(false);
  const [timer, setTimer] = useState(300);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    passwordHashed: '',
    confirmPassword: '',
    pharmacyName: '',
    licenseId: '',
    isRural: 'yes',
    openingTime: '',
    closingTime: '',
    hno: '',
    street: '',
    area: '',
    city: '',
    state: '',
    pincode: ''
  });

  const handleInput = (event) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const toggleForm = () => {
    const pharmacyFields = document.getElementById('pharmacy-fields');
    if (pharmacyFields) {
      pharmacyFields.classList.toggle('hidden', role !== 'pharmacy');
    }
  };

  const startTimer = () => {
    setTimer(300);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const showOtpPageFn = () => {
    if (!formData.email) {
      alert('Please enter email first!');
      return;
    }

    fetch('http://localhost:8989/otp/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email })
    })
      .then((res) => res.text())
      .then((result) => {
        if (result.toLowerCase().includes('otp sent')) {
          alert(result);
          setShowOtpPage(true);
          startTimer();
        } else {
          alert('Failed to send OTP: ' + result);
        }
      })
      .catch(() => {
        alert('Error sending OTP!');
      });
  };

  const moveNext = (event, index) => {
    const input = event.target;
    if (input.value && index < 5) {
      const next = document.querySelectorAll('.otp-input')[index + 1];
      if (next) next.focus();
    }
  };

  const verifyOtp = () => {
    const email = formData.email;
    let otp = '';
    document.querySelectorAll('.otp-input').forEach((inp) => {
      otp += inp.value;
    });

    if (otp.length !== 6) {
      alert('Enter full 6-digit OTP');
      return;
    }

    fetch('http://localhost:8989/otp/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })
      .then((res) => res.text())
      .then((result) => {
        if (result.toLowerCase().includes('verified')) {
          alert(result);
          setIsOtpVerified(true);
          document.querySelectorAll('.otp-input').forEach((inp) => {
            inp.disabled = true;
          });
          setShowOtpPage(false);
        } else {
          alert(result);
        }
      })
      .catch(() => {
        alert('OTP verification failed!');
      });
  };

  const getCoordinates = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(address)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EmergencyHospitalLocator/1.0 (chaithanya@example.com)',
          'Accept-Language': 'en'
        }
      });
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }

      return { latitude: null, longitude: null };
    } catch (err) {
      console.error('Error fetching coordinates:', err);
      return { latitude: null, longitude: null };
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    if (!isOtpVerified) {
      alert('Please verify OTP before registering!');
      return;
    }

    if (formData.passwordHashed !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    let data = {
      role,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      passwordHashed: formData.passwordHashed
    };

    if (role === 'pharmacy') {
      data.pharmacyName = formData.pharmacyName;
      data.licenseId = formData.licenseId;
      const ruralValue = formData.isRural;
      const isRural = ruralValue.toLowerCase() === 'yes' ? 1 : 0;
      data.isRural = isRural;
      data.openingTime = formData.openingTime;
      data.closingTime = formData.closingTime;

      const address = `${formData.hno}, ${formData.street}, ${formData.area}, ${formData.city}, ${formData.state} - ${formData.pincode}`;
      data.address = address;
      data.city = formData.city;

      const { latitude, longitude } = await getCoordinates(address);
      data.latitude = latitude;
      data.longitude = longitude;
    }

    fetch('http://localhost:8989/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(async (res) => {
        const text = await res.text();
        return text;
      })
      .then((result) => {
        alert(result);
        window.location.href = '/login';
      })
      .catch((err) => {
        console.error(err);
        alert('Registration failed!');
      });
  };

  return (
    <div className="register-page">
      {!showOtpPage ? (
        <div className="register-container" id="registerPage">
          <h2>Create Account</h2>
          <form id="registerForm" onSubmit={handleRegisterSubmit}>
            <label htmlFor="role">Select Role</label>
            <select id="role" name="role" required value={role} onChange={(e) => {
              setRole(e.target.value);
              toggleForm();
            }}>
              <option value="">-- Choose Role --</option>
              <option value="user">User</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="admin">Admin</option>
            </select>

            <div id="common-fields">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleInput} required />

              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleInput} required />
              <button id="verifyEmailBtn" type="button" className="send-btn" onClick={showOtpPageFn}>Verify Email</button>

              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleInput} required />

              <label htmlFor="passwordHashed">Password</label>
              <input type="password" id="passwordHashed" name="passwordHashed" placeholder="Enter password" value={formData.passwordHashed} onChange={handleInput} required />

              <label htmlFor="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleInput} required />
            </div>

            <div id="pharmacy-fields" className="hidden">
              <label htmlFor="pharmacyName">Pharmacy Name</label>
              <input type="text" id="pharmacyName" name="pharmacyName" placeholder="Enter pharmacy name" value={formData.pharmacyName} onChange={handleInput} />

              <label htmlFor="licenseId">Pharmacy License ID</label>
              <input type="text" id="licenseId" name="licenseId" placeholder="Enter pharmacy license" value={formData.licenseId} onChange={handleInput} />

              <label htmlFor="isRural">Is Rural Area?</label>
              <select id="isRural" name="isRural" value={formData.isRural} onChange={handleInput}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>

              <label htmlFor="openingTime">Opening Time</label>
              <input type="time" id="openingTime" name="openingTime" value={formData.openingTime} onChange={handleInput} />

              <label htmlFor="closingTime">Closing Time</label>
              <input type="time" id="closingTime" name="closingTime" value={formData.closingTime} onChange={handleInput} />

              <h6>Address</h6>
              <input type="text" id="hno" name="hno" placeholder="House No" value={formData.hno} onChange={handleInput} />
              <input type="text" id="street" name="street" placeholder="Street" value={formData.street} onChange={handleInput} />
              <input type="text" id="area" name="area" placeholder="Area" value={formData.area} onChange={handleInput} />
              <input type="text" id="city" name="city" placeholder="City" value={formData.city} onChange={handleInput} />
              <input type="text" id="state" name="state" placeholder="State" value={formData.state} onChange={handleInput} />
              <input type="text" id="pincode" name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleInput} />
            </div>

            <button type="submit">Register</button>

            <p className="login-link">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      ) : (
        <div className="otp-page" id="otpPage">
          <h3>Verify Your Mobile</h3>
          <p>Enter the OTP sent to your phone</p>

          <div className="otp-boxes">
            <input type="text" maxLength="1" className="otp-input" onInput={(e) => moveNext(e, 0)} />
            <input type="text" maxLength="1" className="otp-input" onInput={(e) => moveNext(e, 1)} />
            <input type="text" maxLength="1" className="otp-input" onInput={(e) => moveNext(e, 2)} />
            <input type="text" maxLength="1" className="otp-input" onInput={(e) => moveNext(e, 3)} />
            <input type="text" maxLength="1" className="otp-input" onInput={(e) => moveNext(e, 4)} />
            <input type="text" maxLength="1" className="otp-input" onInput={(e) => moveNext(e, 5)} />
          </div>

          <button className="verify-btn" type="button" onClick={verifyOtp}>Verify OTP</button>
          <p className="timer">Resend in <span id="timer">{timer}</span> sec</p>
          <button className="resend-btn" type="button" onClick={showOtpPageFn} disabled={timer > 0}>Resend OTP</button>
          <button className="back-btn" type="button" onClick={() => setShowOtpPage(false)}>Back</button>
        </div>
      )}
    </div>
  );
}
