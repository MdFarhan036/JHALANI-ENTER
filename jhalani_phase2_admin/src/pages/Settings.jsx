
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Settings.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_SETTINGS = {
  company_name: "",
  company_address: "",
  company_mobile: "",
  company_email: "",
  company_gst_no: "",

  financial_year: "2026-2027",
  currency: "INR",
  decimal_places: "2",

  order_prefix: "ORD-",
  order_next_number: "1",

  dispatch_prefix: "DSP-",
  dispatch_next_number: "1",

  purchase_prefix: "PUR-",
  purchase_next_number: "1",

  purchase_return_prefix: "PR-",
  purchase_return_next_number: "1",

  sales_return_prefix: "SR-",
  sales_return_next_number: "1",

  receipt_prefix: "REC-",
  receipt_next_number: "1",

  date_format: "DD-MM-YYYY",

  default_order_status: "DRAFT",
  default_purchase_status: "DRAFT",
  default_dispatch_status: "DRAFT",
};

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("company");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* ============================================================
     LOAD SETTINGS
     ============================================================ */

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_BASE_URL}/settings`, {
        withCredentials: true,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to load settings"
        );
      }

      const rows = response.data.data || [];

      const mapped = { ...DEFAULT_SETTINGS };

      rows.forEach((row) => {
        mapped[row.setting_key] =
          row.setting_value ?? "";
      });

      setSettings(mapped);
    } catch (err) {
      console.error("Settings load error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load settings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /* ============================================================
     HANDLE CHANGE
     ============================================================ */

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    setMessage("");
    setError("");
  };

  /* ============================================================
     SAVE SETTINGS
     ============================================================ */

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        settings: Object.entries(settings).map(
          ([setting_key, setting_value]) => ({
            setting_key,
            setting_value,
          })
        ),
      };

      const response = await axios.put(
        `${API_BASE_URL}/settings`,
        payload,
        {
          withCredentials: true,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to save settings"
        );
      }

      setMessage("Settings saved successfully.");

      await loadSettings();
    } catch (err) {
      console.error("Settings save error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     PREVIEW DOCUMENT NUMBER
     ============================================================ */

  const previews = useMemo(
    () => ({
      order: `${settings.order_prefix}${String(
        settings.order_next_number || "1"
      ).padStart(5, "0")}`,

      dispatch: `${settings.dispatch_prefix}${String(
        settings.dispatch_next_number || "1"
      ).padStart(5, "0")}`,

      purchase: `${settings.purchase_prefix}${String(
        settings.purchase_next_number || "1"
      ).padStart(5, "0")}`,

      purchaseReturn: `${settings.purchase_return_prefix}${String(
        settings.purchase_return_next_number || "1"
      ).padStart(5, "0")}`,

      salesReturn: `${settings.sales_return_prefix}${String(
        settings.sales_return_next_number || "1"
      ).padStart(5, "0")}`,

      receipt: `${settings.receipt_prefix}${String(
        settings.receipt_next_number || "1"
      ).padStart(5, "0")}`,
    }),
    [settings]
  );

  /* ============================================================
     SECTIONS
     ============================================================ */

  const sections = [
    {
      id: "company",
      label: "Company Information",
      icon: "🏢",
    },
    {
      id: "financial",
      label: "Financial Settings",
      icon: "💰",
    },
    {
      id: "numbering",
      label: "Document Numbering",
      icon: "🔢",
    },
    {
      id: "general",
      label: "General Settings",
      icon: "⚙️",
    },
  ];

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="settings-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">

      {/* ========================================================
          HEADER
          ======================================================== */}

      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>
            Manage company information, financial preferences,
            document numbering and system configuration.
          </p>
        </div>

        <button
          type="button"
          className="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* ========================================================
          ALERTS
          ======================================================== */}

      {message && (
        <div className="settings-alert settings-alert-success">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && (
        <div className="settings-alert settings-alert-error">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="settings-layout">

        {/* ======================================================
            SIDEBAR
            ====================================================== */}

        <aside className="settings-sidebar">
          <div className="settings-sidebar-title">
            Configuration
          </div>

          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`settings-nav-item ${
                activeSection === section.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveSection(section.id)
              }
            >
              <span className="settings-nav-icon">
                {section.icon}
              </span>

              <span>{section.label}</span>
            </button>
          ))}
        </aside>

        {/* ======================================================
            CONTENT
            ====================================================== */}

        <main className="settings-content">

          {/* ====================================================
              COMPANY
              ==================================================== */}

          {activeSection === "company" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Company Information</h2>
                  <p>
                    Basic information used throughout the
                    Jhalani Enterprises system.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">

                <div className="settings-field settings-field-full">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) =>
                      handleChange(
                        "company_name",
                        e.target.value
                      )
                    }
                    placeholder="Jhalani Enterprises"
                  />
                </div>

                <div className="settings-field settings-field-full">
                  <label>Company Address</label>
                  <textarea
                    rows="3"
                    value={settings.company_address}
                    onChange={(e) =>
                      handleChange(
                        "company_address",
                        e.target.value
                      )
                    }
                    placeholder="Enter company address"
                  />
                </div>

                <div className="settings-field">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    value={settings.company_mobile}
                    onChange={(e) =>
                      handleChange(
                        "company_mobile",
                        e.target.value
                      )
                    }
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="settings-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) =>
                      handleChange(
                        "company_email",
                        e.target.value
                      )
                    }
                    placeholder="company@example.com"
                  />
                </div>

                <div className="settings-field">
                  <label>GST Number</label>
                  <input
                    type="text"
                    value={settings.company_gst_no}
                    onChange={(e) =>
                      handleChange(
                        "company_gst_no",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Enter GST number"
                  />
                </div>

              </div>
            </section>
          )}

          {/* ====================================================
              FINANCIAL
              ==================================================== */}

          {activeSection === "financial" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Financial Settings</h2>
                  <p>
                    Configure financial year, currency and
                    decimal precision.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">

                <div className="settings-field">
                  <label>Financial Year</label>
                  <input
                    type="text"
                    value={settings.financial_year}
                    onChange={(e) =>
                      handleChange(
                        "financial_year",
                        e.target.value
                      )
                    }
                    placeholder="2026-2027"
                  />
                </div>

                <div className="settings-field">
                  <label>Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) =>
                      handleChange(
                        "currency",
                        e.target.value
                      )
                    }
                  >
                    <option value="INR">
                      INR - Indian Rupee
                    </option>
                    <option value="USD">
                      USD - US Dollar
                    </option>
                    <option value="EUR">
                      EUR - Euro
                    </option>
                    <option value="GBP">
                      GBP - Pound
                    </option>
                  </select>
                </div>

                <div className="settings-field">
                  <label>Decimal Places</label>
                  <select
                    value={settings.decimal_places}
                    onChange={(e) =>
                      handleChange(
                        "decimal_places",
                        e.target.value
                      )
                    }
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>

              </div>
            </section>
          )}

          {/* ====================================================
              NUMBERING
              ==================================================== */}

          {activeSection === "numbering" && (
            <section className="settings-card">

              <div className="settings-card-header">
                <div>
                  <h2>Document Numbering</h2>
                  <p>
                    Configure prefixes and the next number
                    generated for each document.
                  </p>
                </div>
              </div>

              <div className="numbering-table-wrapper">
                <table className="numbering-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Prefix</th>
                      <th>Next Number</th>
                      <th>Preview</th>
                    </tr>
                  </thead>

                  <tbody>

                    <tr>
                      <td>Sales Order</td>
                      <td>
                        <input
                          value={settings.order_prefix}
                          onChange={(e) =>
                            handleChange(
                              "order_prefix",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={
                            settings.order_next_number
                          }
                          onChange={(e) =>
                            handleChange(
                              "order_next_number",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <span className="number-preview">
                          {previews.order}
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td>Dispatch</td>
                      <td>
                        <input
                          value={settings.dispatch_prefix}
                          onChange={(e) =>
                            handleChange(
                              "dispatch_prefix",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={
                            settings.dispatch_next_number
                          }
                          onChange={(e) =>
                            handleChange(
                              "dispatch_next_number",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <span className="number-preview">
                          {previews.dispatch}
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td>Purchase</td>
                      <td>
                        <input
                          value={settings.purchase_prefix}
                          onChange={(e) =>
                            handleChange(
                              "purchase_prefix",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={
                            settings.purchase_next_number
                          }
                          onChange={(e) =>
                            handleChange(
                              "purchase_next_number",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <span className="number-preview">
                          {previews.purchase}
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td>Purchase Return</td>
                      <td>
                        <input
                          value={
                            settings.purchase_return_prefix
                          }
                          onChange={(e) =>
                            handleChange(
                              "purchase_return_prefix",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={
                            settings.purchase_return_next_number
                          }
                          onChange={(e) =>
                            handleChange(
                              "purchase_return_next_number",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <span className="number-preview">
                          {previews.purchaseReturn}
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td>Sales Return</td>
                      <td>
                        <input
                          value={
                            settings.sales_return_prefix
                          }
                          onChange={(e) =>
                            handleChange(
                              "sales_return_prefix",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={
                            settings.sales_return_next_number
                          }
                          onChange={(e) =>
                            handleChange(
                              "sales_return_next_number",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <span className="number-preview">
                          {previews.salesReturn}
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td>Party Receipt</td>
                      <td>
                        <input
                          value={settings.receipt_prefix}
                          onChange={(e) =>
                            handleChange(
                              "receipt_prefix",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={
                            settings.receipt_next_number
                          }
                          onChange={(e) =>
                            handleChange(
                              "receipt_next_number",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <span className="number-preview">
                          {previews.receipt}
                        </span>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </section>
          )}

          {/* ====================================================
              GENERAL
              ==================================================== */}

          {activeSection === "general" && (
            <section className="settings-card">

              <div className="settings-card-header">
                <div>
                  <h2>General Settings</h2>
                  <p>
                    Configure default system behaviour.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">

                <div className="settings-field">
                  <label>Date Format</label>
                  <select
                    value={settings.date_format}
                    onChange={(e) =>
                      handleChange(
                        "date_format",
                        e.target.value
                      )
                    }
                  >
                    <option value="DD-MM-YYYY">
                      DD-MM-YYYY
                    </option>
                    <option value="MM-DD-YYYY">
                      MM-DD-YYYY
                    </option>
                    <option value="YYYY-MM-DD">
                      YYYY-MM-DD
                    </option>
                  </select>
                </div>

                <div className="settings-field">
                  <label>Default Order Status</label>
                  <select
                    value={settings.default_order_status}
                    onChange={(e) =>
                      handleChange(
                        "default_order_status",
                        e.target.value
                      )
                    }
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="CONFIRMED">
                      CONFIRMED
                    </option>
                  </select>
                </div>

                <div className="settings-field">
                  <label>Default Purchase Status</label>
                  <select
                    value={settings.default_purchase_status}
                    onChange={(e) =>
                      handleChange(
                        "default_purchase_status",
                        e.target.value
                      )
                    }
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="CONFIRMED">
                      CONFIRMED
                    </option>
                  </select>
                </div>

                <div className="settings-field">
                  <label>Default Dispatch Status</label>
                  <select
                    value={settings.default_dispatch_status}
                    onChange={(e) =>
                      handleChange(
                        "default_dispatch_status",
                        e.target.value
                      )
                    }
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="READY">READY</option>
                    <option value="DISPATCHED">
                      DISPATCHED
                    </option>
                  </select>
                </div>

              </div>

            </section>
          )}

          {/* ====================================================
              BOTTOM SAVE
              ==================================================== */}

          <div className="settings-bottom-actions">
            <button
              type="button"
              className="settings-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}

export default Settings;
