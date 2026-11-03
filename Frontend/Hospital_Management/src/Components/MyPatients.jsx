
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import API from "../Services/Api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./MyPatients.css";

const MyPatients = () => {
    const [appointments, setAppointments] = useState([]);
    const [activeStatus, setActiveStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchPatients = useCallback(async () => {
        try {
            setError("");

            const response = await API.get("appointments/doctor/");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.results || [];

            setAppointments(data);

            setSelectedPatient((previous) => {
                if (!previous) return null;

                return (
                    data.find((item) => item.id === previous.id) || null
                );
            });
        } catch (err) {
            console.error("My Patients API error:", err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Unable to load patients. Please check your login and API."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const counts = useMemo(() => ({
        ALL: appointments.length,
        PENDING: appointments.filter(
            (item) => item.status === "PENDING"
        ).length,
        CONFIRMED: appointments.filter(
            (item) => item.status === "CONFIRMED"
        ).length,
        COMPLETED: appointments.filter(
            (item) => item.status === "COMPLETED"
        ).length,
    }), [appointments]);

    const getPatientName = (item) => {
        const patient = item?.patient_details || {};

        return (
            item?.patient_name ||
            patient.name ||
            patient.patient_name ||
            patient.username ||
            "Patient"
        );
    };

    const getPatientId = (item) => (
        item?.patient_id ||
        item?.patient_details?.id ||
        item?.patient ||
        "N/A"
    );

    const formatDate = (date) => {
        if (!date) return "Not provided";

        const parsedDate = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsedDate.getTime())) return date;

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const filteredPatients = useMemo(() => {
        const searchText = search.toLowerCase().trim();

        return appointments.filter((item) => {
            const matchesStatus =
                activeStatus === "ALL" ||
                item.status === activeStatus;

            const patient = item.patient_details || {};
            const patientName = getPatientName(item);

            const matchesSearch =
                !searchText ||
                String(patientName).toLowerCase().includes(searchText) ||
                String(getPatientId(item)).toLowerCase().includes(searchText) ||
                String(item.id || "").toLowerCase().includes(searchText) ||
                String(item.reason || "").toLowerCase().includes(searchText) ||
                String(patient.email || "").toLowerCase().includes(searchText);

            return matchesStatus && matchesSearch;
        });
    }, [appointments, activeStatus, search]);

    const statusLabel = {
        ALL: "All Patients",
        PENDING: "Pending Patients",
        CONFIRMED: "Confirmed Patients",
        COMPLETED: "Completed Patients",
    };

    const getStatusClass = (status) => (
        `status-${String(status || "unknown").toLowerCase()}`
    );

    if (loading) {
        return (
            <main className="my-patients-page">
                <div className="patients-loading">
                    <div className="spinner-border patients-spinner" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h3>Loading Patients</h3>
                    <p>Please wait while we retrieve your patient list.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="my-patients-page container-fluid">
            {/* Header */}
            <header className="patients-header">
                <div className="patients-header-content">
                    <span className="patients-eyebrow">
                        <i className="bi bi-heart-pulse-fill me-2" />
                        DOCTOR PORTAL
                    </span>

                    <h1>My Patients</h1>

                    <p>
                        Manage your patients and review appointment details.
                    </p>
                </div>

                <button
                    type="button"
                    className="patients-refresh-btn btn"
                    onClick={fetchPatients}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise" />
                    <span>Refresh</span>
                </button>
            </header>

            {/* Error Message */}
            {error && (
                <div
                    className="patients-error alert"
                    role="alert"
                >
                    <i className="bi bi-exclamation-circle-fill" />

                    <span>{error}</span>

                    <button
                        type="button"
                        className="patients-alert-close"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Statistics */}
            <section
                className="patients-stats"
                aria-label="Patient appointment statistics"
            >
                <button
                    type="button"
                    className={`patient-stat-card stat-all ${
                        activeStatus === "ALL" ? "stat-active" : ""
                    }`}
                    onClick={() => setActiveStatus("ALL")}
                >
                    <span className="patient-stat-icon">
                        <i className="bi bi-people-fill" />
                    </span>

                    <span className="patient-stat-label">All Patients</span>

                    <strong>{counts.ALL}</strong>

                    <small>
                        <i className="bi bi-collection me-1" />
                        All appointments
                    </small>
                </button>

                <button
                    type="button"
                    className={`patient-stat-card stat-pending ${
                        activeStatus === "PENDING" ? "stat-active" : ""
                    }`}
                    onClick={() => setActiveStatus("PENDING")}
                >
                    <span className="patient-stat-icon">
                        <i className="bi bi-hourglass-split" />
                    </span>

                    <span className="patient-stat-label">Pending</span>

                    <strong>{counts.PENDING}</strong>

                    <small>
                        <i className="bi bi-clock me-1" />
                        Awaiting approval
                    </small>
                </button>

                <button
                    type="button"
                    className={`patient-stat-card stat-confirmed ${
                        activeStatus === "CONFIRMED" ? "stat-active" : ""
                    }`}
                    onClick={() => setActiveStatus("CONFIRMED")}
                >
                    <span className="patient-stat-icon">
                        <i className="bi bi-calendar-check-fill" />
                    </span>

                    <span className="patient-stat-label">Confirmed</span>

                    <strong>{counts.CONFIRMED}</strong>

                    <small>
                        <i className="bi bi-check-circle me-1" />
                        Accepted appointments
                    </small>
                </button>

                <button
                    type="button"
                    className={`patient-stat-card stat-completed ${
                        activeStatus === "COMPLETED" ? "stat-active" : ""
                    }`}
                    onClick={() => setActiveStatus("COMPLETED")}
                >
                    <span className="patient-stat-icon">
                        <i className="bi bi-clipboard2-check-fill" />
                    </span>

                    <span className="patient-stat-label">Completed</span>

                    <strong>{counts.COMPLETED}</strong>

                    <small>
                        <i className="bi bi-check2-all me-1" />
                        Consultations finished
                    </small>
                </button>
            </section>

            {/* Patient List */}
            <section className="patients-list-section">
                <div className="patients-list-heading">
                    <div className="patients-list-title">
                        <h2>{statusLabel[activeStatus]}</h2>

                        <p>
                            <span className="patients-result-count">
                                {filteredPatients.length}
                            </span>{" "}
                            appointment(s) found
                        </p>
                    </div>

                    <div className="patients-search">
                        <i className="bi bi-search" />

                        <input
                            type="search"
                            aria-label="Search patients"
                            placeholder="Search name, ID, email or reason..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                <i className="bi bi-x-circle-fill" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Filters */}
                <div className="patients-filter-tabs">
                    {["ALL", "PENDING", "CONFIRMED", "COMPLETED"].map(
                        (status) => (
                            <button
                                key={status}
                                type="button"
                                className={`patient-tab ${
                                    activeStatus === status ? "active" : ""
                                }`}
                                onClick={() => setActiveStatus(status)}
                                aria-pressed={activeStatus === status}
                            >
                                <span>
                                    {status === "ALL"
                                        ? "All"
                                        : status.charAt(0) +
                                          status.slice(1).toLowerCase()}
                                </span>

                                <span className="patient-tab-count">
                                    {counts[status]}
                                </span>
                            </button>
                        )
                    )}
                </div>

                {/* Empty State */}
                {filteredPatients.length === 0 ? (
                    <div className="patients-empty">
                        <div className="patients-empty-icon">
                            <i className="bi bi-person-lines-fill" />
                        </div>

                        <h3>No Patients Found</h3>

                        <p>
                            {search
                                ? "No patients match your search. Try a different search term."
                                : `There are no ${activeStatus.toLowerCase()} appointments available.`}
                        </p>

                        {search && (
                            <button
                                type="button"
                                className="patients-clear-btn btn"
                                onClick={() => setSearch("")}
                            >
                                <i className="bi bi-arrow-counterclockwise me-2" />
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="patients-table-wrapper table-responsive">
                        <table className="patients-table table align-middle">
                            <thead>
                                <tr>
                                    <th scope="col">Patient</th>
                                    <th scope="col">Appointment</th>
                                    <th scope="col">Reason</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Details</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPatients.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="patient-table-profile">
                                                <span className="patient-table-avatar">
                                                    {getPatientName(item)
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>

                                                <div className="patient-table-info">
                                                    <strong>
                                                        {getPatientName(item)}
                                                    </strong>

                                                    <small>
                                                        Patient ID: {getPatientId(item)}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="patient-appointment-info">
                                                <strong>
                                                    {formatDate(item.appointment_date)}
                                                </strong>

                                                <small>
                                                    <i className="bi bi-clock me-1" />
                                                    {item.appointment_time || "Time N/A"}
                                                </small>
                                            </div>
                                        </td>

                                        <td className="patient-reason-cell">
                                            {item.reason || "Not provided"}
                                        </td>

                                        <td>
                                            <span
                                                className={`patient-status ${getStatusClass(
                                                    item.status
                                                )}`}
                                            >
                                                <span className="status-dot" />
                                                {item.status || "UNKNOWN"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="patient-view-btn btn"
                                                onClick={() =>
                                                    setSelectedPatient(item)
                                                }
                                            >
                                                <i className="bi bi-eye me-1" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <footer className="patients-list-footer">
                    <i className="bi bi-info-circle me-2" />
                    Showing appointments assigned to your doctor account.
                </footer>
            </section>

            {/* Patient Details Modal */}
            {selectedPatient && (
                <div
                    className="patient-modal-overlay"
                    onClick={() => setSelectedPatient(null)}
                >
                    <section
                        className="patient-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="patient-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="patient-modal-header">
                            <div className="patient-modal-heading">
                                <div className="patient-modal-avatar">
                                    {getPatientName(selectedPatient)
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <span className="patient-modal-eyebrow">
                                        PATIENT INFORMATION
                                    </span>

                                    <h2 id="patient-modal-title">
                                        {getPatientName(selectedPatient)}
                                    </h2>

                                    <p>
                                        Patient ID: {getPatientId(selectedPatient)}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="patient-modal-close"
                                onClick={() => setSelectedPatient(null)}
                                aria-label="Close patient details"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </header>

                        <div className="patient-modal-body">
                            <div className="patient-modal-section-title">
                                <i className="bi bi-calendar2-check" />
                                Appointment Details
                            </div>

                            <div className="patient-modal-grid">
                                <ModalItem
                                    label="Patient ID"
                                    value={getPatientId(selectedPatient)}
                                    icon="bi-person"
                                />

                                <ModalItem
                                    label="Appointment ID"
                                    value={selectedPatient.id}
                                    icon="bi-hash"
                                />

                                <ModalItem
                                    label="Appointment Date"
                                    value={formatDate(
                                        selectedPatient.appointment_date
                                    )}
                                    icon="bi-calendar3"
                                />

                                <ModalItem
                                    label="Appointment Time"
                                    value={selectedPatient.appointment_time}
                                    icon="bi-clock"
                                />

                                <ModalItem
                                    label="Status"
                                    value={selectedPatient.status}
                                    icon="bi-clipboard-check"
                                />

                                <ModalItem
                                    label="Priority"
                                    value={selectedPatient.priority}
                                    icon="bi-exclamation-circle"
                                />

                                <ModalItem
                                    label="Reason for Appointment"
                                    value={selectedPatient.reason}
                                    icon="bi-chat-left-text"
                                    wide
                                />

                                <ModalItem
                                    label="Cancellation Reason"
                                    value={selectedPatient.cancellation_reason}
                                    icon="bi-info-circle"
                                    wide
                                />
                            </div>
                        </div>

                        <footer className="patient-modal-footer">
                            <button
                                type="button"
                                className="patient-modal-done btn"
                                onClick={() => setSelectedPatient(null)}
                            >
                                <i className="bi bi-check2 me-2" />
                                Close Details
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </main>
    );
};

const ModalItem = ({ label, value, icon, wide = false }) => (
    <div
        className={`patient-modal-item ${
            wide ? "patient-modal-wide" : ""
        }`}
    >
        <span className="patient-modal-item-label">
            <i className={`bi ${icon}`} />
            {label}
        </span>

        <strong>
            {value === null || value === undefined || value === ""
                ? "Not provided"
                : value}
        </strong>
    </div>
);

export default MyPatients;
