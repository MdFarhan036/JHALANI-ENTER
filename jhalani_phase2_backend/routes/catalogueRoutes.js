const express = require("express");

const {
  getCatalogueProducts,
  getCatalogueProductById,
  createCatalogueProduct,
  updateCatalogueProduct,
  deleteCatalogueProduct,

  addSpecification,
  updateSpecification,
  deleteSpecification,

  addImage,
  deleteImage,

  addDocument,
  deleteDocument,
} = require("../controllers/catalogueController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CATALOGUE ROUTES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authenticate,
  getCatalogueProducts
);

router.get(
  "/:id",
  authenticate,
  getCatalogueProductById
);

router.post(
  "/",
  authenticate,
  createCatalogueProduct
);

router.put(
  "/:id",
  authenticate,
  updateCatalogueProduct
);

router.delete(
  "/:id",
  authenticate,
  deleteCatalogueProduct
);

/*
|--------------------------------------------------------------------------
| SPECIFICATIONS
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/specifications",
  authenticate,
  addSpecification
);

router.put(
  "/specifications/:specId",
  authenticate,
  updateSpecification
);

router.delete(
  "/specifications/:specId",
  authenticate,
  deleteSpecification
);

/*
|--------------------------------------------------------------------------
| IMAGES
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/images",
  authenticate,
  addImage
);

router.delete(
  "/images/:imageId",
  authenticate,
  deleteImage
);

/*
|--------------------------------------------------------------------------
| DOCUMENTS
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/documents",
  authenticate,
  addDocument
);

router.delete(
  "/documents/:documentId",
  authenticate,
  deleteDocument
);

module.exports = router;