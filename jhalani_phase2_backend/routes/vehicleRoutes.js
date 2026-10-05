const express = require("express");

const router = express.Router();

const vehicleController = require("../controllers/vehicleController");

const {
  authenticate,
} = require("../middleware/authMiddleware");


router.get(
  "/",
  authenticate,
  vehicleController.getVehicles
);

router.get(
  "/:id",
  authenticate,
  vehicleController.getVehicleById
);

router.post(
  "/",
  authenticate,
  vehicleController.createVehicle
);

router.put(
  "/:id",
  authenticate,
  vehicleController.updateVehicle
);

router.patch(
  "/:id/status",
  authenticate,
  vehicleController.updateVehicleStatus
);

router.delete(
  "/:id",
  authenticate,
  vehicleController.deleteVehicle
);


module.exports = router;