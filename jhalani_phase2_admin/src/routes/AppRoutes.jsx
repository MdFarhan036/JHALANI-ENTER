import {
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";

import Categories from "../pages/master/Categories";
import Products from "../pages/master/Products";
import ProductVariants from "../pages/master/ProductVariants";
import Units from "../pages/master/Units";

import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../components/layout/AdminLayout";
import Employees from "../pages/employee/Employees";
import Departments from "../pages/master/Departments";
import Designations from "../pages/master/Designations";
import Accounts from "../pages/accounts/Accounts";
import PaymentsExpenses from "../pages/payments/PaymentsExpenses";
import Salary from "../pages/Salary";
import Stock from "../pages/stocks/Stock";
import StockTransactions from "../pages/stocks/StockTransactions";
import StockLedger from "../pages/stocks/StockLedger";
import StockAlerts from "../pages/stocks/StockAlerts";
import StockAdjustment from "../pages/stocks/StockAdjustment";
import Purchases from "../pages/Purchases";
import PurchaseReturns from "../pages/PurchaseReturns";
import SalesOrders from "../pages/SalesOrders";
import SalesDispatch from "../pages/SalesDispatch";
import DeliveryDispatchTracking from "../pages/DeliveryDispatchTracking";
import SalesReturn from "../pages/SalesReturn";
import PartyLedger from "../pages/parties/PartyLedger";
import PartyReceipt from "../pages/parties/PartyReceipt";
import PartyPayments from "../pages/parties/PartyPayments";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import Quotations from "../pages/Quotations";
import Transporters from "../pages/Transporters";
import Vehicles from "../pages/Vehicles";
import Users from "../pages/Users";
import PartyManagement from "../pages/parties/PartyManagement";
import DeliveryManagement from "../pages/DeliveryManagement";
import Catalogue from "../pages/catalogue/Catalogue";

export default function AppRoutes() {
    return (
        <Routes>

            {/* =====================================================
          PUBLIC
      ===================================================== */}

            <Route
                path="/login"
                element={<Login />}
            />


            {/* =====================================================
          PROTECTED ADMIN
      ===================================================== */}

            <Route element={<ProtectedRoute />}>

                {/* ===================================================
            ADMIN LAYOUT
        =================================================== */}

                <Route element={<AdminLayout />}>

                    {/* Dashboard */}

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />


                    {/* =================================================
              MASTER
          ================================================= */}

                    <Route
                        path="/categories"
                        element={<Categories />}
                    />

                    <Route
                        path="/products"
                        element={<Products />}
                    />

                    <Route
                        path="/product-variants"
                        element={<ProductVariants />}
                    />
                    <Route
                        path="/stock"
                        element={<Stock />}
                    />
                    <Route
                        path="/stock-transactions"
                        element={<StockTransactions />}
                    />
                    <Route
                        path="/stock-ledger"
                        element={<StockLedger />}
                    />
                    <Route
                        path="/stock-alerts"
                        element={<StockAlerts />}
                    />
                    import StockAdjustment from "./pages/StockAdjustment";

                    <Route
                        path="/stock-adjustment"
                        element={<StockAdjustment />}
                    />
                    <Route
                        path="/purchases"
                        element={<Purchases />}
                    />
                    <Route
                        path="/purchase-returns"
                        element={
                            <PurchaseReturns />
                        }
                    />
                    <Route
                        path="/sales/orders"
                        element={<SalesOrders />}
                    />
                    <Route
                        path="/sales-dispatch"
                        element={<SalesDispatch />}
                    />
                    <Route
                        path="/delivery-dispatch-tracking"
                        element={<DeliveryDispatchTracking />}
                    />
                    <Route
                        path="/sales-returns"
                        element={<SalesReturn />}
                    />
                    <Route
                        path="/purchase-returns"
                        element={
                            <PurchaseReturns />
                        }
                    />
                    <Route
                        path="/party-ledger"
                        element={<PartyLedger />}
                    />
                    <Route
                        path="/party-receipts"
                        element={<PartyReceipt />}
                    />
                    <Route
                        path="/party-payments"
                        element={<PartyPayments />}
                    />
                    <Route
                        path="/reports"
                        element={<Reports />}
                    />
                    <Route
                        path="/units"
                        element={<Units />}
                    />

                    <Route
                        path="/employees"
                        element={<Employees />}
                    />
                    <Route
                        path="/departments"
                        element={<Departments />}
                    />

                    <Route
                        path="/designations"
                        element={<Designations />}
                    />
                    <Route
                        path="/accounts"
                        element={<Accounts />}
                    />
                    <Route
                        path="/payments"
                        element={<PaymentsExpenses />}
                    />
                    <Route
                        path="/salary"
                        element={<Salary />}
                    />
                    <Route
                        path="/parties"
                        element={<PartyManagement />}
                    />
                    <Route
                        path="/transport"
                        element={<Transporters />}
                    />
                    <Route path="/transport">
                        <Route
                            path="vehicles"
                            element={<Vehicles />}
                        />
                    </Route>
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/quotations" element={<Quotations />} />
                    <Route
                        path="/users"
                        element={<Users />}
                    />
                    <Route
                        path="/deliveries"
                        element={<DeliveryManagement />}
                    />
                    <Route
                        path="/catalogue"
                        element={<Catalogue />}
                    />
                </Route>

            </Route>


            {/* =====================================================
          FALLBACK
      ===================================================== */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/dashboard"
                        replace
                    />
                }
            />

        </Routes>
    );
}