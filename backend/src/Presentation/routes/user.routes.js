const express = require("express");
const userController = require("../controllers/user.controller");
const authenticate = require("../middleware/auth");

const router = express.Router();

// All settings and user profile routes require valid authentication (FR-AUTH-04, FR-SET-01)
router.use(authenticate);

// Profile viewing (SRS 8.5.1: GET /me)
router.get("/", userController.getProfile);
router.get("/profile", userController.getProfile);
router.get("/me", userController.getProfile);

// Profile updating (SRS 8.5.1: PATCH /me)
router.patch("/", userController.updateProfile);
router.put("/", userController.updateProfile);
router.patch("/profile", userController.updateProfile);
router.put("/profile", userController.updateProfile);

// Theme preference (SRS 8.5.1: PATCH /me/theme, FR-SET-02)
router.patch("/theme", userController.updateTheme);
router.put("/theme", userController.updateTheme);

// Password changing (SRS 8.5.1: POST /me/password)
router.post("/password", userController.changePassword);
router.put("/password", userController.changePassword);
router.patch("/password", userController.changePassword);
router.post("/change-password", userController.changePassword);

// Specific field updates
router.patch("/name", userController.updateName);
router.put("/name", userController.updateName);
router.patch("/contact", userController.updateContact);
router.put("/contact", userController.updateContact);

module.exports = router;
