const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { testDatabase } = require("./db");

// Routes
const authRoutes = require("./routes/authRoutes");
const partyRoutes = require("./routes/partyRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const userRoutes = require("./routes/userRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const accountRoutes = require("./routes/accountRoutes");
const accountTransactionRoutes = require("./routes/accountTransactionRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const transportRoutes = require("./routes/transportRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const unitRoutes = require("./routes/unitRoutes");
const catalogueRoutes = require("./routes/catalogueRoutes");
const productVariantRoutes =
  require("./routes/productVariantRoutes");
  const departmentRoutes = require("./routes/departmentRoutes");
const designationRoutes = require("./routes/designationRoutes");
const stockRoutes =
  require("./routes/stockRoutes");
  const stockLedgerRoutes = require("./routes/stockLedgerRoutes");
  const stockAlertRoutes = require("./routes/stockAlertRoutes");
  const stockAdjustmentRoutes = require("./routes/stockAdjustmentRoutes");
  const purchaseRoutes = require("./routes/purchaseRoutes");
  const purchaseReturnRoutes = require("./routes/purchaseReturnRoutes");
  const orderRoutes =
  require("./routes/orderRoutes");
  const salesReturnRoutes = require("./routes/salesReturnRoutes");
  const partyLedgerRoutes = require("./routes/partyLedgerRoutes");
  const partyReceiptRoutes =
  require("./routes/partyReceiptRoutes");
  const partyPaymentRoutes =
  require("./routes/partyPaymentRoutes");
  const reportRoutes =
  require("./routes/reportRoutes");
  const systemSettingsRoutes =
  require("./routes/systemSettingsRoutes");
  const quotationRoutes =
  require("./routes/quotationRoutes");
  const notificationRoutes = require("./routes/notificationRoutes");
const app = express();

/* ============================================================
   CORS
   ============================================================ */

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

/* ============================================================
   MIDDLEWARE
   ============================================================ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ============================================================
   HEALTH CHECK
   ============================================================ */

app.get("/api/health", async (req, res) => {
  res.json({
    success: true,
    message: "Jhalani Enterprises API is running",
    database: process.env.DB_NAME,
  });
});
app.use(
  "/api/auth",
  authRoutes
);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/accounts", accountRoutes);
app.use(
  "/api/account-transactions",
  accountTransactionRoutes
);
app.use("/api/salaries", salaryRoutes);
app.use("/api/transporters", transportRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/deliveries", deliveryRoutes);
/* ============================================================
   PARTY MANAGEMENT
   ============================================================ */

app.use("/api/parties", partyRoutes);

/* ============================================================
   ORDER MANAGEMENT
   ============================================================ */

/* ============================================================
   CATEGORY API
   ============================================================ */

app.use("/api/categories", categoryRoutes);


/* ============================================================
   PRODUCT / VARIANT / STOCK API
   ============================================================ */

app.use("/api/products", productRoutes);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
/* ============================================================
   DISPATCH MANAGEMENT
   ============================================================ */

app.use("/api/dispatches", dispatchRoutes);
app.use(
  "/api/units",
  unitRoutes
);
app.use("/api/catalogue", catalogueRoutes);
app.use(
  "/api/product-variants",
  productVariantRoutes
);
app.use(
  "/api/stock",
  stockRoutes
);
app.use("/api/stock-ledger", stockLedgerRoutes);
app.use(
  "/api/stock-alerts",
  stockAlertRoutes
);
app.use(
  "/api/stock-adjustments",
  stockAdjustmentRoutes
);
app.use(
  "/api/purchases",
  purchaseRoutes
);
app.use(
  "/api/purchase-returns",
  purchaseReturnRoutes
);
app.use(
  "/api/orders",
  orderRoutes
);
app.use(
  "/api/sales-returns",
  salesReturnRoutes
);
app.use("/api/party-ledger", partyLedgerRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use(
  "/api/party-receipts",
  partyReceiptRoutes
);
app.use(
  "/api/party-payments",
  partyPaymentRoutes
);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", systemSettingsRoutes);
app.use(
  "/api/quotations",
  quotationRoutes
);
app.use("/api/notifications", notificationRoutes);
/* ============================================================
   404 HANDLER
   ============================================================ */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

/* ============================================================
   ERROR HANDLER
   ============================================================ */

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/* ============================================================
   SERVER
   ============================================================ */

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testDatabase();

    app.listen(PORT, () => {
      console.log("========================================");
      console.log("🚀 Jhalani Enterprises API Started");
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log("========================================");
    });
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error.message);

    process.exit(1);
  }
}

startServer();