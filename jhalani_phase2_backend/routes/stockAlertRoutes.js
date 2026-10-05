const express = require("express");

const router = express.Router();

const {
  getStockAlerts,
  getOutOfStock,
} = require("../controllers/stockAlertController");

const authMiddleware = require("../middleware/authMiddleware");

const authenticate =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware.authenticate;

if (typeof authenticate !== "function") {
  throw new Error(
    "Authentication middleware is not exported correctly from authMiddleware.js"
  );
};


/*
============================================================
ALL STOCK ALERTS
============================================================
*/

router.get(
  "/",
  authenticate,
  getStockAlerts
);


/*
============================================================
OUT OF STOCK
============================================================
*/

router.get(
  "/out-of-stock",
  authenticate,
  getOutOfStock
);


module.exports = router;