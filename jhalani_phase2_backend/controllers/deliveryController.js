const { pool } = require("../db");

/* ============================================================
   GET ALL DELIVERIES
============================================================ */

exports.getDeliveries = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        da.id,
        da.dispatch_id,
        da.order_id,
        da.party_id,
        da.delivery_person_id,

        da.delivery_address,
        da.contact_person,
        da.contact_number,

        da.vehicle_number,

        da.assigned_date,
        da.expected_delivery_date,

        da.status,

        da.started_at,
        da.delivered_at,

        da.delivery_remarks,

        da.created_at,
        da.updated_at,

        d.dispatch_no,
        d.dispatch_date,

        o.order_no,
        o.po_number,

        p.party_code,
        p.name AS party_name,
        p.mobile AS party_mobile,

        e.employee_code AS delivery_person_code,
        e.name AS delivery_person_name,
        e.mobile AS delivery_person_mobile

      FROM delivery_assignments da

      LEFT JOIN dispatches d
        ON d.id = da.dispatch_id

      LEFT JOIN orders o
        ON o.id = da.order_id

      LEFT JOIN parties p
        ON p.id = da.party_id

      LEFT JOIN employees e
        ON e.id = da.delivery_person_id

      ORDER BY da.id DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get deliveries error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch deliveries",
      error: error.message,
    });
  }
};


/* ============================================================
   GET READY FOR DELIVERY
============================================================ */

exports.getReadyDeliveries = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        da.id,
        da.dispatch_id,
        da.order_id,
        da.party_id,
        da.delivery_person_id,

        da.delivery_address,
        da.contact_person,
        da.contact_number,

        da.vehicle_number,

        da.assigned_date,
        da.expected_delivery_date,

        da.status,

        d.dispatch_no,
        d.dispatch_date,

        o.order_no,
        o.po_number,

        p.party_code,
        p.name AS party_name,
        p.mobile AS party_mobile,

        e.employee_code AS delivery_person_code,
        e.name AS delivery_person_name,
        e.mobile AS delivery_person_mobile

      FROM delivery_assignments da

      LEFT JOIN dispatches d
        ON d.id = da.dispatch_id

      LEFT JOIN orders o
        ON o.id = da.order_id

      LEFT JOIN parties p
        ON p.id = da.party_id

      LEFT JOIN employees e
        ON e.id = da.delivery_person_id

      WHERE da.status = 'READY_FOR_DELIVERY'

      ORDER BY da.id DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get ready deliveries error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch ready deliveries",
      error: error.message,
    });
  }
};


/* ============================================================
   GET SINGLE DELIVERY
============================================================ */

