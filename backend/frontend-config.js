// Frontend Configuration for FindIT
// Copy these settings to your frontend

const FRONTEND_CONFIG = {
  // Backend API Base URL
  API_BASE_URL: 'http://localhost:8080/api',
  
  // Authentication Endpoints
  AUTH: {
    REGISTER: 'http://localhost:8080/api/auth/register',
    LOGIN: 'http://localhost:8080/api/auth/login',
    PROFILE: 'http://localhost:8080/api/auth/profile',
    UPDATE_PROFILE: 'http://localhost:8080/api/auth/profile'
  },
  
  // Items Endpoints
  ITEMS: {
    LOST_ITEMS: 'http://localhost:8080/api/lost-items',
    FOUND_ITEMS: 'http://localhost:8080/api/found-items',
    MY_ITEMS: 'http://localhost:8080/api/my-items',
    SEARCH: 'http://localhost:8080/api/search'
  },
  
  // Claims Endpoints
  CLAIMS: {
    CREATE: 'http://localhost:8080/api/claims',
    GET_USER_CLAIMS: 'http://localhost:8080/api/claims',
    GET_CLAIM: 'http://localhost:8080/api/claims/:id',
    UPDATE_STATUS: 'http://localhost:8080/api/claims/:id/status',
    COMPLETE: 'http://localhost:8080/api/claims/:id/complete',
    CANCEL: 'http://localhost:8080/api/claims/:id'
  },
  
  // Health Check
  HEALTH: 'http://localhost:8080/health'
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
