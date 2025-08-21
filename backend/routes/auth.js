const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const users = [
  { email: 'admin@psgtech.ac.in', password: '$2b$10$...', name: 'Admin', studentId: 'ADMIN' } // Use a hashed password here if needed
];

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.email === username);
  if (user && await bcrypt.compare(password, user.password)) {
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Registration route
router.post('/register', async (req, res) => {
  const { name, email, studentId, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, email, studentId, password: hashedPassword });
  res.json({ success: true, message: 'Registration successful!' });
});

module.exports = router;