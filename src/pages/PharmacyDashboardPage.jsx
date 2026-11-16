import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8989';

export default function PharmacyDashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({ totalMedicines: 0, lowStock: 0, expired: 0 });
  const [stocks, setStocks] = useState([]);
  const [profile, setProfile] = useState({ name: '', licenseId: '', address: '', phone: '', email: '', city: '', openingTime: '', closingTime: '' });
  const [editingStockId, setEditingStockId] = useState(null);
  const [updatedStock, setUpdatedStock] = useState({});
  const [profileEditable, setProfileEditable] = useState(false);

  const getPharmacyId = () => sessionStorage.getItem('pharmacyId');

  const loadDashboard = async () => {
    const pharmacyId = getPharmacyId();
    if (!pharmacyId) return;
    try {
      const response = await fetch(`${API_BASE}/${pharmacyId}/counts`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData({ totalMedicines: data.totalMedicines ?? 0, lowStock: data.lowStock ?? 0, expired: data.expired ?? 0 });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Could not load dashboard data. Check console for details.');
    }
  };

  const loadStock = async () => {
    const pharmacyId = getPharmacyId();
    if (!pharmacyId) {
      alert('Pharmacy ID not found. Please login again.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/${pharmacyId}/stocks`);
      if (!response.ok) throw new Error('Failed to fetch stock items');
      setStocks(await response.json());
    } catch (error) {
      console.error('Error loading stock:', error);
      alert('Could not load stock items. Check console for details.');
    }
  };

  const loadProfile = async () => {
    const pharmacyId = getPharmacyId();
    if (!pharmacyId) return;
    try {
      const response = await fetch(`${API_BASE}/profile/${pharmacyId}`);
      if (!response.ok) throw new Error('Failed to load profile');
      setProfile(await response.json());
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const showSection = (sectionId) => {
    setActiveSection(sectionId);
    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'stock') loadStock();
    if (sectionId === 'profile') loadProfile();
  };

  const logout = () => {
    sessionStorage.removeItem('pharmacyId');
    navigate('/login');
  };

  const handleMedicineSubmit = async (event) => {
    event.preventDefault();
    const pharmacyId = getPharmacyId();
    const medicineData = {
      pharmacyId,
      medicineName: event.currentTarget.medName.value,
      type: event.currentTarget.medCategory.value,
      price: event.currentTarget.medPrice.value,
      alternativeMedicine: event.currentTarget.medalt.value,
      saltcomposition: event.currentTarget.salt.value,
      expiryDate: event.currentTarget.medExpiry.value,
      stock: event.currentTarget.medQty.value,
      batchNumber: event.currentTarget.batchNo.value
    };
    try {
      const response = await fetch(`${API_BASE}/api/addMedicine`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(medicineData)
      });
      if (!response.ok) throw new Error('Failed to add medicine');
      alert(await response.text());
      event.currentTarget.reset();
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert('Something went wrong while adding medicine.');
    }
  };

  const editStock = (stock) => {
    setEditingStockId(stock.stockId);
    setUpdatedStock({
      stockId: stock.stockId,
      batchNumber: stock.batchNumber,
      medicine: stock.medicine,
      type: stock.type,
      quantity: stock.quantity,
      price: stock.price,
      expiryDate: stock.expiryDate
    });
  };

  const saveStock = async () => {
    try {
      const response = await fetch(`${API_BASE}/edit`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedStock)
      });
      if (!response.ok) throw new Error('Failed to update stock');
      alert('Stock updated successfully!');
      setEditingStockId(null);
      await loadStock();
    } catch (error) {
      console.error('Error saving stock:', error);
      alert('Could not save stock changes.');
    }
  };

  const deleteStock = async (stockId) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
    try {
      const response = await fetch(`${API_BASE}/deleteStock/${stockId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete stock');
      alert(await response.text());
      await loadStock();
    } catch (error) {
      console.error('Error deleting stock:', error);
      alert('Something went wrong while deleting the stock.');
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    const pharmacyId = getPharmacyId();
    const payload = {
      name: profile.name,
      phone: Number(profile.phone),
      email: profile.email,
      address: profile.address,
      city: profile.city,
      openingTime: profile.openingTime,
      closingTime: profile.closingTime
    };
    try {
      const response = await fetch(`${API_BASE}/profile/editing/${pharmacyId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      setProfile(await response.json());
      setProfileEditable(false);
      alert('Profile updated successfully ✅');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile ❌');
    }
  };

  const updateProfileField = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <div className="pharmacy-dashboard-page">
      <div className="pharmacy-dashboard-container">
        <aside className="sidebar">
          <h2>MediLocator</h2>
          <ul>
            <li onClick={() => showSection('dashboard')}>🏠 Dashboard</li>
            <li onClick={() => showSection('add-medicine')}>➕ Add Medicine</li>
            <li onClick={() => showSection('stock')}>📦 Stock Management</li>
            <li onClick={() => showSection('profile')}>👤 Profile</li>
            <li onClick={logout}>🚪 Logout</li>
          </ul>
        </aside>

        <main className="main-content">
          {activeSection === 'dashboard' && (
            <section id="dashboard" className="content-section">
              <h2>Dashboard Overview</h2>
              <div className="cards">
                <div className="card" id="totalMedicines"><h2>Total Medicines:</h2><span>{dashboardData.totalMedicines}</span></div>
                <div className="card" id="lowStock"><h2>Low Stock:</h2><span>{dashboardData.lowStock}</span></div>
                <div className="card" id="expiredMedicines"><h2>Expired:</h2><span>{dashboardData.expired}</span></div>
              </div>
            </section>
          )}

          {activeSection === 'add-medicine' && (
            <section id="add-medicine" className="content-section">
              <div className="form-card">
                <h2>Add New Medicine</h2>
                <form id="medicineForm" onSubmit={handleMedicineSubmit}>
                  <div className="form-group"><label htmlFor="medName">Medicine Name</label><input id="medName" required /></div>
                  <div className="form-group"><label htmlFor="medCategory">Type</label><input id="medCategory" placeholder="Tablet, Syrup..." required /></div>
                  <div className="form-group"><label htmlFor="medQty">Stock</label><input id="medQty" type="number" required /></div>
                  <div className="form-group"><label htmlFor="medPrice">Price</label><input id="medPrice" type="number" required /></div>
                  <div className="form-group"><label htmlFor="medExpiry">Expiry Date</label><input id="medExpiry" type="date" required /></div>
                  <div className="form-group"><label htmlFor="medalt">Alternative Medicine</label><input id="medalt" required /></div>
                  <div className="form-group"><label htmlFor="salt">Salt Composition</label><input id="salt" required /></div>
                  <div className="form-group"><label htmlFor="batchNo">Batch Number</label><input id="batchNo" required /></div>
                  <button type="submit" className="save-btn">💾 Save Medicine</button>
                </form>
              </div>
            </section>
          )}

          {activeSection === 'stock' && (
            <section id="stock" className="content-section">
              <h2>Stock Management</h2>
              <table>
                <thead><tr><th>ID</th><th>Batch No</th><th>Name</th><th>Category</th><th>Qty</th><th>Price</th><th>Expiry</th><th>Action</th></tr></thead>
                <tbody id="stockTable">
                  {stocks.map((stock) => editingStockId === stock.stockId ? (
                    <tr key={stock.stockId} className={stock.quantity <= 10 ? 'low-stock' : ''}>
                      <td>{stock.stockId}</td>
                      {['batchNumber', 'medicine', 'type', 'quantity', 'price', 'expiryDate'].map((field) => (
                        <td key={field}><input type={field === 'quantity' || field === 'price' ? 'number' : field === 'expiryDate' ? 'date' : 'text'} value={updatedStock[field] ?? ''} onChange={(event) => setUpdatedStock((current) => ({ ...current, [field]: event.target.value }))} /></td>
                      ))}
                      <td><button type="button" onClick={saveStock}>Save</button><button type="button" onClick={() => setEditingStockId(null)}>Cancel</button></td>
                    </tr>
                  ) : (
                    <tr key={stock.stockId} className={stock.quantity <= 10 ? 'low-stock' : ''}>
                      <td>{stock.stockId}</td><td>{stock.batchNumber}</td><td>{stock.medicine}</td><td>{stock.type}</td><td>{stock.quantity}</td><td>₹{stock.price}</td><td>{stock.expiryDate}</td>
                      <td><button type="button" onClick={() => editStock(stock)}>Edit</button><button type="button" onClick={() => deleteStock(stock.stockId)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeSection === 'profile' && (
            <section id="profile" className="content-section">
              <div className="profile-card">
                <div className="profile-header"><h2 id="pharmacyName">🏥 {profile.name}</h2><button type="button" className="edit-icon" onClick={() => setProfileEditable((value) => !value)}>✏️ Edit</button></div>
                <div className="profile-details">
                  <form id="profileForm" onSubmit={handleProfileUpdate}>
                    <div className="detail-group"><label htmlFor="license">License ID:</label><input id="license" value={profile.licenseId || ''} readOnly /></div>
                    <div className="detail-group"><label htmlFor="address">Address:</label><textarea id="address" name="address" value={profile.address || ''} readOnly={!profileEditable} onChange={updateProfileField} /></div>
                    <div className="detail-group"><label htmlFor="phone">Phone:</label><input id="phone" name="phone" value={profile.phone || ''} readOnly={!profileEditable} onChange={updateProfileField} /></div>
                    <div className="detail-group"><label htmlFor="email">Email:</label><input id="email" name="email" type="email" value={profile.email || ''} readOnly={!profileEditable} onChange={updateProfileField} /></div>
                    <div className="time-group">
                      <div><label htmlFor="openTime">Opening Time:</label><input id="openTime" name="openingTime" type="time" value={profile.openingTime || ''} readOnly={!profileEditable} onChange={updateProfileField} /></div>
                      <div><label htmlFor="closeTime">Closing Time:</label><input id="closeTime" name="closingTime" type="time" value={profile.closingTime || ''} readOnly={!profileEditable} onChange={updateProfileField} /></div>
                    </div>
                    {profileEditable && <button type="submit" id="updateBtn" className="update-btn">💾 Update Profile</button>}
                  </form>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
