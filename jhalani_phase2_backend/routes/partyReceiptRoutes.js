const express = require("express");
const router = express.Router();

const {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  cancelReceipt,
} = require("../controllers/partyReceiptController");

// List receipts
router.get("/", getReceipts);

// Get single receipt
router.get("/:id", getReceiptById);

// Create receipt
router.post("/", createReceipt);

// Update receipt
router.put("/:id", updateReceipt);

// Cancel receipt
router.delete("/:id", cancelReceipt);

module.exports = router;