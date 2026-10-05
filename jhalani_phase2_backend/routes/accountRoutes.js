const express = require("express");

const router = express.Router();

const accountController = require("../controllers/accountController");
const authMiddleware = require("../middleware/authMiddleware");

const authenticate =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware.authenticate;

// =====================================================
// ACCOUNTS
// =====================================================

router.get(
  "/",
  authenticate,
  accountController.getAccounts
);

// Account balance
router.get(
  "/:id/balance",
  authenticate,
  accountController.getAccountBalance
);

// Account transactions
router.get(
  "/:id/transactions",
  authenticate,
  accountController.getAccountTransactions
);

// Single account
router.get(
  "/:id",
  authenticate,
  accountController.getAccountById
);

// Create account
router.post(
  "/",
  authenticate,
  accountController.createAccount
);

// Update account
router.put(
  "/:id",
  authenticate,
  accountController.updateAccount
);

// Delete account
router.delete(
  "/:id",
  authenticate,
  accountController.deleteAccount
);

// =====================================================
// ACCOUNT TRANSACTIONS
// =====================================================

router.post(
  "/transactions",
  authenticate,
  accountController.createTransaction
);

module.exports = router;