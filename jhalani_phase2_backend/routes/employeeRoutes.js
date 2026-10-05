const express = require("express");

const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* ============================================================
   GET ALL EMPLOYEES
   GET /api/employees
   ============================================================ */

router.get(
  "/",
  authenticate,
  getEmployees
);


/* ============================================================
   GET SINGLE EMPLOYEE
   GET /api/employees/:id
   ============================================================ */

router.get(
  "/:id",
  authenticate,
  getEmployeeById
);


/* ============================================================
   CREATE EMPLOYEE
   POST /api/employees
   ============================================================ */

router.post(
  "/",
  authenticate,
  createEmployee
);


/* ============================================================
   UPDATE EMPLOYEE
   PUT /api/employees/:id
   ============================================================ */

router.put(
  "/:id",
  authenticate,
  updateEmployee
);


/* ============================================================
   DEACTIVATE EMPLOYEE
   DELETE /api/employees/:id
   ============================================================ */

router.delete(
  "/:id",
  authenticate,
  deleteEmployee
);

module.exports = router;