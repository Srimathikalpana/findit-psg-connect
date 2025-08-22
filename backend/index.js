const mongoose = require('mongoose');
require('dotenv').config();  // To load variables from .env

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

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