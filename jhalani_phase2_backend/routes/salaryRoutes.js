const express = require("express");

const {
  getSalaries,
  getCurrentSalary,
  getSalaryHistory,
  createSalary,
  updateSalary,
  deactivateSalary,
} = require("../controllers/salaryController");

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* All salary routes require login */

router.get(
  "/",
  authenticate,
  getSalaries
);

router.get(
  "/employee/:employeeId/current",
  authenticate,
  getCurrentSalary
);

router.get(
  "/employee/:employeeId/history",
  authenticate,
  getSalaryHistory
);

router.post(
  "/",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "ACCOUNTS"
  ),
  createSalary
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "ACCOUNTS"
  ),
  updateSalary
);

router.patch(
  "/:id/deactivate",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "ACCOUNTS"
  ),
  deactivateSalary
);

module.exports = router;