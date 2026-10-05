import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";

import MasterModal from "../components/common/Modal";

import "../styles/transporters.css";


const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


const EMPTY_FORM = {
    transporter_code: "",
    name: "",
    contact_person: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    gst_no: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment_terms: "",
    status: 1,
    remarks: "",
};


export default function Transporters() {

    const [transporters, setTransporters] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
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
       FETCH TRANSPORTERS
    ============================================================ */

    const fetchTransporters = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/transport`,
                {
                    params: {
                        search,
                        status: statusFilter,
                    },
                    withCredentials: true,
                }
            );

            const result = response.data;

            const data =
                Array.isArray(result?.data)
                    ? result.data
                    : Array.isArray(result?.transporters)
                    ? result.transporters
                    : Array.isArray(result)
                    ? result
                    : [];

            setTransporters(data);

        } catch (err) {

            console.error(
                "Fetch transporters error:",
                err
            );

            setTransporters([]);

            setError(
                err.response?.data?.message ||
                "Failed to load transporters"
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        fetchTransporters();

    }, [search, statusFilter]);


    /* ============================================================
       FILTERED DATA
    ============================================================ */

    const filteredTransporters = useMemo(() => {

        const query =
            search.trim().toLowerCase();

        if (!query) {
            return transporters;
        }

        return transporters.filter(
            (transporter) =>
                String(
                    transporter.transporter_code || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    transporter.name || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    transporter.contact_person || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    transporter.mobile || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    transporter.gst_no || ""
                )
                    .toLowerCase()
                    .includes(query)
        );

    }, [transporters, search]);


    /* ============================================================
       ADD
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
       EDIT
    ============================================================ */

    const openEditModal = async (id) => {

        try {

            setError("");

            const response = await axios.get(
                `${API_URL}/transport/${id}`,
                {
                    withCredentials: true,
                }
            );

            const result = response.data;

            const transporter =
                result?.data ||
                result?.transporter ||
                result;

            if (!transporter) {

                throw new Error(
                    "Transporter details not found"
                );
            }


            setEditingId(id);

            setForm({
                transporter_code:
                    transporter.transporter_code || "",

                name:
                    transporter.name || "",

                contact_person:
                    transporter.contact_person || "",

                mobile:
                    transporter.mobile || "",

                alternate_mobile:
                    transporter.alternate_mobile || "",

                email:
                    transporter.email || "",

                gst_no:
                    transporter.gst_no || "",

                address:
                    transporter.address || "",

                city:
                    transporter.city || "",

                state:
                    transporter.state || "",

                pincode:
                    transporter.pincode || "",

                payment_terms:
                    transporter.payment_terms || "",

                status:
                    transporter.status ?? 1,

                remarks:
                    transporter.remarks || "",
            });

            setModalOpen(true);

        } catch (err) {

            console.error(
                "Get transporter error:",
                err
            );

            alert(
                err.response?.data?.message ||
                err.message ||
                "Failed to load transporter"
            );
        }
    };


    /* ============================================================
       SAVE
    ============================================================ */

    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            setSaving(true);
            setError("");

            const payload = {
                transporter_code:
                    form.transporter_code.trim(),

                name:
                    form.name.trim(),

                contact_person:
                    form.contact_person?.trim() || "",

                mobile:
                    form.mobile?.trim() || "",

                alternate_mobile:
                    form.alternate_mobile?.trim() || "",

                email:
                    form.email?.trim() || "",

                gst_no:
                    form.gst_no?.trim() || "",

                address:
                    form.address?.trim() || "",

                city:
                    form.city?.trim() || "",

                state:
                    form.state?.trim() || "",

                pincode:
                    form.pincode?.trim() || "",

                payment_terms:
                    form.payment_terms?.trim() || "",

                status:
                    Number(form.status) ? 1 : 0,

                remarks:
                    form.remarks?.trim() || "",
            };


            if (!payload.transporter_code) {
                throw new Error(
                    "Transporter code is required"
                );
            }


            if (!payload.name) {
                throw new Error(
                    "Transporter name is required"
                );
            }


            if (editingId) {

                await axios.put(
                    `${API_URL}/transport/${editingId}`,
                    payload,
                    {
                        withCredentials: true,
                    }
                );

                alert(
                    "Transporter updated successfully"
                );

            } else {

                await axios.post(
                    `${API_URL}/transport`,
                    payload,
                    {
                        withCredentials: true,
                    }
                );

                alert(
                    "Transporter added successfully"
                );
            }


            setModalOpen(false);

            setEditingId(null);

            setForm({
                ...EMPTY_FORM,
            });

            await fetchTransporters();

        } catch (err) {

            console.error(
                "Save transporter error:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to save transporter"
            );

        } finally {

            setSaving(false);
        }
    };


    /* ============================================================
       STATUS
    ============================================================ */

    const toggleStatus = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to change this transporter's status?"
            );

        if (!confirmed) {
            return;
        }


        try {

            await axios.patch(
                `${API_URL}/transport/${id}/status`,
                {},
                {
                    withCredentials: true,
                }
            );

            await fetchTransporters();

        } catch (err) {

            console.error(
                "Toggle transporter status error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Failed to change transporter status"
            );
        }
    };


    /* ============================================================
       DELETE
    ============================================================ */

    const deleteTransporter = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this transporter?"
            );

        if (!confirmed) {
            return;
        }


        try {

            await axios.delete(
                `${API_URL}/transport/${id}`,
                {
                    withCredentials: true,
                }
            );

            alert(
                "Transporter deleted successfully"
            );

            await fetchTransporters();

        } catch (err) {

            console.error(
                "Delete transporter error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Failed to delete transporter"
            );
        }
    };


    /* ============================================================
       CLOSE MODAL
    ============================================================ */

    const closeModal = () => {

        if (saving) {
            return;
        }

        setModalOpen(false);

        setEditingId(null);

        setForm({
            ...EMPTY_FORM,
        });

        setError("");
    };


    /* ============================================================
       RENDER
    ============================================================ */

    return (
        <div className="transport-page">

            <div className="transport-header">

                <div>
                    <h1>
                        Transport Management
                    </h1>

                    <p>
                        Manage transporters and
                        transportation partners.
                    </p>
                </div>


                <button
                    type="button"
                    className="transport-primary-btn"
                    onClick={openAddModal}
                >
                    + Add Transporter
                </button>

            </div>


            {error && !modalOpen && (
                <div className="transport-error">
                    {error}
                </div>
            )}


            <div className="transport-filter-card">

                <div className="transport-search">

                    <label>
                        Search Transporter
                    </label>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search by name, code, mobile, GST..."
                    />

                </div>


                <div className="transport-status-filter">

                    <label>
                        Status
                    </label>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="">
                            All Status
                        </option>

                        <option value="1">
                            Active
                        </option>

                        <option value="0">
                            Inactive
                        </option>
                    </select>

                </div>

            </div>


            <div className="transport-table-card">

                <div className="transport-table-wrapper">

                    <table className="transport-table">

                        <thead>
                            <tr>

                                <th>
                                    #
                                </th>

                                <th>
                                    Code
                                </th>

                                <th>
                                    Transporter
                                </th>

                                <th>
                                    Contact Person
                                </th>

                                <th>
                                    Mobile
                                </th>

                                <th>
                                    City
                                </th>

                                <th>
                                    GST No.
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>
                        </thead>


                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan="9"
                                        className="transport-empty"
                                    >
                                        Loading transporters...
                                    </td>
                                </tr>

                            ) : filteredTransporters.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="9"
                                        className="transport-empty"
                                    >
                                        No transporters found.
                                    </td>
                                </tr>

                            ) : (

                                filteredTransporters.map(
                                    (transporter, index) => (

                                        <tr
                                            key={
                                                transporter.id
                                            }
                                        >

                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        transporter.transporter_code ||
                                                        "-"
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        transporter.name ||
                                                        "-"
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    transporter.contact_person ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    transporter.mobile ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    transporter.city ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    transporter.gst_no ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className={
                                                        transporter.status
                                                            ? "transport-status active"
                                                            : "transport-status inactive"
                                                    }
                                                    onClick={() =>
                                                        toggleStatus(
                                                            transporter.id
                                                        )
                                                    }
                                                >
                                                    {transporter.status
                                                        ? "Active"
                                                        : "Inactive"}
                                                </button>

                                            </td>


                                            <td>

                                                <div className="transport-actions">

                                                    <button
                                                        type="button"
                                                        className="transport-action edit"
                                                        onClick={() =>
                                                            openEditModal(
                                                                transporter.id
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="transport-action delete"
                                                        onClick={() =>
                                                            deleteTransporter(
                                                                transporter.id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            <MasterModal
                open={modalOpen}
                title={
                    editingId
                        ? "Edit Transporter"
                        : "Add New Transporter"
                }
                subtitle={
                    editingId
                        ? "Update transporter information."
                        : "Enter transporter information below."
                }
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                onClose={closeModal}
                loading={saving}
                error={error}
                type="transporter"
            />

        </div>
    );
}