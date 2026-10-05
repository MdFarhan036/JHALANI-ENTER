const { pool } = require("../db");

/* ============================================================
   HELPERS
   ============================================================ */

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function round3(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}

/* ============================================================
   GENERATE QUOTATION NUMBER
   ============================================================ */

async function generateQuotationNumber(connection) {
  const [settings] = await connection.query(
    `
    SELECT setting_key, setting_value
    FROM system_settings
    WHERE setting_key IN (
      'quotation_prefix',
      'quotation_next_number'
    )
    FOR UPDATE
    `
  );

  let prefix = "QUO-";
  let nextNumber = 1;

  for (const row of settings) {
    if (row.setting_key === "quotation_prefix") {
      prefix = row.setting_value || "QUO-";
    }

    if (row.setting_key === "quotation_next_number") {
      nextNumber = parseInt(row.setting_value, 10) || 1;
    }
  }

  const quotationNo =
    prefix + String(nextNumber).padStart(5, "0");

  await connection.query(
    `
    INSERT INTO system_settings
      (setting_key, setting_value)
    VALUES
      ('quotation_prefix', ?),
      ('quotation_next_number', ?)
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value)
    `,
    [
      prefix,
      String(nextNumber + 1),
    ]
  );

  return quotationNo;
}

/* ============================================================
   CALCULATE ITEMS
   ============================================================ */

function calculateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one quotation item is required");
  }

  let subtotal = 0;
  let taxAmount = 0;
  let totalAmount = 0;

  const calculatedItems = items.map((item, index) => {
    const quantity = toNumber(item.quantity);
    const rate = toNumber(item.rate);
    const taxRate = toNumber(item.tax_rate);

    if (quantity <= 0) {
      throw new Error(
        `Item ${index + 1}: quantity must be greater than 0`
      );
    }

    if (rate < 0) {
      throw new Error(
        `Item ${index + 1}: rate cannot be negative`
      );
    }

    if (taxRate < 0) {
      throw new Error(
        `Item ${index + 1}: tax rate cannot be negative`
      );
    }

    const amount = round2(quantity * rate);

    const itemTax = round2(
      (amount * taxRate) / 100
    );

    const itemTotal = round2(
      amount + itemTax
    );

    subtotal += amount;
    taxAmount += itemTax;
    totalAmount += itemTotal;

    return {
      variant_id:
        item.variant_id === null ||
        item.variant_id === undefined ||
        item.variant_id === ""
          ? null
          : Number(item.variant_id),

      description:
        item.description || null,

      specification:
        item.specification || null,

      quantity: round3(quantity),

      unit_id:
        item.unit_id === null ||
        item.unit_id === undefined ||
        item.unit_id === ""
          ? null
          : Number(item.unit_id),

      rate: round2(rate),

      tax_rate: round2(taxRate),

      tax_amount: itemTax,

      amount: itemTotal,
    };
  });

  return {
    items: calculatedItems,
    subtotal: round2(subtotal),
    taxAmount: round2(taxAmount),
    totalAmount: round2(totalAmount),
  };
}

/* ============================================================
   GET ALL QUOTATIONS
   ============================================================ */