exports.getDeliveryById = async (req, res) => {
  const { id } = req.params;

  try {
    const [deliveryRows] = await pool.query(
      `
      SELECT
        da.*,

        d.dispatch_no,
        d.dispatch_date,
        d.transporter_name,

        o.order_no,
        o.po_number,
        o.po_date,
        o.order_date,

        p.party_code,
        p.name AS party_name,
        p.mobile AS party_mobile,

        e.employee_code AS delivery_person_code,
        e.name AS delivery_person_name,
        e.mobile AS delivery_person_mobile

      FROM delivery_assignments da

      LEFT JOIN dispatches d
        ON d.id = da.dispatch_id

      LEFT JOIN orders o
        ON o.id = da.order_id

      LEFT JOIN parties p
        ON p.id = da.party_id

      LEFT JOIN employees e
        ON e.id = da.delivery_person_id

      WHERE da.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!deliveryRows.length) {
      return res.status(404).json({
        success: false,
        message: "Delivery assignment not found",
      });
    }

    const delivery = deliveryRows[0];

    /* --------------------------------------------------------
       DELIVERY ITEMS
    -------------------------------------------------------- */

    const [itemRows] = await pool.query(
      `
      SELECT
        di.id,
        di.dispatch_id,
        di.order_item_id,
        di.variant_id,
        di.quantity,
        di.description,

        pv.sku,
        pv.variant_name,
        pv.pack_size,

        pr.product_name,

        oi.ordered_quantity,
        oi.dispatched_quantity,
        oi.pending_quantity,
        oi.rate

      FROM dispatch_items di

      LEFT JOIN product_variants pv
        ON pv.id = di.variant_id

      LEFT JOIN products pr
        ON pr.id = pv.product_id

      LEFT JOIN order_items oi
        ON oi.id = di.order_item_id

      WHERE di.dispatch_id = ?

      ORDER BY di.id ASC
      `,
      [delivery.dispatch_id]
    );

    res.json({
      success: true,
      data: {
        ...delivery,
        items: itemRows,
      },
    });
  } catch (error) {
    console.error("Get delivery error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery",
      error: error.message,
    });
  }
};


/* ============================================================
   ASSIGN DELIVERY
============================================================ */

exports.assignDelivery = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      dispatch_id,
      delivery_person_id,
      expected_delivery_date,
      delivery_address,
      contact_person,
      contact_number,
      vehicle_number,
      delivery_remarks,
    } = req.body;

    /* --------------------------------------------------------
       VALIDATION
    -------------------------------------------------------- */

    if (!dispatch_id) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Dispatch is required",
      });
    }

    if (!delivery_person_id) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Delivery person is required",
      });
    }

    /* --------------------------------------------------------
       GET DISPATCH
    -------------------------------------------------------- */

    const [dispatchRows] = await connection.query(
      `
      SELECT *
      FROM dispatches
      WHERE id = ?
      FOR UPDATE
      `,
      [dispatch_id]
    );

    if (!dispatchRows.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    const dispatch = dispatchRows[0];

    /* --------------------------------------------------------
       VALIDATE DISPATCH STATUS
    -------------------------------------------------------- */

    if (dispatch.status !== "DISPATCHED") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Only dispatched records can be assigned for delivery",
      });
    }

    /* --------------------------------------------------------
       CHECK EXISTING ASSIGNMENT
    -------------------------------------------------------- */

    const [existingRows] = await connection.query(
      `
      SELECT id, status
      FROM delivery_assignments
      WHERE dispatch_id = ?
      LIMIT 1
      `,
      [dispatch_id]
    );

    if (existingRows.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "This dispatch already has a delivery assignment",
        data: existingRows[0],
      });
    }

    /* --------------------------------------------------------
       VALIDATE DELIVERY PERSON
    -------------------------------------------------------- */

    const [employeeRows] = await connection.query(
      `
      SELECT
        id,
        employee_code,
        name,
        mobile,
        status
      FROM employees
      WHERE id = ?
      LIMIT 1
      `,
      [delivery_person_id]
    );

    if (!employeeRows.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    if (Number(employeeRows[0].status) !== 1) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Selected delivery person is inactive",
      });
    }

    /* --------------------------------------------------------
       CREATE ASSIGNMENT
    -------------------------------------------------------- */

    const [result] = await connection.query(
      `
      INSERT INTO delivery_assignments
      (
        dispatch_id,
        order_id,
        party_id,
        delivery_person_id,

        delivery_address,
        contact_person,
        contact_number,

        vehicle_number,

        assigned_date,
        expected_delivery_date,

        status,

        delivery_remarks,
        created_by
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, 'READY_FOR_DELIVERY', ?, ?)
      `,
      [
        dispatch.id,
        dispatch.order_id,
        dispatch.party_id,
        delivery_person_id,

        delivery_address ||
          dispatch.delivery_address ||
          null,

        contact_person || null,
        contact_number || null,

        vehicle_number ||
          dispatch.vehicle_number ||
          null,

        expected_delivery_date || null,

        delivery_remarks || null,

        req.user?.id || null,
      ]
    );

    const assignmentId = result.insertId;

    /* --------------------------------------------------------
       INITIAL TRACKING
    -------------------------------------------------------- */

    await connection.query(
      `
      INSERT INTO delivery_tracking
      (
        delivery_assignment_id,
        status,
        location_address,
        remarks,
        created_by
      )
      VALUES (?, 'READY_FOR_DELIVERY', ?, ?, ?)
      `,
      [
        assignmentId,
        delivery_address ||
          dispatch.delivery_address ||
          null,
        "Delivery assignment created",
        req.user?.id || null,
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Delivery assigned successfully",
      data: {
        id: assignmentId,
        dispatch_id: dispatch.id,
        order_id: dispatch.order_id,
        status: "READY_FOR_DELIVERY",
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Assign delivery error:", error);

    res.status(400).json({
      success: false,
      message:
        error.message || "Failed to assign delivery",
    });
  } finally {
    connection.release();
  }
};


/* ============================================================
   UPDATE DELIVERY STATUS
============================================================ */

exports.updateDeliveryStatus = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, remarks } = req.body;

    const allowedStatuses = [
      "READY_FOR_DELIVERY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid delivery status",
      });
    }

    /* --------------------------------------------------------
       GET ASSIGNMENT
    -------------------------------------------------------- */

    const [rows] = await connection.query(
      `
      SELECT *
      FROM delivery_assignments
      WHERE id = ?
      FOR UPDATE
      `,
      [id]
    );

    if (!rows.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Delivery assignment not found",
      });
    }

    const delivery = rows[0];

    /* --------------------------------------------------------
       STATUS TRANSITION VALIDATION
    -------------------------------------------------------- */

    const currentStatus = delivery.status;

    const validTransition =
      (currentStatus === "READY_FOR_DELIVERY" &&
        status === "OUT_FOR_DELIVERY") ||
      (currentStatus === "OUT_FOR_DELIVERY" &&
        status === "DELIVERED") ||
      status === "CANCELLED" ||
      currentStatus === status;

    if (!validTransition) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Invalid delivery status transition: ${currentStatus} → ${status}`,
      });
    }

    /* --------------------------------------------------------
       DELIVERED REQUIRES OTP
    -------------------------------------------------------- */

    if (status === "DELIVERED") {
      const [otpRows] = await connection.query(
        `
        SELECT id, is_verified
        FROM delivery_otp
        WHERE delivery_assignment_id = ?
        LIMIT 1
        `,
        [id]
      );

      if (
        !otpRows.length ||
        Number(otpRows[0].is_verified) !== 1
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Delivery cannot be completed until OTP is verified",
        });
      }
    }

    /* --------------------------------------------------------
       TIMESTAMPS
    -------------------------------------------------------- */

    let startedAt = delivery.started_at;
    let deliveredAt = delivery.delivered_at;

    if (
      status === "OUT_FOR_DELIVERY" &&
      !startedAt
    ) {
      startedAt = new Date();
    }

    if (status === "DELIVERED") {
      deliveredAt = new Date();
    }

    /* --------------------------------------------------------
       UPDATE ASSIGNMENT
    -------------------------------------------------------- */

    await connection.query(
      `
      UPDATE delivery_assignments
      SET
        status = ?,
        started_at = ?,
        delivered_at = ?,
        delivery_remarks = COALESCE(?, delivery_remarks)
      WHERE id = ?
      `,
      [
        status,
        startedAt,
        deliveredAt,
        remarks || null,
        id,
      ]
    );

    /* --------------------------------------------------------
       TRACK STATUS
    -------------------------------------------------------- */

    await connection.query(
      `
      INSERT INTO delivery_tracking
      (
        delivery_assignment_id,
        status,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        id,
        status,
        remarks || null,
        req.user?.id || null,
      ]
    );

    /* --------------------------------------------------------
       UPDATE DISPATCH STATUS
    -------------------------------------------------------- */

    if (status === "DELIVERED") {
      await connection.query(
        `
        UPDATE dispatches
        SET status = 'DELIVERED'
        WHERE id = ?
        `,
        [delivery.dispatch_id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message:
        "Delivery status updated successfully",
      data: {
        id: Number(id),
        status,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Update delivery status error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update delivery status",
    });
  } finally {
    connection.release();
  }
};


/* ============================================================
   GENERATE DELIVERY OTP
============================================================ */

exports.generateDeliveryOTP = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    /* --------------------------------------------------------
       GET DELIVERY
    -------------------------------------------------------- */

    const [deliveryRows] = await connection.query(
      `
      SELECT *
      FROM delivery_assignments
      WHERE id = ?
      FOR UPDATE
      `,
      [id]
    );

    if (!deliveryRows.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Delivery assignment not found",
      });
    }

    const delivery = deliveryRows[0];

    if (delivery.status !== "OUT_FOR_DELIVERY") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "OTP can only be generated when delivery is out for delivery",
      });
    }

    /* --------------------------------------------------------
       GENERATE OTP
    -------------------------------------------------------- */

    const otp = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    /* --------------------------------------------------------
       CREATE / UPDATE OTP
    -------------------------------------------------------- */

    const [existingRows] = await connection.query(
      `
      SELECT id
      FROM delivery_otp
      WHERE delivery_assignment_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existingRows.length) {
      await connection.query(
        `
        UPDATE delivery_otp
        SET
          otp_code = ?,
          is_verified = 0,
          generated_at = NOW(),
          verified_at = NULL,
          verification_attempts = 0
        WHERE delivery_assignment_id = ?
        `,
        [otp, id]
      );
    } else {
      await connection.query(
        `
        INSERT INTO delivery_otp
        (
          delivery_assignment_id,
          otp_code,
          is_verified
        )
        VALUES (?, ?, 0)
        `,
        [id, otp]
      );
    }

    await connection.commit();

    /*
      IMPORTANT:
      OTP is intentionally returned only from this
      specific endpoint.
    */

    res.json({
      success: true,
      message: "Delivery OTP generated successfully",
      data: {
        delivery_assignment_id: Number(id),
        otp,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Generate delivery OTP error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate delivery OTP",
    });
  } finally {
    connection.release();
  }
};


