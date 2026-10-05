const express = require("express");

const router = express.Router();

const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  createRevision,
  getRevisions,
  getQuotationParties,
  getQuotationVariants,
} = require("../controllers/quotationController");

/* ============================================================
   MASTER DATA
   ============================================================ */

router.get(
  "/masters/parties",
  getQuotationParties
);

router.get(
  "/masters/variants",
  getQuotationVariants
);

/* ============================================================
   QUOTATIONS
   ============================================================ */

router.get(
  "/",
  getQuotations
);

router.post(
  "/",
  createQuotation
);

/*
  IMPORTANT:
  Put /:id routes AFTER the /masters routes.
*/

router.get(
  "/:id",
  getQuotationById
);

router.put(
  "/:id",
  updateQuotation
);

router.put(
  "/:id/status",
  updateQuotationStatus
);

router.post(
  "/:id/revise",
  createRevision
);

router.get(
  "/:id/revisions",
  getRevisions
);

module.exports = router;