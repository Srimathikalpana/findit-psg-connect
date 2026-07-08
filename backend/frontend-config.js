// Frontend Configuration generator for FindIT
// This file builds frontend URLs from an env-provided base (useful when generating examples)
// Set FRONTEND_API_BASE to the root of your backend (e.g. https://my-backend.onrender.com)
const BASE = (process.env.FRONTEND_API_BASE || 'http://localhost:8080').replace(/\/$/, '');

const FRONTEND_CONFIG = {
  API_BASE_URL: `${BASE}/api`,
  AUTH: {
    REGISTER: `${BASE}/api/auth/register`,
    LOGIN: `${BASE}/api/auth/login`,
    PROFILE: `${BASE}/api/auth/profile`,
    UPDATE_PROFILE: `${BASE}/api/auth/profile`
  },
  ITEMS: {
    LOST_ITEMS: `${BASE}/api/lost-items`,
    FOUND_ITEMS: `${BASE}/api/found-items`,
    MY_ITEMS: `${BASE}/api/my-items`,
    SEARCH: `${BASE}/api/search`
  },
  CLAIMS: {
    CREATE: `${BASE}/api/claims`,
    GET_USER_CLAIMS: `${BASE}/api/claims`,
    GET_CLAIM: `${BASE}/api/claims/:id`,
    UPDATE_STATUS: `${BASE}/api/claims/:id/status`,
    COMPLETE: `${BASE}/api/claims/:id/complete`,
    CANCEL: `${BASE}/api/claims/:id`
  },
  HEALTH: `${BASE}/health`
};

// Example usage in frontend:
/*
// Registration
fetch(FRONTEND_CONFIG.AUTH.REGISTER, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@psgtech.ac.in',
    studentId: '21CS001',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => console.log(data));

// Login
fetch(FRONTEND_CONFIG.AUTH.LOGIN, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@psgtech.ac.in',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => {
  console.log(data);
  // Save the token
  localStorage.setItem('token', data.data.token);
});

// Create Lost Item (with authentication)
const token = localStorage.getItem('token');
fetch(FRONTEND_CONFIG.ITEMS.LOST_ITEMS, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    itemName: 'iPhone 13',
    description: 'Black iPhone with cracked screen',
    placeLost: 'Computer Science Lab',
    dateLost: '2024-01-15',
    category: 'Electronics',
    color: 'Black',
    brand: 'Apple'
  })
})
.then(res => res.json())
.then(data => console.log(data));
*/

module.exports = FRONTEND_CONFIG;
