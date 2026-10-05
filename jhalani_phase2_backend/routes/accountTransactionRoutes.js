const express = require("express");

const router = express.Router();

const {
  getTransactions,
  getTransactionById,
  createTransaction,
  deleteTransaction,
} = require("../controllers/accountTransactionController");
const { authenticate } = require("../middleware/authMiddleware");


// =====================================================
// TRANSACTIONS
// =====================================================

router.get(
  "/",
  authenticate,
  getTransactions
);

router.get(
  "/:id",
  authenticate,
  getTransactionById
);

router.post(
  "/",
  authenticate,
  createTransaction
);

router.delete(
  "/:id",
  authenticate,
  deleteTransaction
);

module.exports = router;