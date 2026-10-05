const express = require("express");

const {
  getDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} = require("../controllers/designationController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  getDesignations
);

router.get(
  "/:id",
  authenticate,
  getDesignationById
);

router.post(
  "/",
  authenticate,
  createDesignation
);

router.put(
  "/:id",
  authenticate,
  updateDesignation
);

router.delete(
  "/:id",
  authenticate,
  deleteDesignation
);

module.exports = router;