const express = require("express");
const branchController = require("../controllers/branch.controller");

const router = express.Router();

// GET /branches
router.get("/branches", branchController.getBranches);
router.get("/", branchController.getBranches);

// GET /dentists
router.get("/dentists", branchController.getDentists);

module.exports = router;
