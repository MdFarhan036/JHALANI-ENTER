const express = require("express");

const {
  getParties,
  getPartyById,
  createParty,
  updateParty,
  togglePartyStatus,
  deleteParty,
} = require("../controllers/partyController");

const router = express.Router();

router.get("/", getParties);

router.get("/:id", getPartyById);

router.post("/", createParty);

router.put("/:id", updateParty);

router.patch("/:id/status", togglePartyStatus);

router.delete("/:id", deleteParty);

module.exports = router;