const { pool } = require("../db");

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const normalizeNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const normalizeBoolean = (value, fallback = 1) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value === 0 || value === "0" || value === false ? 0 : 1;
};

const getCatalogueProduct = async (id) => {
  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.product_code,
        p.product_name,
        p.short_name,
        p.description,

        p.temperature_min,
        p.temperature_max,
        p.temperature_unit,
        p.material_construction,
        p.catalogue_visible,

        p.category_id,
        c.name AS category_name,
        c.parent_id AS parent_category_id,

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
      LIMIT 1
    `,
    [id]
  );

  if (!rows.length) {
    return null;
  }

  const product = rows[0];

  const [specifications] = await pool.query(
    `
      SELECT
        id,
        product_id,
        specification_name,
        specification_value,
        sort_order,
        created_at,
        updated_at
      FROM product_catalogue_specs
      WHERE product_id = ?
      ORDER BY sort_order ASC, id ASC
    `,
    [id]
  );

  const [images] = await pool.query(
    `
      SELECT
        id,
        product_id,
        image_title,
        image_path,
        is_primary,
        sort_order,
        status,
        created_at,
        updated_at
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `,
    [id]
  );

  const [documents] = await pool.query(
    `
      SELECT
        id,
        product_id,
        document_title,
        document_type,
        file_name,
        file_path,
        file_size,
        mime_type,
        sort_order,
        status,
        created_at,
        updated_at
      FROM product_documents
      WHERE product_id = ?
      ORDER BY sort_order ASC, id ASC
    `,
    [id]
  );

  return {
    ...product,
    specifications,
    images,
    documents,
  };
};

/*
|--------------------------------------------------------------------------
| GET ALL CATALOGUE PRODUCTS
|--------------------------------------------------------------------------
*/

const getCatalogueProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      `
        SELECT
          p.id,
          p.product_code,
          p.product_name,
          p.short_name,
          p.description,

          p.temperature_min,
          p.temperature_max,
          p.temperature_unit,
          p.material_construction,
          p.catalogue_visible,

          p.category_id,
          c.name AS category_name,
          c.parent_id AS parent_category_id,

          p.unit_id,
          su.name AS unit_name,
          su.symbol AS unit_symbol,

          p.brand,
          p.manufacturer,
          p.hsn_code,
          p.gst_rate,

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

        WHERE p.catalogue_visible = 1

        ORDER BY p.id DESC
      `
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get catalogue products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch catalogue products",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET CATALOGUE PRODUCT BY ID
|--------------------------------------------------------------------------
*/

const getCatalogueProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getCatalogueProduct(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Catalogue product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get catalogue product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch catalogue product",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE CATALOGUE PRODUCT
|--------------------------------------------------------------------------
*/

const createCatalogueProduct = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      product_code,
      product_name,
      short_name,
      description,

      temperature_min,
      temperature_max,
      temperature_unit,
      material_construction,

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
      catalogue_visible,
      remarks,

      specifications = [],
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!product_code || !product_code.trim()) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!product_name || !product_name.trim()) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category_id) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE PRODUCT CODE
    |--------------------------------------------------------------------------
    */

    const [existing] = await connection.query(
      `
        SELECT id
        FROM products
        WHERE product_code = ?
        LIMIT 1
      `,
      [product_code.trim()]
    );

    if (existing.length) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY CHECK
    |--------------------------------------------------------------------------
    */

    const [category] = await connection.query(
      `
        SELECT id
        FROM categories
        WHERE id = ?
        LIMIT 1
      `,
      [category_id]
    );

    if (!category.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Selected category does not exist",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT CHECK
    |--------------------------------------------------------------------------
    */

    if (unit_id) {
      const [unit] = await connection.query(
        `
          SELECT id
          FROM units
          WHERE id = ?
          LIMIT 1
        `,
        [unit_id]
      );

      if (!unit.length) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Selected unit does not exist",
        });
      }
    }

    if (base_unit_id) {
      const [baseUnit] = await connection.query(
        `
          SELECT id
          FROM units
          WHERE id = ?
          LIMIT 1
        `,
        [base_unit_id]
      );

      if (!baseUnit.length) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Selected base unit does not exist",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE
    |--------------------------------------------------------------------------
    */

    const temperatureMin = normalizeNumber(temperature_min);
    const temperatureMax = normalizeNumber(temperature_max);

    if (
      temperatureMin !== null &&
      temperatureMax !== null &&
      temperatureMin > temperatureMax
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Temperature minimum cannot be greater than maximum",
      });
    }

    const gstRate = normalizeNumber(gst_rate, 0);
    const reorderLevel = normalizeNumber(reorder_level, 0);
    const minStock = normalizeNumber(min_stock, 0);
    const maxStock = normalizeNumber(max_stock, 0);

    const finalStatus = normalizeBoolean(status, 1);
    const finalCatalogueVisible = normalizeBoolean(catalogue_visible, 1);

    /*
    |--------------------------------------------------------------------------
    | CREATE PRODUCT
    |--------------------------------------------------------------------------
    */

    const [result] = await connection.query(
      `
        INSERT INTO products
        (
          product_code,
          category_id,
          unit_id,
          product_name,
          short_name,
          description,

          temperature_min,
          temperature_max,
          temperature_unit,
          material_construction,
          catalogue_visible,

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
          remarks,
          created_by
        )
        VALUES
        (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?,
          ?, ?, ?
        )
      `,
      [
        product_code.trim(),
        Number(category_id),
        unit_id ? Number(unit_id) : null,
        product_name.trim(),
        short_name?.trim() || null,
        description?.trim() || null,

        temperatureMin,
        temperatureMax,
        temperature_unit?.trim() || "°C",
        material_construction?.trim() || null,
        finalCatalogueVisible,

        brand?.trim() || null,
        manufacturer?.trim() || null,
        hsn_code?.trim() || null,
        gstRate,

        base_unit_id ? Number(base_unit_id) : null,
        reorderLevel,
        minStock,
        maxStock,

        is_batch_tracked ? 1 : 0,
        is_expiry_tracked ? 1 : 0,

        finalStatus,
        remarks?.trim() || null,
        req.user?.id || null,
      ]
    );

    const productId = result.insertId;

    /*
    |--------------------------------------------------------------------------
    | SPECIFICATIONS
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(specifications)) {
      for (let index = 0; index < specifications.length; index++) {
        const specification = specifications[index];

        const name = specification?.specification_name?.trim();

        if (!name) {
          continue;
        }

        await connection.query(
          `
            INSERT INTO product_catalogue_specs
            (
              product_id,
              specification_name,
              specification_value,
              sort_order
            )
            VALUES (?, ?, ?, ?)
          `,
          [
            productId,
            name,
            specification?.specification_value?.trim() || null,
            Number(specification?.sort_order ?? index),
          ]
        );
      }
    }

    await connection.commit();

    const product = await getCatalogueProduct(productId);

    res.status(201).json({
      success: true,
      message: "Catalogue product created successfully",
      data: product,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create catalogue product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create catalogue product",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE CATALOGUE PRODUCT
|--------------------------------------------------------------------------
*/

const updateCatalogueProduct = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const {
      product_code,
      product_name,
      short_name,
      description,

      temperature_min,
      temperature_max,
      temperature_unit,
      material_construction,

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
      catalogue_visible,
      remarks,

      specifications = [],
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | PRODUCT CHECK
    |--------------------------------------------------------------------------
    */

    const [existingProduct] = await connection.query(
      `
        SELECT id
        FROM products
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!existingProduct.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Catalogue product not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELDS
    |--------------------------------------------------------------------------
    */

    if (!product_code || !product_code.trim()) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!product_name || !product_name.trim()) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category_id) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE CODE
    |--------------------------------------------------------------------------
    */

    const [duplicate] = await connection.query(
      `
        SELECT id
        FROM products
        WHERE product_code = ?
          AND id != ?
        LIMIT 1
      `,
      [product_code.trim(), id]
    );

    if (duplicate.length) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | TEMPERATURE
    |--------------------------------------------------------------------------
    */

    const temperatureMin = normalizeNumber(temperature_min);
    const temperatureMax = normalizeNumber(temperature_max);

    if (
      temperatureMin !== null &&
      temperatureMax !== null &&
      temperatureMin > temperatureMax
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Temperature minimum cannot be greater than maximum",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE
    |--------------------------------------------------------------------------
    */

    const gstRate = normalizeNumber(gst_rate, 0);
    const reorderLevel = normalizeNumber(reorder_level, 0);
    const minStock = normalizeNumber(min_stock, 0);
    const maxStock = normalizeNumber(max_stock, 0);

    const finalStatus = normalizeBoolean(status, 1);
    const finalCatalogueVisible = normalizeBoolean(catalogue_visible, 1);

    /*
    |--------------------------------------------------------------------------
    | UPDATE PRODUCT
    |--------------------------------------------------------------------------
    */

    await connection.query(
      `
        UPDATE products
        SET
          product_code = ?,
          category_id = ?,
          unit_id = ?,
          product_name = ?,
          short_name = ?,
          description = ?,

          temperature_min = ?,
          temperature_max = ?,
          temperature_unit = ?,
          material_construction = ?,
          catalogue_visible = ?,

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
        Number(category_id),
        unit_id ? Number(unit_id) : null,
        product_name.trim(),
        short_name?.trim() || null,
        description?.trim() || null,

        temperatureMin,
        temperatureMax,
        temperature_unit?.trim() || "°C",
        material_construction?.trim() || null,
        finalCatalogueVisible,

        brand?.trim() || null,
        manufacturer?.trim() || null,
        hsn_code?.trim() || null,
        gstRate,

        base_unit_id ? Number(base_unit_id) : null,
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

    /*
    |--------------------------------------------------------------------------
    | REPLACE SPECIFICATIONS
    |--------------------------------------------------------------------------
    */

    await connection.query(
      `
        DELETE FROM product_catalogue_specs
        WHERE product_id = ?
      `,
      [id]
    );

    if (Array.isArray(specifications)) {
      for (let index = 0; index < specifications.length; index++) {
        const specification = specifications[index];

        const name = specification?.specification_name?.trim();

        if (!name) {
          continue;
        }

        await connection.query(
          `
            INSERT INTO product_catalogue_specs
            (
              product_id,
              specification_name,
              specification_value,
              sort_order
            )
            VALUES (?, ?, ?, ?)
          `,
          [
            id,
            name,
            specification?.specification_value?.trim() || null,
            Number(specification?.sort_order ?? index),
          ]
        );
      }
    }

    await connection.commit();

    const product = await getCatalogueProduct(id);

    res.json({
      success: true,
      message: "Catalogue product updated successfully",
      data: product,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Update catalogue product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update catalogue product",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| DELETE CATALOGUE PRODUCT
|--------------------------------------------------------------------------
*/

const deleteCatalogueProduct = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [existing] = await connection.query(
      `
        SELECT id, product_name
        FROM products
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!existing.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Catalogue product not found",
      });
    }

    await connection.query(
      `
        DELETE FROM products
        WHERE id = ?
      `,
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Catalogue product deleted successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Delete catalogue product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete catalogue product",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| ADD SPECIFICATION
|--------------------------------------------------------------------------
*/

const addSpecification = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      specification_name,
      specification_value,
      sort_order,
    } = req.body;

    if (!specification_name || !specification_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Specification name is required",
      });
    }

    const [product] = await pool.query(
      `
        SELECT id
        FROM products
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!product.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const [result] = await pool.query(
      `
        INSERT INTO product_catalogue_specs
        (
          product_id,
          specification_name,
          specification_value,
          sort_order
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        id,
        specification_name.trim(),
        specification_value?.trim() || null,
        Number(sort_order || 0),
      ]
    );

    const [specification] = await pool.query(
      `
        SELECT *
        FROM product_catalogue_specs
        WHERE id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Specification added successfully",
      data: specification[0],
    });
  } catch (error) {
    console.error("Add catalogue specification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add specification",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE SPECIFICATION
|--------------------------------------------------------------------------
*/

const updateSpecification = async (req, res) => {
  try {
    const { specId } = req.params;

    const {
      specification_name,
      specification_value,
      sort_order,
    } = req.body;

    if (!specification_name || !specification_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Specification name is required",
      });
    }

    const [result] = await pool.query(
      `
        UPDATE product_catalogue_specs
        SET
          specification_name = ?,
          specification_value = ?,
          sort_order = ?
        WHERE id = ?
      `,
      [
        specification_name.trim(),
        specification_value?.trim() || null,
        Number(sort_order || 0),
        specId,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Specification not found",
      });
    }

    const [specification] = await pool.query(
      `
        SELECT *
        FROM product_catalogue_specs
        WHERE id = ?
        LIMIT 1
      `,
      [specId]
    );

    res.json({
      success: true,
      message: "Specification updated successfully",
      data: specification[0],
    });
  } catch (error) {
    console.error("Update catalogue specification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update specification",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE SPECIFICATION
|--------------------------------------------------------------------------
*/

const deleteSpecification = async (req, res) => {
  try {
    const { specId } = req.params;

    const [result] = await pool.query(
      `
        DELETE FROM product_catalogue_specs
        WHERE id = ?
      `,
      [specId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Specification not found",
      });
    }

    res.json({
      success: true,
      message: "Specification deleted successfully",
    });
  } catch (error) {
    console.error("Delete catalogue specification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete specification",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADD IMAGE
|--------------------------------------------------------------------------
*/

const addImage = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      image_title,
      image_path,
      is_primary,
      sort_order,
    } = req.body;

    if (!image_path || !image_path.trim()) {
      return res.status(400).json({
        success: false,
        message: "Image path is required",
      });
    }

    const [product] = await pool.query(
      `
        SELECT id
        FROM products
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!product.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PRIMARY IMAGE
    |--------------------------------------------------------------------------
    */

    if (normalizeBoolean(is_primary, 0) === 1) {
      await pool.query(
        `
          UPDATE product_images
          SET is_primary = 0
          WHERE product_id = ?
        `,
        [id]
      );
    }

    const [result] = await pool.query(
      `
        INSERT INTO product_images
        (
          product_id,
          image_title,
          image_path,
          is_primary,
          sort_order,
          status
        )
        VALUES (?, ?, ?, ?, ?, 1)
      `,
      [
        id,
        image_title?.trim() || null,
        image_path.trim(),
        normalizeBoolean(is_primary, 0),
        Number(sort_order || 0),
      ]
    );

    const [image] = await pool.query(
      `
        SELECT *
        FROM product_images
        WHERE id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Product image added successfully",
      data: image[0],
    });
  } catch (error) {
    console.error("Add product image error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product image",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE IMAGE
|--------------------------------------------------------------------------
*/

const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const [result] = await pool.query(
      `
        DELETE FROM product_images
        WHERE id = ?
      `,
      [imageId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Product image not found",
      });
    }

    res.json({
      success: true,
      message: "Product image deleted successfully",
    });
  } catch (error) {
    console.error("Delete product image error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product image",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADD DOCUMENT
|--------------------------------------------------------------------------
*/

const addDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      document_title,
      document_type,
      file_name,
      file_path,
      file_size,
      mime_type,
      sort_order,
    } = req.body;

    if (!document_title || !document_title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Document title is required",
      });
    }

    if (!file_name || !file_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "File name is required",
      });
    }

    if (!file_path || !file_path.trim()) {
      return res.status(400).json({
        success: false,
        message: "File path is required",
      });
    }

    const [product] = await pool.query(
      `
        SELECT id
        FROM products
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!product.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const [result] = await pool.query(
      `
        INSERT INTO product_documents
        (
          product_id,
          document_title,
          document_type,
          file_name,
          file_path,
          file_size,
          mime_type,
          sort_order,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        id,
        document_title.trim(),
        document_type?.trim() || null,
        file_name.trim(),
        file_path.trim(),
        file_size ? Number(file_size) : null,
        mime_type?.trim() || null,
        Number(sort_order || 0),
      ]
    );

    const [document] = await pool.query(
      `
        SELECT *
        FROM product_documents
        WHERE id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Product document added successfully",
      data: document[0],
    });
  } catch (error) {
    console.error("Add product document error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product document",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE DOCUMENT
|--------------------------------------------------------------------------
*/

const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const [result] = await pool.query(
      `
        DELETE FROM product_documents
        WHERE id = ?
      `,
      [documentId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Product document not found",
      });
    }

    res.json({
      success: true,
      message: "Product document deleted successfully",
    });
  } catch (error) {
    console.error("Delete product document error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product document",
      error: error.message,
    });
  }
};

module.exports = {
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
};