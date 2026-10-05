const { pool } = require("../db");

/*
|--------------------------------------------------------------------------
| GET ALL CATEGORIES
|--------------------------------------------------------------------------
*/

const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.code,
        c.description,
        c.status,
        c.created_at,
        c.updated_at,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p
        ON p.category_id = c.id
      GROUP BY
        c.id,
        c.name,
        c.code,
        c.description,
        c.status,
        c.created_at,
        c.updated_at
      ORDER BY c.id DESC
    `);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET CATEGORY BY ID
|--------------------------------------------------------------------------
*/

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.code,
        c.description,
        c.status,
        c.created_at,
        c.updated_at,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p
        ON p.category_id = c.id
      WHERE c.id = ?
      GROUP BY
        c.id,
        c.name,
        c.code,
        c.description,
        c.status,
        c.created_at,
        c.updated_at
      `,
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: categories[0],
    });
  } catch (error) {
    console.error("Get category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE CATEGORY
|--------------------------------------------------------------------------
*/

const createCategory = async (req, res) => {
  try {
    const { name, code, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const categoryName = name.trim();
    const categoryCode = code ? code.trim() : null;
    const categoryDescription = description
      ? description.trim()
      : null;

    // Check duplicate name
    const [existingName] = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE LOWER(name) = LOWER(?)
      LIMIT 1
      `,
      [categoryName]
    );

    if (existingName.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Check duplicate code
    if (categoryCode) {
      const [existingCode] = await pool.query(
        `
        SELECT id
        FROM categories
        WHERE LOWER(code) = LOWER(?)
        LIMIT 1
        `,
        [categoryCode]
      );

      if (existingCode.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Category code already exists",
        });
      }
    }

    const categoryStatus =
      status === "inactive" ? "inactive" : "active";

    const [result] = await pool.query(
      `
      INSERT INTO categories
      (
        name,
        code,
        description,
        status
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        categoryName,
        categoryCode,
        categoryDescription,
        categoryStatus,
      ]
    );

    const [newCategory] = await pool.query(
      `
      SELECT
        id,
        name,
        code,
        description,
        status,
        created_at,
        updated_at
      FROM categories
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory[0],
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Category name or code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE CATEGORY
|--------------------------------------------------------------------------
*/

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const categoryName = name.trim();
    const categoryCode = code ? code.trim() : null;
    const categoryDescription = description
      ? description.trim()
      : null;

    // Check category exists
    const [existing] = await pool.query(
      "SELECT id FROM categories WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Duplicate name check
    const [duplicateName] = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE LOWER(name) = LOWER(?)
      AND id != ?
      LIMIT 1
      `,
      [categoryName, id]
    );

    if (duplicateName.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Duplicate code check
    if (categoryCode) {
      const [duplicateCode] = await pool.query(
        `
        SELECT id
        FROM categories
        WHERE LOWER(code) = LOWER(?)
        AND id != ?
        LIMIT 1
        `,
        [categoryCode, id]
      );

      if (duplicateCode.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Category code already exists",
        });
      }
    }

    const categoryStatus =
      status === "inactive" ? "inactive" : "active";

    await pool.query(
      `
      UPDATE categories
      SET
        name = ?,
        code = ?,
        description = ?,
        status = ?
      WHERE id = ?
      `,
      [
        categoryName,
        categoryCode,
        categoryDescription,
        categoryStatus,
        id,
      ]
    );

    const [updatedCategory] = await pool.query(
      `
      SELECT
        id,
        name,
        code,
        description,
        status,
        created_at,
        updated_at
      FROM categories
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory[0],
    });
  } catch (error) {
    console.error("Update category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE CATEGORY STATUS
|--------------------------------------------------------------------------
*/

const updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE categories
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: `Category ${
        status === "active" ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error("Update category status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update category status",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE CATEGORY
|--------------------------------------------------------------------------
*/

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check category
    const [category] = await pool.query(
      `
      SELECT id, name
      FROM categories
      WHERE id = ?
      `,
      [id]
    );

    if (category.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check products
    const [products] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM products
      WHERE category_id = ?
      `,
      [id]
    );

    if (Number(products[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This category contains products and cannot be deleted. Move or remove the products first.",
        product_count: Number(products[0].count),
      });
    }

    await pool.query(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
};