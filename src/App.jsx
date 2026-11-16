import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import PharmacyDashboardPage from './pages/PharmacyDashboardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/pharma" element={<PharmacyDashboardPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
