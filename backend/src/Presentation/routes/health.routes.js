const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SDCMIS API is running",
        environment: process.env.NODE_ENV || "development",
    });
});

module.exports = router;