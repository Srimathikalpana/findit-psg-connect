const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Use the auth routes
app.use('/api', authRoutes);

app.listen(5000, () => {
  console.log('Backend server running on http://localhost:5000');
});