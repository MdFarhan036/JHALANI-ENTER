const express = require("express");

const {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  updateUnitStatus,
  deleteUnit,
} = require("../controllers/unitController");

const router = express.Router();

router.get("/", getUnits);

router.get("/:id", getUnitById);

router.post("/", createUnit);

router.put("/:id", updateUnit);

router.patch("/:id/status", updateUnitStatus);

router.delete("/:id", deleteUnit);

module.exports = router;