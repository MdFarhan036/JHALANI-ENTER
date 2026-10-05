import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../styles/master.css";

import MasterModal from "../components/common/Modal";

import CommonTable from "../components/common/CommonTable";
import TableFilterBar from "../components/common/TableFilterBar";
import TableActions from "../components/common/TableActions";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../api/userService";


const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  mobile: "",
  password: "",
  role: "STAFF",
  status: "1",
};


const ROLE_OPTIONS = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
  },
  {
    value: "ADMIN",
    label: "Admin",
  },
  {
    value: "MANAGER",
    label: "Manager",
  },
  {
    value: "STAFF",
    label: "Staff",
  },
];


export default function Users() {
  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
    });


  /* ============================================================
     LOAD USERS
     ============================================================ */

  useEffect(() => {
    fetchUsers();
  }, []);


  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getUsers();

      const result =
        response.data;

      if (result?.success === false) {
        throw new Error(
          result.message ||
            "Failed to load users"
        );
      }

      const userData =
        Array.isArray(result?.data)
          ? result.data
          : Array.isArray(
              result?.users
            )
          ? result.users
          : Array.isArray(result)
          ? result
          : [];

      setUsers(userData);

    } catch (err) {
      console.error(
        "Fetch users:",
        err
      );

      setUsers([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load users"
      );

    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     FORM CHANGE
     ============================================================ */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* ============================================================
     ADD USER
     ============================================================ */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setModalOpen(true);
  };


  /* ============================================================
     EDIT USER
     ============================================================ */

  const openEditModal = (
    user
  ) => {
    setEditingId(user.id);

    setForm({
      name:
        user.name || "",

      username:
        user.username || "",

      email:
        user.email || "",

      mobile:
        user.mobile || "",

      /*
       * Never populate the existing
       * hashed password.
       *
       * Leave blank so a password
       * is only sent when changed.
       */
      password: "",

      role:
        user.role || "STAFF",

      status: String(
        user.status ?? 1
      ),
    });

    setError("");
    setModalOpen(true);
  };


  /* ============================================================
     CLOSE
     ============================================================ */

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
  };


  /* ============================================================
     SAVE USER
     ============================================================ */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Name is required"
      );
      return;
    }

    if (!form.username.trim()) {
      setError(
        "Username is required"
      );
      return;
    }

    if (!editingId &&
        !form.password.trim()) {
      setError(
        "Password is required"
      );
      return;
    }

    if (!form.role) {
      setError(
        "Role is required"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name:
          form.name.trim(),

        username:
          form.username.trim(),

        email:
          form.email.trim() ||
          null,

        mobile:
          form.mobile.trim() ||
          null,

        role:
          form.role,

        status:
          Number(form.status),
      };

      /*
       * Password:
       *
       * Create:
       * required
       *
       * Edit:
       * only send if user entered
       * a new password.
       */

      if (
        !editingId ||
        form.password.trim()
      ) {
        payload.password =
          form.password;
      }


      let response;

      if (editingId) {
        response =
          await updateUser(
            editingId,
            payload
          );
      } else {
        response =
          await createUser(
            payload
          );
      }

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to save user"
        );
      }

      closeModal();

      await fetchUsers();

    } catch (err) {
      console.error(
        "Save user:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save user"
      );

    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     DELETE USER
     ============================================================ */

  const handleDelete = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this user?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response =
        await deleteUser(id);

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to delete user"
        );
      }

      await fetchUsers();

    } catch (err) {
      console.error(
        "Delete user:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete user"
      );
    }
  };


  /* ============================================================
     FILTER
     ============================================================ */

  const filteredUsers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return users.filter(
        (user) => {

          const matchesSearch =
            !query ||
            user.name
              ?.toLowerCase()
              .includes(query) ||

            user.username
              ?.toLowerCase()
              .includes(query) ||

            user.email
              ?.toLowerCase()
              .includes(query) ||

            user.mobile
              ?.toLowerCase()
              .includes(query);


          const matchesRole =
            !roleFilter ||
            user.role ===
              roleFilter;


          const matchesStatus =
            !statusFilter ||
            String(
              user.status
            ) === statusFilter;


          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          );
        }
      );
    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ]);


  /* ============================================================
     RESET
     ============================================================ */

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
  };


  /* ============================================================
     TABLE COLUMNS
     ============================================================ */

  const columns = [
    {
      key: "id",
      label: "#",
      width: "60px",

      render: (
        value,
        row,
        index
      ) => index + 1,
    },

    {
      key: "name",
      label: "User",

      render: (
        value,
        row
      ) => (
        <div>
          <strong>
            {value || "-"}
          </strong>

          {row.email && (
            <div className="table-subtext">
              {row.email}
            </div>
          )}
        </div>
      ),
    },

    {
      key: "username",
      label: "Username",

      render: (value) =>
        value || "-",
    },

    {
      key: "mobile",
      label: "Mobile",

      render: (value) =>
        value || "-",
    },

    {
      key: "role",
      label: "Role",

      render: (value) => (
        <span className="role-badge">
          {value || "-"}
        </span>
      ),
    },

    {
      key: "status",
      label: "Status",

      render: (value) => {
        const active =
          Number(value) === 1;

        return (
          <span
            className={`status ${
              active
                ? "active"
                : "inactive"
            }`}
          >
            {active
              ? "Active"
              : "Inactive"}
          </span>
        );
      },
    },

    {
      key: "last_login",
      label: "Last Login",

      render: (value) => {
        if (!value) {
          return "-";
        }

        return new Date(
          value
        ).toLocaleString(
          "en-IN"
        );
      },
    },

    {
      key: "actions",
      label: "Actions",
      width: "170px",

      render: (
        value,
        row
      ) => (
        <TableActions
          showView={false}
          showEdit={true}
          showDelete={true}

          onEdit={() =>
            openEditModal(row)
          }

          onDelete={() =>
            handleDelete(row.id)
          }
        />
      ),
    },
  ];


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="master-page">

      {/* HEADER */}

      <div className="master-header">

        <div>
          <h1>
            Users
          </h1>

          <p>
            Manage system users,
            roles and access
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          + Add User
        </button>

      </div>


      {/* ERROR */}

      {error && !modalOpen && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* FILTER BAR */}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users..."

        filters={[
          {
            name: "role",
            label: "Role",
            type: "select",
            placeholder: "All Roles",

            options:
              ROLE_OPTIONS,
          },

          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "All Status",

            options: [
              {
                value: "1",
                label: "Active",
              },

              {
                value: "0",
                label: "Inactive",
              },
            ],
          },
        ]}

        values={{
          role:
            roleFilter,

          status:
            statusFilter,
        }}

        onChange={(values) => {
          setRoleFilter(
            values.role
          );

          setStatusFilter(
            values.status
          );
        }}

        onReset={resetFilters}
      />


      {/* TABLE */}

      <div className="table-card">

        {loading ? (

          <LoadingState
            message="Loading users..."
          />

        ) : filteredUsers.length ===
          0 ? (

          <EmptyState
            title="No users found"

            message={
              search ||
              roleFilter ||
              statusFilter
                ? "Try changing your search or filters."
                : "Create your first user."
            }

            actionLabel={
              search ||
              roleFilter ||
              statusFilter
                ? "Reset Filters"
                : "Add User"
            }

            onAction={
              search ||
              roleFilter ||
              statusFilter
                ? resetFilters
                : openAddModal
            }
          />

        ) : (

          <CommonTable
            columns={columns}
            data={filteredUsers}
            rowKey="id"
          />

        )}

      </div>


      {/* MODAL */}

      <MasterModal
        open={modalOpen}

        title={
          editingId
            ? "Edit User"
            : "Add User"
        }

        subtitle={
          editingId
            ? "Update user account"
            : "Create a new user account"
        }

        type="user"

        form={form}
        setForm={setForm}

        onSubmit={handleSubmit}
        onClose={closeModal}

        loading={saving}
        error={error}
      />

    </div>
  );
}