/* ============================================================
   VERIFY DELIVERY OTP
============================================================ */

exports.verifyDeliveryOTP = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    /* --------------------------------------------------------
       GET OTP
    -------------------------------------------------------- */

    const [otpRows] = await connection.query(
      `
      SELECT *
      FROM delivery_otp
      WHERE delivery_assignment_id = ?
      FOR UPDATE
      `,
      [id]
    );

    if (!otpRows.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Delivery OTP not found",
      });
    }

    const otpRecord = otpRows[0];

    if (Number(otpRecord.is_verified) === 1) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "OTP has already been verified",
      });
    }

    /* --------------------------------------------------------
       LIMIT ATTEMPTS
    -------------------------------------------------------- */

    if (
      Number(otpRecord.verification_attempts) >= 5
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Maximum OTP verification attempts exceeded",
      });
    }

    /* --------------------------------------------------------
       WRONG OTP
    -------------------------------------------------------- */

    if (
      String(otp).trim() !==
      String(otpRecord.otp_code).trim()
    ) {
      await connection.query(
        `
        UPDATE delivery_otp
        SET verification_attempts =
          verification_attempts + 1
        WHERE id = ?
        `,
        [otpRecord.id]
      );

      await connection.commit();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    /* --------------------------------------------------------
       VERIFY
    -------------------------------------------------------- */

    await connection.query(
      `
      UPDATE delivery_otp
      SET
        is_verified = 1,
        verified_at = NOW()
      WHERE id = ?
      `,
      [otpRecord.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "OTP verified successfully",
      data: {
        delivery_assignment_id: Number(id),
        verified: true,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Verify delivery OTP error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to verify delivery OTP",
    });
  } finally {
    connection.release();
  }
};


