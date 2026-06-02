const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        }
      }
    } catch (e) {
      // Fallback if not JSON
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  // Products
  getProducts: () => fetch(`${BASE_URL}/products`).then(handleResponse),
  getProduct: (id) => fetch(`${BASE_URL}/products/${id}`).then(handleResponse),
  createProduct: (data) => fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateProduct: (id, data) => fetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteProduct: (id) => fetch(`${BASE_URL}/products/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Customers
  getCustomers: () => fetch(`${BASE_URL}/customers`).then(handleResponse),
  getCustomer: (id) => fetch(`${BASE_URL}/customers/${id}`).then(handleResponse),
  createCustomer: (data) => fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteCustomer: (id) => fetch(`${BASE_URL}/customers/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Orders
  getOrders: () => fetch(`${BASE_URL}/orders`).then(handleResponse),
  getOrder: (id) => fetch(`${BASE_URL}/orders/${id}`).then(handleResponse),
  createOrder: (data) => fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteOrder: (id) => fetch(`${BASE_URL}/orders/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Dashboard
  getDashboardSummary: () => fetch(`${BASE_URL}/dashboard/summary`).then(handleResponse),
};
