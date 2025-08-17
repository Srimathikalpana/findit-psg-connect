const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory user store
const users = [
  { email: 'admin@psgtech.ac.in', password: 'admin', name: 'Admin', studentId: 'ADMIN' }
];

// Login route
app.post('/api/login', async(req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.email === username && u.password === password);
  if (user) {
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Registration route
app.post('/api/register', async(req, res) => {
  console.log('Register request:', req.body); // Add this line
  const { name, email, studentId, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  const hashedPassword = await bcrypt.hash(password, 10); // Hash password
  users.push({ name, email, studentId, password: hashedPassword });
  res.json({ success: true, message: 'Registration successful!' });
});

app.listen(5000, () => {
  console.log('Backend server running on http://localhost:5000');
});