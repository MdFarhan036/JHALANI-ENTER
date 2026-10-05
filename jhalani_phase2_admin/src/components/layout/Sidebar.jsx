import { NavLink } from "react-router-dom";
import "../../styles/layout.css";

const menuItems = [
  {
    section: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: "▦",
      },
    ],
  },

  {
    section: "HUMAN RESOURCES",
    items: [
      {
        label: "Employees",
        path: "/employees",
        icon: "♟",
      },
      {
        label: "Departments",
        path: "/departments",
        icon: "▤",
      },
      {
        label: "Designations",
        path: "/designations",
        icon: "▥",
      },
      {
        label: "Users",
        path: "/users",
        icon: "♙",
      },
      {
        label: "Party Management",
        path: "/parties",
      },
      {
        label: "Transport",
        path: "/transport",
        icon: "□",
      },
      {
        label: "Salary",
        path: "/salary",
        icon: "₹",
      },
    ],
  },

  // =====================================================
  // FINANCE
  // =====================================================

  {
    section: "FINANCE",
    items: [
      {
        label: "Accounts",
        path: "/accounts",
        icon: "₹",
      },
      {
        label: "Payments / Expenses",
        path: "/payments",
        icon: "↔",
      },
    ],
  },

  // =====================================================
  // INVENTORY
  // =====================================================

  {
    section: "INVENTORY",
    items: [
      {
        label: "Categories",
        path: "/categories",
        icon: "▦",
      },
      {
        label: "Catalogue",
        path: "/catalogue",
        icon: "▦",
      },
      {
        label: "Products",
        path: "/products",
        icon: "□",
      },
      {
        label: "Product Variants",
        path: "/product-variants",
        icon: "▤",
      },
      {
        label: "Units",
        path: "/units",
        icon: "▥",
      },
    ],
  },

  // =====================================================
  // SALES & ORDERS
  // =====================================================

  {
    section: "SALES & ORDERS",
    items: [
      {
        label: "Orders",
        path: "/sales/orders",
        icon: "▤",
      },
      {
        label: "Stocks",
        path: "/stock",
        icon: "▥",
      },
      {
        label: "Stock Transactions",
        path: "/stock-transactions",
        icon: "▥",
      },
      {
        label: "Stock Ledger",
        path: "/stock-ledger",
        icon: "▥",
      },
      {
        label: "Stock Alerts",
        path: "/stock-alerts",
        icon: "▥",
      },
      {
        label: "Purchases",
        path: "/purchases",
        icon: "🛒",
      },
      {
        label: "Purchase Returns",
        path: "/purchase-returns",
        icon: "↩️",
      },
      {
        label: "Sales Dispatch",
        path: "/sales-dispatch",
        icon: "🚚",
      },
      {
        label: "Delivery Tracking",
        path: "/delivery-dispatch-tracking",
        icon: "🚚",
      },
      {
        label: "Sales Return",
        path: "/sales-returns",
        icon: "🚚",
      },
      {
        label: "Party Ledger",
        path: "/party-ledger",
        icon: "🚚",
      },
      {
        label: "Party Receipts",
        path: "/party-receipts",
        icon: "🚚",
      },
      {
        label: "Party Payments",
        path: "/party-payments",
        icon: "🚚",
      },
      {
        label: "Transport Management",
        path: "/transport",
        icon: "🚚",
      },
      {
        label: "Vehicles",
        path: "/transport/vehicles",
        icon: "🚚",
      },
      {
        label: "Reports",
        path: "/reports",
        icon: "📊",
      },
      {
        label: "Quotations",
        path: "/quotations",
        icon: "📊",
      },
      {
        label: "Settings",
        path: "/settings",
        icon: "⚙️",
      },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="admin-sidebar">

      {/* BRAND */}
      <div className="sidebar-brand">

        <div className="sidebar-logo">
          J
        </div>

        <div className="sidebar-brand-text">
          <h1>Jhalani</h1>
          <span>Enterprises</span>
        </div>

      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-navigation">

        {menuItems.map((section) => (
          <div
            className="sidebar-section"
            key={section.section}
          >

            <div className="sidebar-section-title">
              {section.section}
            </div>

            <div className="sidebar-menu">

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <span className="sidebar-icon">
                    {item.icon}
                  </span>

                  <span className="sidebar-label">
                    {item.label}
                  </span>
                </NavLink>
              ))}

            </div>

          </div>
        ))}

      </nav>

    </aside>
  );
}