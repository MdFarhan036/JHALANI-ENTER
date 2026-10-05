
const { pool } = require("../db");


/*
|--------------------------------------------------------------------------
| GET ALL PRODUCTS
|--------------------------------------------------------------------------
*/

const getProducts = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT
        p.id,
        p.product_code,
        p.product_name,
        p.short_name,
        p.description,

        p.category_id,
        c.name AS category_name,

        p.unit_id,
        su.name AS unit_name,
        su.symbol AS unit_symbol,

        p.base_unit_id,
        bu.name AS base_unit_name,
        bu.symbol AS base_unit_symbol,

        p.brand,
        p.manufacturer,
        p.hsn_code,
        p.gst_rate,

        p.reorder_level,
        p.min_stock,
        p.max_stock,

        p.is_batch_tracked,
        p.is_expiry_tracked,

        p.status,
        p.remarks,

        p.created_by,
        p.created_at,
        p.updated_at

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN units su
        ON su.id = p.unit_id

      LEFT JOIN units bu
        ON bu.id = p.base_unit_id

      ORDER BY p.id DESC
    `);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET PRODUCT BY ID
|--------------------------------------------------------------------------
*/

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `
      SELECT
        p.id,
        p.product_code,
        p.product_name,
        p.short_name,
        p.description,

        p.category_id,
        c.name AS category_name,

        p.unit_id,
        su.name AS unit_name,
        su.symbol AS unit_symbol,

        p.base_unit_id,
        bu.name AS base_unit_name,
        bu.symbol AS base_unit_symbol,

        p.brand,
        p.manufacturer,
        p.hsn_code,
        p.gst_rate,

        p.reorder_level,
        p.min_stock,
        p.max_stock,

        p.is_batch_tracked,
        p.is_expiry_tracked,

        p.status,
        p.remarks,

        p.created_by,
        p.created_at,
        p.updated_at

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN units su
        ON su.id = p.unit_id

      LEFT JOIN units bu
        ON bu.id = p.base_unit_id

      WHERE p.id = ?
      `,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: products[0],
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/

const createProduct = async (req, res) => {
  try {
    const {
      product_code,
      product_name,
      short_name,
      description,

      category_id,
      unit_id,
      base_unit_id,

      brand,
      manufacturer,
      hsn_code,
      gst_rate,

      reorder_level,
      min_stock,
      max_stock,

      is_batch_tracked,
      is_expiry_tracked,

      status,
      remarks,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELDS
    |--------------------------------------------------------------------------
    */

    if (!product_code || !product_code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE VALUES
    |--------------------------------------------------------------------------
    */

    const code = product_code.trim();
    const name = product_name.trim();

    const finalStatus =
      status === 0 ||
      status === "0" ||
      status === false
        ? 0
        : 1;

    const gstRate =
      gst_rate === undefined ||
      gst_rate === null ||
      gst_rate === ""
        ? 0
        : Number(gst_rate);

    const reorderLevel =
      reorder_level === undefined ||
      reorder_level === null ||
      reorder_level === ""
        ? 0
        : Number(reorder_level);

    const minStock =
      min_stock === undefined ||
      min_stock === null ||
      min_stock === ""
        ? 0
        : Number(min_stock);

    const maxStock =
      max_stock === undefined ||
      max_stock === null ||
      max_stock === ""
        ? 0
        : Number(max_stock);

    /*
    |--------------------------------------------------------------------------
    | CHECK DUPLICATE PRODUCT CODE
    |--------------------------------------------------------------------------
    */

    const [existing] = await pool.query(
      `
      SELECT id
      FROM products
      WHERE product_code = ?
      LIMIT 1
      `,
      [code]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK CATEGORY
    |--------------------------------------------------------------------------
    */

    const [category] = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE id = ?
      LIMIT 1
      `,
      [category_id]
    );

    if (category.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK SALES UNIT
    |--------------------------------------------------------------------------
    */

    if (unit_id) {
      const [unit] = await pool.query(
        `
        SELECT id
        FROM units
        WHERE id = ?
        LIMIT 1
        `,
        [unit_id]
      );

      if (unit.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected unit does not exist",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK BASE UNIT
    |--------------------------------------------------------------------------
    */

    if (base_unit_id) {
      const [baseUnit] = await pool.query(
        `
        SELECT id
        FROM units
        WHERE id = ?
        LIMIT 1
        `,
        [base_unit_id]
      );

      if (baseUnit.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected base unit does not exist",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PRODUCT
    |--------------------------------------------------------------------------
    */

    const [result] = await pool.query(
      `
      INSERT INTO products
      (
        product_code,
        category_id,
        unit_id,
        product_name,
        short_name,
        description,
        brand,
        manufacturer,
        hsn_code,
        gst_rate,
        base_unit_id,
        reorder_level,
        min_stock,
        max_stock,
        is_batch_tracked,
        is_expiry_tracked,
        status,
        remarks
      )
      VALUES
      (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      `,
      [
        code,
        category_id,
        unit_id || null,
        name,
        short_name?.trim() || null,
        description?.trim() || null,
        brand?.trim() || null,
        manufacturer?.trim() || null,
        hsn_code?.trim() || null,
        gstRate,
        base_unit_id || null,
        reorderLevel,
        minStock,
        maxStock,
        is_batch_tracked ? 1 : 0,
        is_expiry_tracked ? 1 : 0,
        finalStatus,
        remarks?.trim() || null,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | RETURN CREATED PRODUCT
    |--------------------------------------------------------------------------
    */

    const [newProduct] = await pool.query(
      `
      SELECT
        p.id,
        p.product_code,
        p.product_name,
        p.short_name,
        p.description,

        p.category_id,
        c.name AS category_name,

        p.unit_id,
        su.name AS unit_name,
        su.symbol AS unit_symbol,

        p.base_unit_id,
        bu.name AS base_unit_name,
        bu.symbol AS base_unit_symbol,

        p.brand,
        p.manufacturer,
        p.hsn_code,
        p.gst_rate,

        p.reorder_level,
        p.min_stock,
        p.max_stock,

        p.is_batch_tracked,
        p.is_expiry_tracked,

        p.status,
        p.remarks,

        p.created_by,
        p.created_at,
        p.updated_at

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN units su
        ON su.id = p.unit_id

      LEFT JOIN units bu
        ON bu.id = p.base_unit_id

      WHERE p.id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct[0],
    });
  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      product_code,
      product_name,
      short_name,
      description,

      category_id,
      unit_id,
      base_unit_id,

      brand,
      manufacturer,
      hsn_code,
      gst_rate,

      reorder_level,
      min_stock,
      max_stock,

      is_batch_tracked,
      is_expiry_tracked,

      status,
      remarks,
    } = req.body;

    if (!product_code || !product_code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK PRODUCT
    |--------------------------------------------------------------------------
    */

    const [existingProduct] = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK DUPLICATE CODE
    |--------------------------------------------------------------------------
    */

    const [duplicate] = await pool.query(
      `
      SELECT id
      FROM products
      WHERE product_code = ?
      AND id != ?
      LIMIT 1
      `,
      [
        product_code.trim(),
        id,
      ]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE
    |--------------------------------------------------------------------------
    */

    const finalStatus =
      status === 0 ||
      status === "0" ||
      status === false
        ? 0
        : 1;

    const gstRate =
      gst_rate === undefined ||
      gst_rate === null ||
      gst_rate === ""
        ? 0
        : Number(gst_rate);

    const reorderLevel =
      reorder_level === undefined ||
      reorder_level === null ||
      reorder_level === ""
        ? 0
        : Number(reorder_level);

    const minStock =
      min_stock === undefined ||
      min_stock === null ||
      min_stock === ""
        ? 0
        : Number(min_stock);

    const maxStock =
      max_stock === undefined ||
      max_stock === null ||
      max_stock === ""
        ? 0
        : Number(max_stock);

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    await pool.query(
      `
      UPDATE products
      SET
        product_code = ?,
        category_id = ?,
        unit_id = ?,
        product_name = ?,
        short_name = ?,
        description = ?,
        brand = ?,
        manufacturer = ?,
        hsn_code = ?,
        gst_rate = ?,
        base_unit_id = ?,
        reorder_level = ?,
        min_stock = ?,
        max_stock = ?,
        is_batch_tracked = ?,
        is_expiry_tracked = ?,
        status = ?,
        remarks = ?
      WHERE id = ?
      `,
      [
        product_code.trim(),
        category_id,
        unit_id || null,
        product_name.trim(),
        short_name?.trim() || null,
        description?.trim() || null,
        brand?.trim() || null,
        manufacturer?.trim() || null,
        hsn_code?.trim() || null,
        gstRate,
        base_unit_id || null,
        reorderLevel,
        minStock,
        maxStock,
        is_batch_tracked ? 1 : 0,
        is_expiry_tracked ? 1 : 0,
        finalStatus,
        remarks?.trim() || null,
        id,
      ]
    );

    const [updatedProduct] = await pool.query(
      `
      SELECT
        p.id,
        p.product_code,
        p.product_name,
        p.short_name,
        p.description,

        p.category_id,
        c.name AS category_name,

        p.unit_id,
        su.name AS unit_name,
        su.symbol AS unit_symbol,

        p.base_unit_id,
        bu.name AS base_unit_name,
        bu.symbol AS base_unit_symbol,

        p.brand,
        p.manufacturer,
        p.hsn_code,
        p.gst_rate,

        p.reorder_level,
        p.min_stock,
        p.max_stock,

        p.is_batch_tracked,
        p.is_expiry_tracked,

        p.status,
        p.remarks,

        p.created_by,
        p.created_at,
        p.updated_at

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN units su
        ON su.id = p.unit_id

      LEFT JOIN units bu
        ON bu.id = p.base_unit_id

      WHERE p.id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct[0],
    });
  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT STATUS
|--------------------------------------------------------------------------
*/

const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const finalStatus =
      status === 0 ||
      status === "0" ||
      status === false
        ? 0
        : 1;

    const [result] = await pool.query(
      `
      UPDATE products
      SET status = ?
      WHERE id = ?
      `,
      [
        finalStatus,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message:
        finalStatus === 1
          ? "Product activated successfully"
          : "Product deactivated successfully",
    });
  } catch (error) {
    console.error(
      "Update product status error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update product status",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      `
      SELECT id, product_name
      FROM products
      WHERE id = ?
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await pool.query(
      `
      DELETE FROM products
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
};