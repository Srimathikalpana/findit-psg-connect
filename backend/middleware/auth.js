const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth Header:', authHeader ? authHeader.substring(0, 20) + '...' : 'undefined');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token or invalid format');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🎫 Token:', token ? token.substring(0, 20) + '...' : 'undefined');

    if (!token || token === 'undefined') {
      console.log('❌ Token is undefined or empty');
      return res.status(401).json({ message: 'Invalid token' });
    }

    const jwtStart = Date.now();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const jwtTime = Date.now() - jwtStart;
    console.log('👤 Decoded token:', decoded, `(JWT verification: ${jwtTime}ms)`);

    const dbStart = Date.now();
    const user = await User.findById(decoded.id).select('-password');
    const dbTime = Date.now() - dbStart;
    console.log(`🗄️ DB lookup: ${dbTime}ms`);
    
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({ message: 'User not found' });
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ User authenticated: ${user.email} (Total auth time: ${totalTime}ms)`);
    req.user = user;
    next();
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`🚫 Auth error (${totalTime}ms):`, error.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth;