import { useEffect, useState } from 'react';
import { api } from '../api';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mode state: 'list' or 'create'
  const [mode, setMode] = useState('list');
  
  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null or orderId

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [orderItems, setOrderItems] = useState([]); // Array of { product_id, quantity, product (full info) }

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedOrders, fetchedProducts, fetchedCustomers] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers()
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setCustomers(fetchedCustomers);
    } catch (err) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartCreate = () => {
    setSelectedCustomerId('');
    setSelectedProductId('');
    setItemQuantity('1');
    setOrderItems([]);
    setError('');
    setSuccess('');
    setMode('create');
  };

  const handleAddItem = () => {
    setError('');
    if (!selectedProductId) return setError('Please select a product');
    
    const qty = parseInt(itemQuantity);
    if (isNaN(qty) || qty <= 0) return setError('Quantity must be greater than 0');

    const product = products.find(p => p.id === parseInt(selectedProductId));
    if (!product) return setError('Selected product not found');

    // Check total quantity in draft against stock
    const existingItem = orderItems.find(item => item.product_id === product.id);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const newTotalQty = existingQty + qty;

    if (product.quantity_in_stock < newTotalQty) {
      return setError(
        `Cannot add item. Requested quantity (${newTotalQty}) exceeds available stock (${product.quantity_in_stock}) for ${product.name}.`
      );
    }

    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.product_id === product.id ? { ...item, quantity: newTotalQty } : item
      ));
    } else {
      setOrderItems([...orderItems, { product_id: product.id, quantity: qty, product }]);
    }

    // Reset selection input
    setSelectedProductId('');
    setItemQuantity('1');
  };

  const handleRemoveItem = (productId) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCustomerId) return setError('Please select a customer');
    if (orderItems.length === 0) return setError('Please add at least one item to the order');

    const payload = {
      customer_id: parseInt(selectedCustomerId),
      items: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      const createdOrder = await api.createOrder(payload);
      
      // Update local states
      setOrders([createdOrder, ...orders]);
      setSuccess(`Order #${createdOrder.id} placed successfully!`);
      
      // Reload products to get updated stock levels
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);

      setMode('list');
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm;
    setDeleteConfirm(null);
    setError('');
    setSuccess('');

    try {
      await api.deleteOrder(id);
      setOrders(orders.filter(o => o.id !== id));
      setSuccess(`Order #${id} deleted and inventory restored successfully!`);
      
      // Reload products to get updated stock levels
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);
    } catch (err) {
      setError(err.message || 'Failed to delete order.');
    }
  };

  const handleViewDetails = async (order) => {
    try {
      // Fetch fresh details or use from state
      const detailed = await api.getOrder(order.id);
      setSelectedOrder(detailed);
    } catch (err) {
      setError('Could not load order details.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between section-title-bar">
        <div>
          <h2 className="page-title">Orders Management</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {mode === 'list' 
              ? 'View order logs and client receipts.' 
              : 'Construct a new order and deduct stock automatically.'
            }
          </p>
        </div>
        {mode === 'list' ? (
          <button className="btn btn-primary" onClick={handleStartCreate}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Order
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={() => setMode('list')}>
            Back to Orders List
          </button>
        )}
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="alert alert-success animate-fade-in">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-danger animate-fade-in">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* LIST MODE */}
      {mode === 'list' && (
        <div className="glass-card">
          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading order receipts...
            </div>
          ) : orders.length > 0 ? (
            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Customer Email</th>
                    <th>Date Placed</th>
                    <th>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>#{order.id}</td>
                      <td style={{ fontWeight: '600' }}>{order.customer ? order.customer.name : 'Unknown Customer'}</td>
                      <td>{order.customer ? order.customer.email : 'N/A'}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td style={{ fontWeight: '700', color: 'var(--success)' }}>${order.total_amount.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(order)}>
                            Details
                          </button>
                           <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(order.id)}>
                             Cancel
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
              <p>No orders recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {/* CREATE MODE */}
      {mode === 'create' && (
        <div className="order-creator-grid">
          {/* Order Construction Panel */}
          <div className="glass-card animate-fade-in">
            <h3 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Order Constructor</h3>
            
            <div className="form-group">
              <label className="form-label">1. Select Customer</label>
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

            <label className="form-label">2. Add Items to Cart</label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem' }}>
              <div>
                <span className="form-label" style={{ fontSize: '0.75rem' }}>Product</span>
                <select
                  className="form-control"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                      {p.name} - ${p.price.toFixed(2)} (Stock: {p.quantity_in_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="form-label" style={{ fontSize: '0.75rem' }}>Quantity</span>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                />
              </div>

              <button type="button" className="btn btn-secondary" onClick={handleAddItem}>
                Add Item
              </button>
            </div>

            {/* Selected Items Draft List */}
            <div className="selected-items-list">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Current Order Draft</span>
              {orderItems.length > 0 ? (
                orderItems.map(item => (
                  <div key={item.product_id} className="selected-item-row animate-fade-in">
                    <div>
                      <div style={{ fontWeight: '600' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        SKU: {item.product.sku} | Price: ${item.product.price.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600' }}>Qty: {item.quantity}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: '700' }}>
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm" 
                        style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                        onClick={() => handleRemoveItem(item.product_id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                  Cart is empty. Select products above.
                </div>
              )}
            </div>
          </div>

          {/* Checkout / Placement Details */}
          <div className="glass-card animate-fade-in" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Order Checkout</h3>
            
            <div className="order-summary-box">
              <div className="summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>Items in Cart</span>
                <span>{orderItems.reduce((acc, curr) => acc + curr.quantity, 0)} units</span>
              </div>
              <div className="summary-row total">
                <span>Grand Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem' }} 
              onClick={handlePlaceOrder}
              disabled={orderItems.length === 0 || !selectedCustomerId}
            >
              Place Fulfillment Order
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-slide-up" style={{ padding: '2rem', maxWidth: '650px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)' }}>Order Receipt Details</h3>
                <span style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  ID: #{selectedOrder.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Customer Profile</h4>
              {selectedOrder.customer ? (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '600', color: '#ffffff' }}>{selectedOrder.customer.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Email: {selectedOrder.customer.email}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--danger)' }}>Customer profile missing (deleted).</p>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Order Line Items</h4>
              <div className="table-container" style={{ marginTop: '0' }}>
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => {
                      // Lookup item name from product state if missing in receipt
                      const prodInfo = products.find(p => p.id === item.product_id);
                      const name = item.product_name || (prodInfo ? prodInfo.name : `Product ID ${item.product_id}`);
                      const sku = item.product_sku || (prodInfo ? prodInfo.sku : 'N/A');

                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: '600' }}>{name}</td>
                          <td><code style={{ color: 'var(--accent-secondary)' }}>{sku}</code></td>
                          <td>${item.unit_price.toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>
                            ${(item.unit_price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: 'rgba(99, 102, 241, 0.04)' }}>
                      <td colSpan="4" style={{ fontWeight: '700', textAlign: 'right', color: 'var(--text-secondary)' }}>Grand Total:</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--success)', fontSize: '1.05rem' }}>
                        ${selectedOrder.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-slide-up" style={{ padding: '2rem', maxWidth: '450px' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>Cancel & Delete Order</h3>
              <button 
                onClick={() => setDeleteConfirm(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              Are you sure you want to cancel and delete <strong>Order #{deleteConfirm}</strong>? Stock will be automatically restored to inventory.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Keep Order
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