/* ============================================================
   GET DELIVERY TRACKING
============================================================ */

exports.getDeliveryTracking = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT
        dt.id,
        dt.delivery_assignment_id,
        dt.status,

        dt.latitude,
        dt.longitude,

        dt.location_address,
        dt.remarks,

        dt.tracked_at,

        e.name AS created_by_name

      FROM delivery_tracking dt

      LEFT JOIN employees e
        ON e.id = dt.created_by

      WHERE dt.delivery_assignment_id = ?

      ORDER BY dt.id ASC
      `,
      [id]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Get delivery tracking error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery tracking",
      error: error.message,
    });
  }
};


/* ============================================================
   ADD DELIVERY TRACKING
============================================================ */

exports.addDeliveryTracking = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      latitude,
      longitude,
      location_address,
      remarks,
    } = req.body;

    const allowedStatuses = [
      "READY_FOR_DELIVERY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tracking status",
      });
    }

    const [deliveryRows] = await pool.query(
      `
      SELECT id
      FROM delivery_assignments
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!deliveryRows.length) {
      return res.status(404).json({
        success: false,
        message: "Delivery assignment not found",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO delivery_tracking
      (
        delivery_assignment_id,
        status,
        latitude,
        longitude,
        location_address,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        status,
        latitude ?? null,
        longitude ?? null,
        location_address || null,
        remarks || null,
        req.user?.id || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Delivery tracking added successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error(
      "Add delivery tracking error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to add delivery tracking",
    });
  }
};