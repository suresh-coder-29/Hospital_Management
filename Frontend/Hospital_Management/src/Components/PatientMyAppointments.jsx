
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import API from "../Services/Api";
import "./PatientMyAppointments.css";

const getAppointmentList = (responseData) => {
    if (Array.isArray(responseData)) return responseData;

    if (Array.isArray(responseData?.results)) {
        return responseData.results;
    }

    if (Array.isArray(responseData?.data)) {
        return responseData.data;
    }

    if (Array.isArray(responseData?.appointments)) {
        return responseData.appointments;
    }

    return [];
};

const getStatusClass = (status) => {
    const normalizedStatus = String(status || "UNKNOWN")
        .toUpperCase()
        .trim();

    const statusClasses = {
        COMPLETED: "pma-status-completed",
        CONFIRMED: "pma-status-confirmed",
        PENDING: "pma-status-pending",
        CANCELLED: "pma-status-cancelled",
        RESCHEDULED: "pma-status-rescheduled",
    };

    return statusClasses[normalizedStatus] || "pma-status-unknown";
};

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (value) => {
    if (!value) return "—";

    const time = String(value);
    const match = time.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return time;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) return time;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const PatientMyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const fetchAppointments = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await API.get("appointments/patient/");

            setAppointments(getAppointmentList(response.data));
        } catch (err) {
            console.error(
                "Patient appointments error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to load your appointments. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const getDoctorName = (item) => {
        const doctorName =
            item.doctor_name ||
            item.doctor?.name ||
            item.doctor?.user?.first_name ||
            item.doctor?.user?.username ||
            item.doctor?.username ||
            "";

        return doctorName
            ? /^dr\.?\s/i.test(doctorName)
                ? doctorName
                : `Dr. ${doctorName}`
            : "Doctor not available";
    };

    const getSpecialization = (item) => (
        item.specialization ||
        item.doctor?.specialization ||
        "Specialization not provided"
    );

    const getStatus = (item) => (
        String(item.status || "UNKNOWN").toUpperCase().trim()
    );

    const filteredAppointments = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        return appointments.filter((item) => {
            const status = getStatus(item);

            const matchesStatus =
                statusFilter === "ALL" || status === statusFilter;

            const searchableValues = [
                getDoctorName(item),
                getSpecialization(item),
                item.reason,
                status,
                item.appointment_date,
                item.appointment_time,
                item.priority,
                item.id,
                item.cancellation_reason,
            ];

            const matchesSearch =
                !searchText ||
                searchableValues.some((value) =>
                    String(value ?? "")
                        .toLowerCase()
                        .includes(searchText)
                );

            return matchesStatus && matchesSearch;
        });
    }, [appointments, search, statusFilter]);

    const stats = useMemo(() => ({
        total: appointments.length,

        active: appointments.filter((item) =>
            ["CONFIRMED", "PENDING", "RESCHEDULED"].includes(
                getStatus(item)
            )
        ).length,

        completed: appointments.filter(
            (item) => getStatus(item) === "COMPLETED"
        ).length,

        pending: appointments.filter(
            (item) => getStatus(item) === "PENDING"
        ).length,
    }), [appointments]);

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("ALL");
    };

    return (
        <main className="pma-page container-fluid">
            {/* Page Header */}
            <header className="pma-header d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div className="pma-heading">
                    <span className="pma-eyebrow">
                        PATIENT PORTAL
                    </span>

                    <h2>My Appointments</h2>

                    <p>
                        Manage your bookings and view your appointment
                        details in one place.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn pma-refresh-btn"
                    onClick={() => fetchAppointments(true)}
                    disabled={loading || refreshing}
                >
                    <i
                        className={`bi bi-arrow-clockwise me-2 ${
                            refreshing ? "pma-spin" : ""
                        }`}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </header>

            {/* Error Message */}
            {error && (
                <div
                    className="alert alert-danger pma-error d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2"
                    role="alert"
                >
                    <div>
                        <strong>
                            <i className="bi bi-exclamation-circle me-2" />
                            Unable to load appointments
                        </strong>

                        <p className="mb-0 mt-1">{error}</p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => fetchAppointments()}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Statistics */}
            <section className="row g-3 pma-stats">
                <div className="col-12 col-sm-6 col-xl-3">
                    <article className="pma-stat-card pma-stat-total">
                        <div className="pma-stat-icon">
                            <i className="bi bi-calendar2-week" />
                        </div>

                        <div className="pma-stat-info">
                            <span>Total Appointments</span>
                            <h3>{stats.total}</h3>
                        </div>
                    </article>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <article className="pma-stat-card pma-stat-active">
                        <div className="pma-stat-icon">
                            <i className="bi bi-calendar-check" />
                        </div>

                        <div className="pma-stat-info">
                            <span>Active Appointments</span>
                            <h3>{stats.active}</h3>
                        </div>
                    </article>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <article className="pma-stat-card pma-stat-completed">
                        <div className="pma-stat-icon">
                            <i className="bi bi-check2-circle" />
                        </div>

                        <div className="pma-stat-info">
                            <span>Completed</span>
                            <h3>{stats.completed}</h3>
                        </div>
                    </article>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <article className="pma-stat-card pma-stat-pending">
                        <div className="pma-stat-icon">
                            <i className="bi bi-hourglass-split" />
                        </div>

                        <div className="pma-stat-info">
                            <span>Waiting for Confirmation</span>
                            <h3>{stats.pending}</h3>
                        </div>
                    </article>
                </div>
            </section>

            {/* Appointment History */}
            <section className="pma-content">
                <div className="pma-content-heading d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
                    <div>
                        <h3>Appointment History</h3>
                        <p>
                            View your scheduled and previous appointments.
                        </p>
                    </div>

                    <span className="pma-result-count">
                        {filteredAppointments.length} result
                        {filteredAppointments.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Search and Filter */}
                <div className="pma-toolbar row g-3">
                    <div className="col-12 col-lg-8">
                        <div className="input-group pma-search">
                            <span className="input-group-text">
                                <i className="bi bi-search" />
                            </span>

                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search doctor, reason, date or priority..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                aria-label="Search appointments"
                            />

                            {search && (
                                <button
                                    type="button"
                                    className="btn pma-clear-btn"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                >
                                    <i className="bi bi-x-lg" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-12 col-lg-4">
                        <select
                            className="form-select pma-filter"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            aria-label="Filter appointments by status"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="RESCHEDULED">Rescheduled</option>
                        </select>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="pma-state">
                        <div
                            className="spinner-border pma-spinner"
                            role="status"
                        >
                            <span className="visually-hidden">
                                Loading...
                            </span>
                        </div>

                        <h4>Loading appointments...</h4>
                        <p>Please wait while we fetch your bookings.</p>
                    </div>
                ) : error ? (
                    <div className="pma-state">
                        <i className="bi bi-cloud-slash pma-state-icon" />
                        <h4>Appointments unavailable</h4>
                        <p>Try refreshing to load your appointments.</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="pma-state">
                        <i className="bi bi-calendar-x pma-state-icon" />

                        <h4>
                            {appointments.length === 0
                                ? "No appointments yet"
                                : "No matching appointments"}
                        </h4>

                        <p>
                            {appointments.length === 0
                                ? "Your bookings will appear here after you book an appointment."
                                : "Try changing your search or status filter."}
                        </p>

                        {(search || statusFilter !== "ALL") && (
                            <button
                                type="button"
                                className="btn pma-reset-btn"
                                onClick={clearFilters}
                            >
                                <i className="bi bi-arrow-counterclockwise me-2" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="row g-3 pma-list">
                        {filteredAppointments.map((item) => {
                            const status = getStatus(item);

                            const appointmentId =
                                item.id ?? item.appointment_id ?? "—";

                            const appointmentTime =
                                item.appointment_time ??
                                item.time ??
                                "—";

                            return (
                                <div
                                    className="col-12"
                                    key={appointmentId}
                                >
                                    <article className="pma-card">
                                        {/* Doctor and Status */}
                                        <div className="pma-card-top">
                                            <div className="pma-doctor">
                                                <div className="pma-doctor-avatar">
                                                    <i className="bi bi-person-heart" />
                                                </div>

                                                <div className="pma-doctor-info">
                                                    <span className="pma-id">
                                                        APPOINTMENT #{appointmentId}
                                                    </span>

                                                    <h4>
                                                        {getDoctorName(item)}
                                                    </h4>

                                                    <p>
                                                        <i className="bi bi-heart-pulse me-2" />
                                                        {getSpecialization(item)}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={`pma-status ${getStatusClass(status)}`}
                                            >
                                                <span className="pma-status-dot" />
                                                {status.replace(/_/g, " ")}
                                            </span>
                                        </div>

                                        {/* Appointment Details */}
                                        <div className="row g-3 pma-details">
                                            <div className="col-12 col-sm-6 col-xl-3">
                                                <div className="pma-detail-box">
                                                    <span className="pma-detail-icon">
                                                        <i className="bi bi-calendar3" />
                                                    </span>

                                                    <div>
                                                        <span className="pma-detail-label">
                                                            Appointment Date
                                                        </span>

                                                        <strong>
                                                            {formatDate(item.appointment_date)}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-12 col-sm-6 col-xl-3">
                                                <div className="pma-detail-box">
                                                    <span className="pma-detail-icon">
                                                        <i className="bi bi-clock" />
                                                    </span>

                                                    <div>
                                                        <span className="pma-detail-label">
                                                            Appointment Time
                                                        </span>

                                                        <strong>
                                                            {formatTime(appointmentTime)}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-12 col-sm-6 col-xl-3">
                                                <div className="pma-detail-box">
                                                    <span className="pma-detail-icon">
                                                        <i className="bi bi-flag" />
                                                    </span>

                                                    <div>
                                                        <span className="pma-detail-label">
                                                            Priority
                                                        </span>

                                                        <strong>
                                                            {item.priority || "NORMAL"}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-12 col-sm-6 col-xl-3">
                                                <div className="pma-detail-box">
                                                    <span className="pma-detail-icon">
                                                        <i className="bi bi-calendar-plus" />
                                                    </span>

                                                    <div>
                                                        <span className="pma-detail-label">
                                                            Booked On
                                                        </span>

                                                        <strong>
                                                            {formatDate(
                                                                item.created_at ||
                                                                item.created
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className="pma-reason">
                                            <h5>
                                                <i className="bi bi-chat-left-text me-2" />
                                                Reason for Appointment
                                            </h5>

                                            <p>
                                                {item.reason ||
                                                    "No reason provided"}
                                            </p>
                                        </div>

                                        {/* Cancellation Reason */}
                                        {item.cancellation_reason && (
                                            <div className="pma-cancellation">
                                                <strong>
                                                    <i className="bi bi-info-circle me-2" />
                                                    Cancellation Reason
                                                </strong>

                                                <p>
                                                    {item.cancellation_reason}
                                                </p>
                                            </div>
                                        )}
                                    </article>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
};

export default PatientMyAppointments;
