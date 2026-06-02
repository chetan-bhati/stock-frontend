import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger animate-fade-in">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  const { total_products, total_customers, total_orders, low_stock_products } = summary || {
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  };

  return (
    <div className="animate-fade-in">
      <div className="section-title-bar">
        <h2 className="page-title">Dashboard Summary</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Overview of inventory, customers, and fulfillment.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Products Card */}
        <div className="glass-card metric-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
          <div className="metric-header">
            <span>Total Products</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className="metric-value">{total_products}</div>
        </div>

        {/* Customers Card */}
        <div className="glass-card metric-card success" style={{ cursor: 'pointer' }} onClick={() => navigate('/customers')}>
          <div className="metric-header">
            <span>Active Customers</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--success)' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="metric-value">{total_customers}</div>
        </div>

        {/* Orders Card */}
        <div className="glass-card metric-card info" style={{ cursor: 'pointer' }} onClick={() => navigate('/orders')}>
          <div className="metric-header">
            <span>Total Orders</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--info)' }}>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div className="metric-value">{total_orders}</div>
        </div>

        {/* Low Stock Card */}
        <div className="glass-card metric-card danger">
          <div className="metric-header">
            <span>Low Stock Items</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--danger)' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div className="metric-value">{low_stock_products.length}</div>
        </div>
      </div>

      {/* Low Stock Details Table */}
      <div className="glass-card animate-fade-in" style={{ marginTop: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Stock Alert Board</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Products with critical stock level (under 5 units).</p>
          </div>
          {low_stock_products.length === 0 ? (
            <span className="badge badge-success">All Fully Stocked</span>
          ) : (
            <span className="badge badge-danger">{low_stock_products.length} Critical Alert(s)</span>
          )}
        </div>

        {low_stock_products.length > 0 ? (
          <div className="table-container">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>In Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {low_stock_products.map(product => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: '600' }}>{product.name}</td>
                    <td><code style={{ color: 'var(--accent-secondary)' }}>{product.sku}</code></td>
                    <td>${product.price.toFixed(2)}</td>
                    <td style={{ color: product.quantity_in_stock === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 'bold' }}>
                      {product.quantity_in_stock}
                    </td>
                    <td>
                      {product.quantity_in_stock === 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : (
                        <span className="badge badge-warning">Low Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p style={{ fontSize: '0.95rem' }}>No low stock alerts detected. Good job!</p>
          </div>
        )}
      </div>
    </div>
  );
}
