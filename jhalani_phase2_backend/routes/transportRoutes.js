const express = require("express");

const router = express.Router();

const transportController = require("../controllers/transportController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  authenticate,
  transportController.getTransporters
);

router.get(
  "/:id",
  authenticate,
  transportController.getTransporterById
);

router.post(
  "/",
  authenticate,
  transportController.createTransporter
);

router.put(
  "/:id",
  authenticate,
  transportController.updateTransporter
);

router.patch(
  "/:id/status",
  authenticate,
  transportController.updateTransporterStatus
);

router.delete(
  "/:id",
  authenticate,
  transportController.deleteTransporter
);

module.exports = router;