require("dotenv").config();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const Claim = require('../models/claim');

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

// Get Dashboard Statistics (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    // Item statistics
    const totalLostItems = await LostItem.countDocuments();
    const totalFoundItems = await FoundItem.countDocuments();
    const activeLostItems = await LostItem.countDocuments({ status: 'active' });
    const activeFoundItems = await FoundItem.countDocuments({ status: 'active' });
    const claimedItems = await LostItem.countDocuments({ status: 'claimed' }) + 
                        await FoundItem.countDocuments({ status: 'claimed' });
    
    // Claim statistics
    const totalClaims = await Claim.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: 'pending' });
    const approvedClaims = await Claim.countDocuments({ status: 'approved' });
    const completedClaims = await Claim.countDocuments({ status: 'completed' });
    const rejectedClaims = await Claim.countDocuments({ status: 'rejected' });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLostItems = await LostItem.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentFoundItems = await FoundItem.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentClaims = await Claim.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Weekly activity (last 7 days) - build arrays for charts
    const weeklyActivity = [];
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0,0,0,0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23,59,59,999);

      const lostCount = await LostItem.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } });
      const foundCount = await FoundItem.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } });
      const claimCount = await Claim.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } });

      weeklyActivity.push({
        date: dayStart.toISOString(),
        name: dayNames[dayStart.getDay()] ,
        lost: lostCount,
        found: foundCount,
        claims: claimCount
      });
    }

    // Category breakdown for lost vs found
    // Aggregate counts per category for lost and found items
    const lostByCategoryAgg = await LostItem.aggregate([
      { $match: { status: { $exists: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const foundByCategoryAgg = await FoundItem.aggregate([
      { $match: { status: { $exists: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoryMap = new Map();
    lostByCategoryAgg.forEach(c => {
      if (!c._id) return;
      categoryMap.set(c._id, { name: c._id, lost: c.count, found: 0 });
    });
    foundByCategoryAgg.forEach(c => {
      if (!c._id) return;
      const existing = categoryMap.get(c._id);
      if (existing) {
        existing.found = c.count;
      } else {
        categoryMap.set(c._id, { name: c._id, lost: 0, found: c.count });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values()).sort((a,b) => (b.lost + b.found) - (a.lost + a.found)).slice(0,10);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          regular: totalUsers - totalAdmins
        },
        items: {
          totalLost: totalLostItems,
          totalFound: totalFoundItems,
          activeLost: activeLostItems,
          activeFound: activeFoundItems,
          claimed: claimedItems
        },
        claims: {
          total: totalClaims,
          pending: pendingClaims,
          approved: approvedClaims,
          completed: completedClaims,
          rejected: rejectedClaims
        },
        recentActivity: {
          lostItems: recentLostItems,
          foundItems: recentFoundItems,
          claims: recentClaims,
          registrations: recentRegistrations
        }
        ,
        weeklyActivity,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};