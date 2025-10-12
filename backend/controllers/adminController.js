require("dotenv").config();
const jwt = require('jsonwebtoken');

exports.adminLogin = (req, res) => {
  const { email, password } = req.body;

  // Validate environment variables
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    console.error('❌ Missing environment variables:', {
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      JWT_SECRET: !!process.env.JWT_SECRET
    });
    return res.status(500).json({ 
      success: false, 
      message: "Server configuration error" 
    });
  }

  console.log('🔐 Admin login attempt:', { 
    email, 
    expectedEmail: process.env.ADMIN_EMAIL,
    passwordMatch: password === process.env.ADMIN_PASSWORD 
  });

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          email: email,
          role: 'admin',
          type: 'admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('✅ Admin login successful for:', email);

      res.status(200).json({ 
        success: true, 
        message: "Admin login successful",
        token: token,
        admin: {
          email: email,
          role: 'admin'
        }
      });
    } catch (error) {
      console.error('❌ JWT generation error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Token generation failed" 
      });
    }
  } else {
    console.log('❌ Invalid admin credentials:', { 
      email, 
      providedPassword: password ? '***' : 'empty' 
    });
    res.status(401).json({ 
      success: false, 
      message: "Invalid admin credentials" 
    });
    console.log(`"${password}" === "${process.env.ADMIN_PASSWORD}"`);

  }
};