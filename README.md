import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PharmacyDashboardPage() {
  const [pharmacyId, setPharmacyId] = useState(sessionStorage.getItem('pharmacyId') || '');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({ totalMedicines: 0, lowStock: 0, expired: 0 });
  const [stocks, setStocks] = useState([]);
  const [profile, setProfile] = useState({
    name: '',
    licenseId: '',
    address: '',
    phone: '',
    email: '',
    openingTime: '',
    closingTime: ''
  });

  const showSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const logout = () => {
    alert('Logging out...');
    window.location.href = '/login';
  };

  const handleMedicineSubmit = async (event) => {
    event.preventDefault();
    const userId = sessionStorage.getItem('pharmacyId');
    const name = document.getElementById('medName').value;
    const category = document.getElementById('medCategory').value;
    const qty = document.getElementById('medQty').value;
    const price = document.getElementById('medPrice').value;
    const expiry = document.getElementById('medExpiry').value;
    const batch = document.getElementById('batchNo').value;
    const salt = document.getElementById('salt').value;
    const alt = document.getElementById('medalt').value;

    const medicineData = {
      pharmacyId: userId,
      medicineName: name,
      type: category,
      price: price,
      alternativeMedicine: alt,
      saltcomposition: salt,
      expiryDate: expiry,
      stock: qty,
      batchNumber: batch
    };

    try {
      const response = await fetch('http://localhost:8989/api/addMedicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicineData)
      });

      if (!response.ok) {
        throw new Error('Failed to add medicine');
      }

      const result = await response.text();
      alert(result);
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong while adding medicine.');
    }
  };

  const loadStock = async () => {
    const pharmacyIdValue = sessionStorage.getItem('pharmacyId');
    if (!pharmacyIdValue) {
      alert('Pharmacy ID not found. Please login again.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8989/${pharmacyIdValue}/stocks`);
      if (!response.ok) throw new Error('Failed to fetch stock items');

      const stocksData = await response.json();
      setStocks(stocksData);
    } catch (error) {
      console.error('Error loading stock:', error);
      alert('Could not load stock items. Check console for details.');
    }
  };

  const loadDashboard = async () => {
    const pharmacyIdValue = sessionStorage.getItem('pharmacyId');
    if (!pharmacyIdValue) {
      alert('Pharmacy ID not found. Please login again.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8989/${pharmacyIdValue}/counts`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      setDashboardData({
        totalMedicines: data.totalMedicines,
        lowStock: data.lowStock,
        expired: data.expired
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Could not load dashboard data. Check console for details.');
    }
  };

  const loadProfile = async () => {
    const pharmacyIdValue = sessionStorage.getItem('pharmacyId');
    if (!pharmacyIdValue) return;

    try {
      const response = await fetch(`http://localhost:8989/profile/${pharmacyIdValue}`);
      if (!response.ok) {
        alert('Failed to load profile ❌');
        return;
      }

      const data = await response.json();
      setProfile(data);
      setPharmacyId(pharmacyIdValue);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const toggleEditMode = () => {
    const inputs = document.querySelectorAll('#profileForm input, #profileForm textarea');
    const updateBtn = document.getElementById('updateBtn');

    inputs.forEach((input) => {
      if (input.hasAttribute('readonly')) {
        input.removeAttribute('readonly');
        input.style.background = '#fff';
      } else {
        input.setAttribute('readonly', true);
        input.style.background = '#f9f9f9';
      }
    });

    if (updateBtn) {
      updateBtn.classList.toggle('hidden');
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    const pharmacyIdValue = sessionStorage.getItem('pharmacyId');
    const oldData = profile;

    const newData = {
      name: document.getElementById('pharmacyName').textContent.replace('🏥 ', '').trim(),
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value,
      address: document.getElementById('address').value,
      city: oldData.city,
      openingTime: document.getElementById('openTime').value,
      closingTime: document.getElementById('closeTime').value
    };

    const payload = {
      name: newData.name || oldData.name,
      phone: Number(newData.phone || oldData.phone),
      email: newData.email || oldData.email,
      address: newData.address || oldData.address,
      city: newData.city || oldData.city,
      openingTime: newData.openingTime || oldData.openingTime,
      closingTime: newData.closingTime || oldData.closingTime
    };

    try {
      const response = await fetch(`http://localhost:8989/profile/editing/${pharmacyIdValue}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        alert('Failed to update profile ❌');
        return;
      }

      const updatedProfile = await response.json();
      alert('Profile updated successfully ✅');
      setProfile(updatedProfile);

      document.querySelectorAll('#profileForm input, #profileForm textarea').forEach((input) => {
        input.setAttribute('readonly', true);
        input.style.background = '#f9f9f9';
      });

      const updateBtn = document.getElementById('updateBtn');
      if (updateBtn) updateBtn.classList.add('hidden');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Something went wrong ❌');
    }
  };

  const editStock = (stockId) => {
    const row = document.getElementById(`stock-row-${stockId}`);
    if (!row) return;

    const currentData = stocks.find((stock) => stock.stockId === stockId);
    if (!currentData) return;

    row.innerHTML = `
      <td>${stockId}</td>
      <td><input type="text" id="editBatch" value="${currentData.batchNumber}"></td>
      <td><input type="text" id="editName" value="${currentData.medicine}"></td>
      <td><input type="text" id="editCategory" value="${currentData.type}"></td>
      <td><input type="number" id="editQty" value="${currentData.quantity}"></td>
      <td><input type="number" id="editPrice" value="${currentData.price}"></td>
      <td><input type="date" id="editExpiry" value="${currentData.expiryDate}"></td>
      <td>
        <button type="button" onClick={() => saveStock(stockId)}>Save</button>
        <button type="button" onClick={loadStock}>Cancel</button>
      </td>
    `;
  };

  const saveStock = async (stockId) => {
    const updatedStock = {
      stockId: stockId,
      batchNumber: document.getElementById('editBatch').value,
      medicine: document.getElementById('editName').value,
      type: document.getElementById('editCategory').value,
      quantity: document.getElementById('editQty').value,
      price: document.getElementById('editPrice').value,
      expiryDate: document.getElementById('editExpiry').value
    };

    try {
      const response = await fetch('http://localhost:8989/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStock)
      });

      if (!response.ok) throw new Error('Failed to update stock');

      alert('Stock updated successfully!');
      loadStock();
    } catch (error) {
      console.error('Error saving stock:', error);
      alert('Could not save stock changes.');
    }
  };

  const deleteStock = async (stockId) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;

    try {
      const response = await fetch(`http://localhost:8989/deleteStock/${stockId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete stock');
      }

      const result = await response.text();
      alert(result);
      loadStock();
    } catch (error) {
      console.error('Error deleting stock:', error);
      alert('Something went wrong while deleting the stock.');
    }
  };

  useEffect(() => {
    loadDashboard();
    loadStock();
    loadProfile();
  }, []);

  return (
    <div className="pharmacy-dashboard-page">
      <div className="pharmacy-dashboard-container">
        <aside className="sidebar">
          <h2>MediLocator</h2>
          <ul>
            <li onClick={() => { showSection('dashboard'); loadDashboard(); }}>🏠 Dashboard</li>
            <li onClick={() => showSection('add-medicine')}>➕ Add Medicine</li>
            <li onClick={() => { showSection('stock'); loadStock(); }}>📦 Stock Management</li>
            <li onClick={() => { showSection('profile'); loadProfile(); }}>👤 Profile</li>
            <li onClick={logout}>🚪 Logout</li>
          </ul>
        </aside>

        <main className="main-content">
          <section id="dashboard" className={`content-section ${activeSection === 'dashboard' ? '' : 'hidden'}`}>
            <h2>Dashboard Overview</h2>
            <div className="cards">
              <div className="card" id="totalMedicines">
                <h2>Total Medicines:</h2>
                <span>{dashboardData.totalMedicines}</span>
              </div>
              <div className="card" id="lowStock">
                <h2>Low Stock:</h2>
                <span>{dashboardData.lowStock}</span>
              </div>
              <div className="card" id="expiredMedicines">
                <h2>Expired:</h2>
                <span>{dashboardData.expired}</span>
              </div>
            </div>
          </section>

          <section id="add-medicine" className={`content-section ${activeSection === 'add-medicine' ? '' : 'hidden'}`}>
            <div className="form-card">
              <h2>Add New Medicine</h2>
              <form id="medicineForm" onSubmit={handleMedicineSubmit}>
                <div className="form-group">
                  <label>Medicine Name</label>
                  <input type="text" id="medName" required />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <input type="text" id="medCategory" placeholder="Tablet, Syrup..." required />
                </div>

                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" id="medQty" required />
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input type="number" id="medPrice" required />
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" id="medExpiry" required />
                </div>

                <div className="form-group">
                  <label>Alternative Medicine</label>
                  <input type="text" id="medalt" required />
                </div>

                <div className="form-group">
                  <label>Salt Composition</label>
                  <input type="text" id="salt" required />
                </div>

                <div className="form-group">
                  <label>Batch Number</label>
                  <input type="text" id="batchNo" required />
                </div>

                <button type="submit" className="save-btn">💾 Save Medicine</button>
              </form>
            </div>
          </section>

          <section id="stock" className={`content-section ${activeSection === 'stock' ? '' : 'hidden'}`}>
            <h2>Stock Management</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Batch No</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Expiry</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr id={`stock-row-${stock.stockId}`} key={stock.stockId} className={stock.quantity <= 10 ? 'low-stock' : ''}>
                    <td>{stock.stockId}</td>
                    <td>{stock.batchNumber}</td>
                    <td>{stock.medicine}</td>
                    <td>{stock.type}</td>
                    <td>{stock.quantity}</td>
                    <td>₹{stock.price}</td>
                    <td>{stock.expiryDate}</td>
                    <td>
                      <button type="button" onClick={() => editStock(stock.stockId)}>Edit</button>
                      <button type="button" onClick={() => deleteStock(stock.stockId)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section id="profile" className={`content-section ${activeSection === 'profile' ? '' : 'hidden'}`}>
            <div className="profile-card">
              <div className="profile-header">
                <h2 id="pharmacyName">🏥 {profile.name}</h2>
                <span className="edit-icon" onClick={toggleEditMode}>✏️ Edit</span>
              </div>

              <div className="profile-details">
                <form id="profileForm" onSubmit={handleProfileUpdate}>
                  <div className="detail-group">
                    <label>License ID:</label>
                    <input type="text" id="license" value={profile.licenseId || ''} readOnly />
                  </div>

                  <div className="detail-group">
                    <label>Address:</label>
                    <textarea id="address" value={profile.address || ''} readOnly onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))} />
                  </div>

                  <div className="detail-group">
                    <label>Phone:</label>
                    <input type="text" id="phone" value={profile.phone || ''} readOnly onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} />
                  </div>

                  <div className="detail-group">
                    <label>Email:</label>
                    <input type="email" id="email" value={profile.email || ''} readOnly onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>

                  <div className="time-group">
                    <div>
                      <label>Opening Time:</label>
                      <input type="time" id="openTime" value={profile.openingTime || ''} readOnly onChange={(e) => setProfile((prev) => ({ ...prev, openingTime: e.target.value }))} />
                    </div>
                    <div>
                      <label>Closing Time:</label>
                      <input type="time" id="closeTime" value={profile.closingTime || ''} readOnly onChange={(e) => setProfile((prev) => ({ ...prev, closingTime: e.target.value }))} />
                    </div>
                  </div>

                  <button type="submit" id="updateBtn" className="update-btn hidden">💾 Update Profile</button>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