exports.getQuotations = async (req, res) => {
  try {
    const {
      search = "",
      party_id,
      status,
      from_date,
      to_date,
    } = req.query;

    let sql = `
      SELECT
        q.*,
        p.name AS party_name,
        p.party_code
      FROM quotations q
      LEFT JOIN parties p
        ON p.id = q.party_id
      WHERE 1 = 1
    `;

    const params = [];

    if (search.trim()) {
      sql += `
        AND (
          q.quotation_no LIKE ?
          OR p.name LIKE ?
          OR p.party_code LIKE ?
        )
      `;

      const value = `%${search.trim()}%`;

      params.push(value, value, value);
    }

    if (party_id) {
      sql += ` AND q.party_id = ? `;
      params.push(party_id);
    }

    if (status) {
      sql += ` AND q.status = ? `;
      params.push(status);
    }

    if (from_date) {
      sql += ` AND q.quotation_date >= ? `;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND q.quotation_date <= ? `;
      params.push(to_date);
    }

    sql += `
      ORDER BY q.id DESC
    `;

    const [rows] = await pool.query(
      sql,
      params
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "getQuotations error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch quotations",
    });
  }
};

/* ============================================================
   GET SINGLE QUOTATION
   ============================================================ */

exports.getQuotationById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const [quotations] = await pool.query(
      `
      SELECT
        q.*,
        p.name AS party_name,
        p.party_code,
        p.mobile AS party_mobile,
        p.email AS party_email,
        p.billing_address,
        p.delivery_address
      FROM quotations q
      LEFT JOIN parties p
        ON p.id = q.party_id
      WHERE q.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!quotations.length) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    const [items] = await pool.query(
      `
      SELECT
        qi.*,
        pv.sku,
        pv.variant_name,
        pv.pack_size,
        pv.unit_id AS variant_unit_id,
        u.name AS unit_name
      FROM quotation_items qi
      LEFT JOIN product_variants pv
        ON pv.id = qi.variant_id
      LEFT JOIN units u
        ON u.id = qi.unit_id
      WHERE qi.quotation_id = ?
      ORDER BY qi.id ASC
      `,
      [id]
    );

    const [revisions] = await pool.query(
      `
      SELECT
        qr.*,
        u.name AS revised_by_name
      FROM quotation_revisions qr
      LEFT JOIN users u
        ON u.id = qr.revised_by
      WHERE qr.quotation_id = ?
      ORDER BY qr.revision_no DESC
      `,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...quotations[0],
        items,
        revisions,
      },
    });
  } catch (error) {
    console.error(
      "getQuotationById error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch quotation",
    });
  }
};

/* ============================================================
   CREATE QUOTATION
   ============================================================ */

