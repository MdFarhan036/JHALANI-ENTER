const express = require("express");

const router = express.Router();

const {
  getPartyPayments,
  getPartyPaymentById,
  createPartyPayment,
  updatePartyPayment,
  cancelPartyPayment,
} = require("../controllers/partyPaymentController");

/* ============================================================
   PARTY PAYMENTS
   ============================================================ */

router.get("/", getPartyPayments);

router.get("/:id", getPartyPaymentById);

router.post("/", createPartyPayment);

router.put("/:id", updatePartyPayment);

router.put("/:id/cancel", cancelPartyPayment);

module.exports = router;