const express = require("express");

const {
  getParties,
  getPartyLedger,
  getPartyLedgerSummary,
} = require("../controllers/partyLedgerController");

const router = express.Router();

// All parties
router.get("/parties", getParties);

// Individual party ledger
router.get("/:partyId", getPartyLedger);

// Individual party summary
router.get("/:partyId/summary", getPartyLedgerSummary);

module.exports = router;