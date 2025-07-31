const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Example route for login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Simple check (replace with real authentication later)
  if (username === 'admin' && password === 'admin') {
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Example route for registration
app.post('/api/register', (req, res) => {
  // You can add registration logic here
  res.json({ success: true, message: 'Registration successful!' });
});

app.listen(5000, () => {
  console.log('Backend server running on http://localhost:5000');
});