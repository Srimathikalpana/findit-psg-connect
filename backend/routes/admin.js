const express = require("express");
const router = express.Router();
const { adminLogin } = require("../controllers/adminController");
const { getDashboardStats } = require("../controllers/userController");
const { getAllLostItems, getAllFoundItems, updateItem, deleteItem } = require("../controllers/itemController");
const { getAllUsers, updateUserRole, deleteUser } = require("../controllers/userController");
const adminAuth = require("../middleware/adminAuth");

// POST route for admin login (no auth required)
router.post("/login", adminLogin);

// Protected admin routes
router.use(adminAuth);

// Dashboard statistics
router.get("/stats", getDashboardStats);

// Items management
router.get("/lost-items", getAllLostItems);
router.get("/found-items", getAllFoundItems);
router.put("/items/:id/status", updateItem);
router.delete("/items/:id", deleteItem);

// Users management
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;

