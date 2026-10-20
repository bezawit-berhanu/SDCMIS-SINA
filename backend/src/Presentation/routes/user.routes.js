const express = require("express");
const userController = require("../controllers/user.controller");
const authenticate = require("../middleware/auth");

const router = express.Router();

// All settings and user profile routes require valid authentication
router.use(authenticate);

// Profile viewing
router.get("/profile", userController.getProfile);
router.get("/me", userController.getProfile);

// 1. Update Name
router.patch("/name", userController.updateName);
router.put("/name", userController.updateName);

// 2. Update Contact
router.patch("/contact", userController.updateContact);
router.put("/contact", userController.updateContact);

// 3. Change Password
router.post("/change-password", userController.changePassword);
router.put("/password", userController.changePassword);
router.patch("/password", userController.changePassword);

// 4. Update Profile Information (comprehensive)
router.patch("/profile", userController.updateProfile);
router.put("/profile", userController.updateProfile);

module.exports = router;
