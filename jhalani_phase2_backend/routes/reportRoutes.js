const express = require("express");

const {
  getDashboardSummary,
  getSalesReport,
  getPurchaseReport,
  getSalesReturnReport,
  getPurchaseReturnReport,
  getStockReport,
  getAccountReport,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/dashboard", getDashboardSummary);

router.get("/sales", getSalesReport);

router.get("/purchases", getPurchaseReport);

router.get(
  "/sales-returns",
  getSalesReturnReport
);

router.get(
  "/purchase-returns",
  getPurchaseReturnReport
);

router.get("/stock", getStockReport);

router.get("/accounts", getAccountReport);

module.exports = router;