exports.createQuotation = async (
  req,
  res
) => {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      party_id,
      quotation_date,
      valid_until,
      items,
      payment_terms,
      delivery_terms,
      freight_terms,
      notes,
      exclusions,
    } = req.body;

    if (!party_id) {
      throw new Error(
        "Party is required"
      );
    }

    if (!quotation_date) {
      throw new Error(
        "Quotation date is required"
      );
    }

    if (
      valid_until &&
      valid_until < quotation_date
    ) {
      throw new Error(
        "Valid until date cannot be before quotation date"
      );
    }

    /* --------------------------------------------------------
       PARTY
       -------------------------------------------------------- */

    const [parties] =
      await connection.query(
        `
        SELECT id, name, status
        FROM parties
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [party_id]
      );

    if (!parties.length) {
      throw new Error(
        "Selected party does not exist"
      );
    }

    if (!parties[0].status) {
      throw new Error(
        "Selected party is inactive"
      );
    }

    /* --------------------------------------------------------
       ITEMS
       -------------------------------------------------------- */

    const calculated =
      calculateItems(items);

    /* --------------------------------------------------------
       GENERATE NUMBER
       -------------------------------------------------------- */

    const quotationNo =
      await generateQuotationNumber(
        connection
      );

    /* --------------------------------------------------------
       CREATE HEADER
       -------------------------------------------------------- */

    const createdBy =
      req.user?.id ||
      req.user?.user_id ||
      null;

    const [quotationResult] =
      await connection.query(
        `
        INSERT INTO quotations
        (
          quotation_no,
          party_id,
          quotation_date,
          valid_until,
          revision_no,
          status,
          subtotal,
          tax_amount,
          total_amount,
          payment_terms,
          delivery_terms,
          freight_terms,
          notes,
          exclusions,
          created_by
        )
        VALUES
        (?, ?, ?, ?, 1, 'DRAFT',
         ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          quotationNo,
          party_id,
          quotation_date,
          valid_until || null,
          calculated.subtotal,
          calculated.taxAmount,
          calculated.totalAmount,
          payment_terms || null,
          delivery_terms || null,
          freight_terms || null,
          notes || null,
          exclusions || null,
          createdBy,
        ]
      );

    const quotationId =
      quotationResult.insertId;

    /* --------------------------------------------------------
       INSERT ITEMS
       -------------------------------------------------------- */

    for (const item of calculated.items) {
      if (item.variant_id) {
        const [variant] =
          await connection.query(
            `
            SELECT id
            FROM product_variants
            WHERE id = ?
            LIMIT 1
            `,
            [item.variant_id]
          );

        if (!variant.length) {
          throw new Error(
            `Product variant ${item.variant_id} not found`
          );
        }
      }

      if (item.unit_id) {
        const [unit] =
          await connection.query(
            `
            SELECT id
            FROM units
            WHERE id = ?
            LIMIT 1
            `,
            [item.unit_id]
          );

        if (!unit.length) {
          throw new Error(
            `Unit ${item.unit_id} not found`
          );
        }
      }

      await connection.query(
        `
        INSERT INTO quotation_items
        (
          quotation_id,
          variant_id,
          description,
          specification,
          quantity,
          unit_id,
          rate,
          tax_rate,
          tax_amount,
          amount
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          quotationId,
          item.variant_id,
          item.description,
          item.specification,
          item.quantity,
          item.unit_id,
          item.rate,
          item.tax_rate,
          item.tax_amount,
          item.amount,
        ]
      );
    }

    /* --------------------------------------------------------
       CREATE INITIAL REVISION
       -------------------------------------------------------- */

    const [revisionResult] =
      await connection.query(
        `
        INSERT INTO quotation_revisions
        (
          quotation_id,
          revision_no,
          quotation_date,
          valid_until,
          status,
          subtotal,
          tax_amount,
          total_amount,
          payment_terms,
          delivery_terms,
          freight_terms,
          notes,
          exclusions,
          revised_by
        )
        VALUES
        (?, 1, ?, ?, 'DRAFT',
         ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          quotationId,
          quotation_date,
          valid_until || null,
          calculated.subtotal,
          calculated.taxAmount,
          calculated.totalAmount,
          payment_terms || null,
          delivery_terms || null,
          freight_terms || null,
          notes || null,
          exclusions || null,
          createdBy,
        ]
      );

    const revisionId =
      revisionResult.insertId;

    for (const item of calculated.items) {
      await connection.query(
        `
        INSERT INTO quotation_revision_items
        (
          revision_id,
          variant_id,
          description,
          specification,
          quantity,
          unit_id,
          rate,
          tax_rate,
          tax_amount,
          amount
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          revisionId,
          item.variant_id,
          item.description,
          item.specification,
          item.quantity,
          item.unit_id,
          item.rate,
          item.tax_rate,
          item.tax_amount,
          item.amount,
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message:
        "Quotation created successfully",
      data: {
        id: quotationId,
        quotation_no: quotationNo,
        revision_no: 1,
        subtotal: calculated.subtotal,
        tax_amount: calculated.taxAmount,
        total_amount:
          calculated.totalAmount,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "createQuotation error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create quotation",
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   UPDATE DRAFT QUOTATION
   ============================================================ */

exports.updateQuotation = async (
  req,
  res
) => {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const {
      party_id,
      quotation_date,
      valid_until,
      items,
      payment_terms,
      delivery_terms,
      freight_terms,
      notes,
      exclusions,
    } = req.body;

    const [existing] =
      await connection.query(
        `
        SELECT *
        FROM quotations
        WHERE id = ?
        FOR UPDATE
        `,
        [id]
      );

    if (!existing.length) {
      throw new Error(
        "Quotation not found"
      );
    }

    if (
      !["DRAFT"].includes(
        existing[0].status
      )
    ) {
      throw new Error(
        "Only draft quotations can be edited"
      );
    }

    if (
      valid_until &&
      quotation_date &&
      valid_until < quotation_date
    ) {
      throw new Error(
        "Valid until date cannot be before quotation date"
      );
    }

    const calculated =
      calculateItems(items);

    const finalPartyId =
      party_id || existing[0].party_id;

    await connection.query(
      `
      UPDATE quotations
      SET
        party_id = ?,
        quotation_date = ?,
        valid_until = ?,
        subtotal = ?,
        tax_amount = ?,
        total_amount = ?,
        payment_terms = ?,
        delivery_terms = ?,
        freight_terms = ?,
        notes = ?,
        exclusions = ?
      WHERE id = ?
      `,
      [
        finalPartyId,
        quotation_date ||
          existing[0].quotation_date,
        valid_until || null,
        calculated.subtotal,
        calculated.taxAmount,
        calculated.totalAmount,
        payment_terms || null,
        delivery_terms || null,
        freight_terms || null,
        notes || null,
        exclusions || null,
        id,
      ]
    );

    await connection.query(
      `
      DELETE FROM quotation_items
      WHERE quotation_id = ?
      `,
      [id]
    );

    for (const item of calculated.items) {
      await connection.query(
        `
        INSERT INTO quotation_items
        (
          quotation_id,
          variant_id,
          description,
          specification,
          quantity,
          unit_id,
          rate,
          tax_rate,
          tax_amount,
          amount
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          item.variant_id,
          item.description,
          item.specification,
          item.quantity,
          item.unit_id,
          item.rate,
          item.tax_rate,
          item.tax_amount,
          item.amount,
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message:
        "Quotation updated successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "updateQuotation error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update quotation",
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   UPDATE STATUS
   ============================================================ */

exports.updateQuotationStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "DRAFT",
      "SENT",
      "VIEWED",
      "ACCEPTED",
      "REJECTED",
      "EXPIRED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation status",
      });
    }

    const [result] =
      await pool.query(
        `
        UPDATE quotations
        SET status = ?
        WHERE id = ?
        `,
        [status, id]
      );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.json({
      success: true,
      message:
        `Quotation marked as ${status}`,
    });
  } catch (error) {
    console.error(
      "updateQuotationStatus error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update quotation status",
    });
  }
};

