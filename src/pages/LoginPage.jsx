import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    role: '',
    email: '',
    password: ''
  });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleInput = (event) => {
    const { id, value } = event.target;
    setLoginData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEmailError('');
    setPasswordError('');

    try {
      const response = await fetch('http://localhost:8989/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      if (response.ok) {
        const data = await response.json();

        if (data.pharmacyId) {
          sessionStorage.setItem('pharmacyId', data.pharmacyId);
        }

        const roleLower = String(loginData.role).toLowerCase();
        if (roleLower === 'user' || roleLower === 'admin') {
          navigate('/search');
        } else if (roleLower === 'pharmacy') {
          navigate('/pharma');
        }
      } else {
        const errorText = await response.text();

        if (errorText.toLowerCase().includes('password')) {
          setPasswordError('Incorrect password!');
        } else if (errorText.toLowerCase().includes('email') || errorText.toLowerCase().includes('not found')) {
          setEmailError('No account found with this email!');
        } else {
          setPasswordError('Login failed. Try again.');
        }
      }
    } catch (err) {
      setPasswordError('Cannot connect to server!');
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form id="loginForm" onSubmit={handleSubmit}>
          <label htmlFor="role">Select Role</label>
          <select id="role" name="role" required value={loginData.role} onChange={handleInput}>
            <option value="">-- Choose Role --</option>
            <option value="user">User</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="admin">Admin</option>
          </select>

          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" value={loginData.email} onChange={handleInput} required />
          <span id="emailError" className="error-message">{emailError}</span>

          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Enter your password" value={loginData.password} onChange={handleInput} required />
          <span id="passwordError" className="error-message">{passwordError}</span>

          <button type="submit">Login</button>

          <p className="register-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
