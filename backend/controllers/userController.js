const User = require('../models/user');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const Claim = require('../models/claim');

// Get All Users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;

    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get User by ID (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update User Role (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "admin"'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete User (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is trying to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user's items and claims
    await LostItem.deleteMany({ user: id });
    await FoundItem.deleteMany({ user: id });
    await Claim.deleteMany({ 
      $or: [{ claimant: id }, { finder: id }] 
    });

    await user.remove();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get User Statistics (Admin only)
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalRegularUsers,
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get User Activity (Admin only)
exports.getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's items
    const lostItems = await LostItem.find({ user: id }).countDocuments();
    const foundItems = await FoundItem.find({ user: id }).countDocuments();
    
    // Get user's claims
    const claimsAsClaimant = await Claim.find({ claimant: id }).countDocuments();
    const claimsAsFinder = await Claim.find({ finder: id }).countDocuments();
    
    // Get successful claims
    const successfulClaims = await Claim.find({ 
      $or: [{ claimant: id }, { finder: id }],
      status: 'completed'
    }).countDocuments();

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          role: user.role,
          createdAt: user.createdAt
        },
        activity: {
          lostItems,
          foundItems,
          claimsAsClaimant,
          claimsAsFinder,
          successfulClaims
        }
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
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