/* ============================================================
   CREATE REVISION
   ============================================================ */

exports.createRevision = async (
  req,
  res
) => {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const {
      quotation_date,
      valid_until,
      items,
      payment_terms,
      delivery_terms,
      freight_terms,
      notes,
      exclusions,
    } = req.body;

    const [quotationRows] =
      await connection.query(
        `
        SELECT *
        FROM quotations
        WHERE id = ?
        FOR UPDATE
        `,
        [id]
      );

    if (!quotationRows.length) {
      throw new Error(
        "Quotation not found"
      );
    }

    const quotation =
      quotationRows[0];

    const nextRevision =
      Number(quotation.revision_no) + 1;

    const calculated =
      calculateItems(items);

    const revisedBy =
      req.user?.id ||
      req.user?.user_id ||
      null;

    /* --------------------------------------------------------
       SAVE REVISION HEADER
       -------------------------------------------------------- */

    const [revisionResult] =
      await connection.query(
        `
        INSERT INTO quotation_revisions
        (
          quotation_id,
          revision_no,
          quotation_date,
          valid_until,
          status,
          subtotal,
          tax_amount,
          total_amount,
          payment_terms,
          delivery_terms,
          freight_terms,
          notes,
          exclusions,
          revised_by
        )
        VALUES
        (?, ?, ?, ?, 'DRAFT',
         ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          nextRevision,
          quotation_date ||
            quotation.quotation_date,
          valid_until || null,
          calculated.subtotal,
          calculated.taxAmount,
          calculated.totalAmount,
          payment_terms || null,
          delivery_terms || null,
          freight_terms || null,
          notes || null,
          exclusions || null,
          revisedBy,
        ]
      );

    const revisionId =
      revisionResult.insertId;

    /* --------------------------------------------------------
       SAVE REVISION ITEMS
       -------------------------------------------------------- */

    for (const item of calculated.items) {
      await connection.query(
        `
        INSERT INTO quotation_revision_items
        (
          revision_id,
          variant_id,
          description,
          specification,
          quantity,
          unit_id,
          rate,
          tax_rate,
          tax_amount,
          amount
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          revisionId,
          item.variant_id,
          item.description,
          item.specification,
          item.quantity,
          item.unit_id,
          item.rate,
          item.tax_rate,
          item.tax_amount,
          item.amount,
        ]
      );
    }

    /* --------------------------------------------------------
       UPDATE CURRENT QUOTATION
       -------------------------------------------------------- */

    await connection.query(
      `
      UPDATE quotations
      SET
        revision_no = ?,
        quotation_date = ?,
        valid_until = ?,
        status = 'DRAFT',
        subtotal = ?,
        tax_amount = ?,
        total_amount = ?,
        payment_terms = ?,
        delivery_terms = ?,
        freight_terms = ?,
        notes = ?,
        exclusions = ?
      WHERE id = ?
      `,
      [
        nextRevision,
        quotation_date ||
          quotation.quotation_date,
        valid_until || null,
        calculated.subtotal,
        calculated.taxAmount,
        calculated.totalAmount,
        payment_terms || null,
        delivery_terms || null,
        freight_terms || null,
        notes || null,
        exclusions || null,
        id,
      ]
    );

    await connection.query(
      `
      DELETE FROM quotation_items
      WHERE quotation_id = ?
      `,
      [id]
    );

    for (const item of calculated.items) {
      await connection.query(
        `
        INSERT INTO quotation_items
        (
          quotation_id,
          variant_id,
          description,
          specification,
          quantity,
          unit_id,
          rate,
          tax_rate,
          tax_amount,
          amount
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          item.variant_id,
          item.description,
          item.specification,
          item.quantity,
          item.unit_id,
          item.rate,
          item.tax_rate,
          item.tax_amount,
          item.amount,
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message:
        "Quotation revision created successfully",
      data: {
        quotation_id: id,
        revision_id: revisionId,
        revision_no: nextRevision,
        total_amount:
          calculated.totalAmount,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "createRevision error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create quotation revision",
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   GET REVISIONS
   ============================================================ */

exports.getRevisions = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const [rows] =
      await pool.query(
        `
        SELECT
          qr.*,
          u.name AS revised_by_name
        FROM quotation_revisions qr
        LEFT JOIN users u
          ON u.id = qr.revised_by
        WHERE qr.quotation_id = ?
        ORDER BY qr.revision_no DESC
        `,
        [id]
      );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "getRevisions error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch quotation revisions",
    });
  }
};

/* ============================================================
   GET PARTIES
   ============================================================ */

exports.getQuotationParties = async (
  req,
  res
) => {
  try {
    const [rows] =
      await pool.query(
        `
        SELECT
          id,
          party_code,
          name,
          contact_person,
          mobile,
          email,
          gst_no,
          billing_address,
          delivery_address
        FROM parties
        WHERE status = 1
        ORDER BY name ASC
        `
      );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "getQuotationParties error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch parties",
    });
  }
};

/* ============================================================
   GET PRODUCT VARIANTS
   ============================================================ */

exports.getQuotationVariants = async (
  req,
  res
) => {
  try {
    const {
      search = "",
    } = req.query;

    let sql = `
      SELECT
        pv.id,
        pv.product_id,
        pv.sku,
        pv.variant_name,
        pv.pack_size,
        pv.unit_id,
        pv.sale_rate,
        pv.mrp,
        pv.gst_rate,
        pv.current_stock,
        p.name AS product_name,
        u.name AS unit_name
      FROM product_variants pv
      LEFT JOIN products p
        ON p.id = pv.product_id
      LEFT JOIN units u
        ON u.id = pv.unit_id
      WHERE pv.status = 1
    `;

    const params = [];

    if (search.trim()) {
      sql += `
        AND (
          pv.sku LIKE ?
          OR pv.variant_name LIKE ?
          OR p.name LIKE ?
        )
      `;

      const value =
        `%${search.trim()}%`;

      params.push(
        value,
        value,
        value
      );
    }

    sql += `
      ORDER BY p.name ASC, pv.variant_name ASC
    `;

    const [rows] =
      await pool.query(
        sql,
        params
      );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "getQuotationVariants error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch product variants",
    });
  }
};