
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import API from "../Services/Api";
import "./ManageDoctors.css";

const getList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.doctors)) return data.doctors;
    if (Array.isArray(data?.appointments)) return data.appointments;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const STATUS_OPTIONS = [
    "ALL",
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "RESCHEDULED",
];

const ManageDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);

    const [search, setSearch] = useState("");
    const [specializationFilter, setSpecializationFilter] =
        useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [loadingAppointments, setLoadingAppointments] =
        useState(false);

    const [error, setError] = useState("");
    const [appointmentError, setAppointmentError] = useState("");

    const fetchDoctors = useCallback(async () => {
        try {
            setLoadingDoctors(true);
            setError("");

            const response = await API.get(
                "appointments/admin/doctors/"
            );

            const doctorList = getList(response.data);
            setDoctors(doctorList);

            setSelectedDoctor((previous) => {
                if (!previous) return null;

                return (
                    doctorList.find(
                        (doctor) => doctor.id === previous.id
                    ) || null
                );
            });
        } catch (err) {
            console.error("Fetch doctors error:", err);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                `Unable to load doctors. HTTP ${
                    err.response?.status || "Network Error"
                }`
            );
        } finally {
            setLoadingDoctors(false);
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const openDoctor = async (doctor) => {
        setSelectedDoctor(doctor);
        setAppointments([]);
        setAppointmentError("");
        setStatusFilter("ALL");

        try {
            setLoadingAppointments(true);

            const response = await API.get(
                `appointments/admin/doctors/${doctor.id}/appointments/`
            );

            setAppointments(getList(response.data));
        } catch (err) {
            console.error("Fetch appointments error:", err);

            setAppointmentError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                `Unable to load appointments. HTTP ${
                    err.response?.status || "Network Error"
                }`
            );
        } finally {
            setLoadingAppointments(false);
        }
    };

    const specializations = useMemo(
        () =>
            [
                ...new Set(
                    doctors
                        .map((doctor) => doctor.specialization)
                        .filter(Boolean)
                ),
            ].sort(),
        [doctors]
    );

    const filteredDoctors = useMemo(() => {
        const term = search.trim().toLowerCase();

        return doctors.filter((doctor) => {
            const name =
                doctor.name ||
                doctor.doctor_name ||
                doctor.user?.full_name ||
                doctor.user?.username ||
                "";

            const values = [
                name,
                doctor.email,
                doctor.phone_number,
                doctor.phone,
                doctor.specialization,
                doctor.qualification,
                doctor.medical_license_number,
            ];

            const matchesSearch = values.some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(term)
            );

            const matchesSpecialization =
                specializationFilter === "ALL" ||
                doctor.specialization === specializationFilter;

            return matchesSearch && matchesSpecialization;
        });
    }, [doctors, search, specializationFilter]);

    const doctorStats = useMemo(
        () => ({
            total: doctors.length,
            approved: doctors.filter(
                (doctor) => doctor.approval_status === "APPROVED"
            ).length,
            pending: doctors.filter(
                (doctor) => doctor.approval_status === "PENDING"
            ).length,
            rejected: doctors.filter(
                (doctor) => doctor.approval_status === "REJECTED"
            ).length,
        }),
        [doctors]
    );

    const appointmentStats = useMemo(
        () => ({
            total: appointments.length,
            pending: appointments.filter(
                (item) => item.status === "PENDING"
            ).length,
            confirmed: appointments.filter(
                (item) => item.status === "CONFIRMED"
            ).length,
            completed: appointments.filter(
                (item) => item.status === "COMPLETED"
            ).length,
            cancelled: appointments.filter(
                (item) => item.status === "CANCELLED"
            ).length,
            rescheduled: appointments.filter(
                (item) => item.status === "RESCHEDULED"
            ).length,
        }),
        [appointments]
    );

    const filteredAppointments = useMemo(() => {
        if (statusFilter === "ALL") return appointments;

        return appointments.filter(
            (item) => item.status === statusFilter
        );
    }, [appointments, statusFilter]);

    const getDoctorName = (doctor) =>
        doctor?.name ||
        doctor?.doctor_name ||
        doctor?.user?.full_name ||
        doctor?.user?.username ||
        "Doctor";

    const getPatientName = (appointment) =>
        appointment?.patient_name ||
        appointment?.patient?.name ||
        appointment?.patient?.user?.full_name ||
        appointment?.patient?.user?.username ||
        "Patient";

    const getStatusClass = (status) =>
        `md-status md-status-${String(
            status || "unknown"
        ).toLowerCase()}`;

    const formatDate = (date) => {
        if (!date) return "—";

        const parsed = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsed.getTime())) return date;

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (time) => {
        if (!time) return "—";

        const [hours, minutes] = time.split(":");
        const date = new Date();

        date.setHours(Number(hours), Number(minutes), 0, 0);

        return date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <main className="md-page container-fluid">
            {/* Page header */}
            <header className="md-header d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                <div className="md-header-content">
                    <span className="md-eyebrow">
                        <i className="bi bi-shield-check me-2" />
                        ADMIN PANEL
                    </span>

                    <h1>Manage Doctors</h1>

                    <p>
                        Manage doctor profiles and monitor their
                        appointments.
                    </p>
                </div>

                <button
                    type="button"
                    className="md-refresh btn d-inline-flex align-items-center justify-content-center gap-2"
                    onClick={fetchDoctors}
                    disabled={loadingDoctors}
                >
                    <i
                        className={`bi ${
                            loadingDoctors
                                ? "bi-arrow-repeat md-spin"
                                : "bi-arrow-clockwise"
                        }`}
                    />
                    {loadingDoctors ? "Loading..." : "Refresh"}
                </button>
            </header>

            {/* API error */}
            {error && (
                <div className="md-error alert d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                    <div>
                        <strong>Unable to fetch doctors</strong>
                        <p className="mb-0 mt-1">{error}</p>
                    </div>

                    <button
                        type="button"
                        className="btn md-error-button"
                        onClick={fetchDoctors}
                    >
                        <i className="bi bi-arrow-clockwise me-2" />
                        Try Again
                    </button>
                </div>
            )}

            {/* Doctor statistics */}
            <section
                className="md-stats row g-3 mb-4"
                aria-label="Doctor statistics"
            >
                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        label="Total Doctors"
                        value={doctorStats.total}
                        icon="bi-people"
                        variant="total"
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        label="Approved"
                        value={doctorStats.approved}
                        icon="bi-patch-check"
                        variant="approved"
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        label="Pending Approval"
                        value={doctorStats.pending}
                        icon="bi-clock-history"
                        variant="pending"
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        label="Rejected"
                        value={doctorStats.rejected}
                        icon="bi-person-x"
                        variant="rejected"
                    />
                </div>
            </section>

            {/* Doctors directory */}
            <section className="md-panel card border-0">
                <div className="md-panel-heading d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div>
                        <h2>Doctors Directory</h2>
                        <p>
                            Select a doctor to view their profile
                            and appointment history.
                        </p>
                    </div>

                    <span className="md-count">
                        <i className="bi bi-people me-2" />
                        {filteredDoctors.length} doctors
                    </span>
                </div>

                {/* Search and filters */}
                <div className="md-toolbar row g-3">
                    <div className="col-12 col-lg-7">
                        <div className="md-search-box">
                            <i className="bi bi-search" />

                            <input
                                type="search"
                                className="form-control"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search doctor, email, qualification..."
                                aria-label="Search doctors"
                            />

                            {search && (
                                <button
                                    type="button"
                                    className="md-clear-search"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                >
                                    <i className="bi bi-x-lg" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-12 col-lg-5">
                        <select
                            className="form-select md-filter-select"
                            value={specializationFilter}
                            onChange={(event) =>
                                setSpecializationFilter(
                                    event.target.value
                                )
                            }
                            aria-label="Filter by specialization"
                        >
                            <option value="ALL">
                                All Specializations
                            </option>

                            {specializations.map((specialization) => (
                                <option
                                    key={specialization}
                                    value={specialization}
                                >
                                    {specialization}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Doctor cards */}
                {loadingDoctors ? (
                    <div className="md-empty">
                        <div
                            className="spinner-border md-spinner"
                            role="status"
                        >
                            <span className="visually-hidden">
                                Loading...
                            </span>
                        </div>
                        <p>Loading doctors...</p>
                    </div>
                ) : error ? null : filteredDoctors.length === 0 ? (
                    <div className="md-empty">
                        <div className="md-empty-icon">
                            <i className="bi bi-person-exclamation" />
                        </div>
                        <h3>No doctors found</h3>
                        <p>
                            Try another search term or specialization.
                        </p>
                        <button
                            type="button"
                            className="btn md-secondary-button"
                            onClick={() => {
                                setSearch("");
                                setSpecializationFilter("ALL");
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="md-doctor-grid">
                        {filteredDoctors.map((doctor) => (
                            <button
                                type="button"
                                key={doctor.id}
                                className={`md-doctor-card ${
                                    selectedDoctor?.id === doctor.id
                                        ? "md-doctor-selected"
                                        : ""
                                }`}
                                onClick={() => openDoctor(doctor)}
                            >
                                <div className="md-doctor-top">
                                    <div className="md-avatar">
                                        {getDoctorName(doctor)
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <span
                                        className={getStatusClass(
                                            doctor.approval_status
                                        )}
                                    >
                                        {doctor.approval_status ||
                                            "UNKNOWN"}
                                    </span>
                                </div>

                                <h3>
                                    Dr. {getDoctorName(doctor)}
                                </h3>

                                <p className="md-specialization">
                                    <i className="bi bi-heart-pulse me-2" />
                                    {doctor.specialization ||
                                        "Not specified"}
                                </p>

                                <div className="md-doctor-meta">
                                    <span>
                                        <strong>Qualification</strong>
                                        <span>
                                            {doctor.qualification || "—"}
                                        </span>
                                    </span>

                                    <span>
                                        <strong>Experience</strong>
                                        <span>
                                            {doctor.experience_years ?? 0}{" "}
                                            years
                                        </span>
                                    </span>
                                </div>

                                <div className="md-card-footer">
                                    <span>View appointments</span>
                                    <i className="bi bi-arrow-right" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Selected doctor details */}
            {selectedDoctor && (
                <section className="md-panel md-details-panel card border-0">
                    <div className="md-panel-heading md-detail-heading d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                        <div>
                            <span className="md-eyebrow">
                                SELECTED DOCTOR
                            </span>

                            <h2>
                                Dr. {getDoctorName(selectedDoctor)}
                            </h2>

                            <p>
                                {selectedDoctor.specialization ||
                                    "Specialization not specified"}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="md-close btn"
                            onClick={() => {
                                setSelectedDoctor(null);
                                setAppointments([]);
                                setAppointmentError("");
                            }}
                        >
                            <i className="bi bi-x-lg me-2" />
                            Close
                        </button>
                    </div>

                    {/* Profile details */}
                    <div className="md-profile-grid">
                        <ProfileItem
                            icon="bi-envelope"
                            label="Email"
                            value={selectedDoctor.email}
                        />

                        <ProfileItem
                            icon="bi-telephone"
                            label="Phone"
                            value={
                                selectedDoctor.phone_number ||
                                selectedDoctor.phone
                            }
                        />

                        <ProfileItem
                            icon="bi-mortarboard"
                            label="Qualification"
                            value={selectedDoctor.qualification}
                        />

                        <ProfileItem
                            icon="bi-briefcase"
                            label="Experience"
                            value={`${selectedDoctor.experience_years ?? 0} years`}
                        />

                        <ProfileItem
                            icon="bi-card-text"
                            label="Medical License"
                            value={
                                selectedDoctor.medical_license_number
                            }
                        />

                        <ProfileItem
                            icon="bi-currency-rupee"
                            label="Consultation Fee"
                            value={
                                selectedDoctor.consultation_fee != null
                                    ? `₹${selectedDoctor.consultation_fee}`
                                    : "—"
                            }
                        />

                        <ProfileItem
                            icon="bi-patch-check"
                            label="Approval Status"
                            value={selectedDoctor.approval_status}
                        />

                        <ProfileItem
                            icon="bi-geo-alt"
                            label="Address"
                            value={selectedDoctor.address}
                        />
                    </div>

                    {/* Appointment history */}
                    <div className="md-appointment-heading d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                        <div>
                            <h2>Appointment History</h2>
                            <p>
                                Appointments assigned to this doctor.
                            </p>
                        </div>

                        <span className="md-count">
                            {filteredAppointments.length} records
                        </span>
                    </div>

                    {appointmentError && (
                        <div className="md-error alert">
                            <strong>
                                Unable to fetch appointments
                            </strong>
                            <p className="mb-0 mt-1">
                                {appointmentError}
                            </p>
                            <button
                                type="button"
                                className="btn md-error-button mt-3"
                                onClick={() => openDoctor(selectedDoctor)}
                            >
                                <i className="bi bi-arrow-clockwise me-2" />
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Appointment statistics */}
                    <div className="md-appointment-stats row g-3">
                        <div className="col-6 col-md-4 col-xl">
                            <StatCard
                                label="Total"
                                value={appointmentStats.total}
                                variant="total"
                            />
                        </div>

                        <div className="col-6 col-md-4 col-xl">
                            <StatCard
                                label="Pending"
                                value={appointmentStats.pending}
                                variant="pending"
                            />
                        </div>

                        <div className="col-6 col-md-4 col-xl">
                            <StatCard
                                label="Confirmed"
                                value={appointmentStats.confirmed}
                                variant="approved"
                            />
                        </div>

                        <div className="col-6 col-md-4 col-xl">
                            <StatCard
                                label="Completed"
                                value={appointmentStats.completed}
                                variant="completed"
                            />
                        </div>

                        <div className="col-6 col-md-4 col-xl">
                            <StatCard
                                label="Cancelled"
                                value={appointmentStats.cancelled}
                                variant="rejected"
                            />
                        </div>
                    </div>

                    {/* Status filter */}
                    <div className="md-appointment-toolbar row g-3 align-items-center">
                        <div className="col-12 col-md-6">
                            <label
                                className="form-label md-filter-label"
                                htmlFor="appointment-status-filter"
                            >
                                Filter by appointment status
                            </label>

                            <select
                                id="appointment-status-filter"
                                className="form-select md-filter-select"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status === "ALL"
                                            ? "All Appointment Statuses"
                                            : status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loadingAppointments ? (
                        <div className="md-empty">
                            <div
                                className="spinner-border md-spinner"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>
                            <p>Loading appointment history...</p>
                        </div>
                    ) : appointmentError ? null : filteredAppointments.length === 0 ? (
                        <div className="md-empty md-empty-compact">
                            <div className="md-empty-icon">
                                <i className="bi bi-calendar2-x" />
                            </div>
                            <h3>No appointments found</h3>
                            <p>
                                No appointments match the selected status.
                            </p>
                        </div>
                    ) : (
                        <div className="md-table-wrap table-responsive">
                            <table className="md-table table align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Patient</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Priority</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredAppointments.map((item) => (
                                        <tr key={item.id}>
                                            <td className="md-id-cell">
                                                #{item.id}
                                            </td>

                                            <td className="md-patient-cell">
                                                {getPatientName(item)}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    item.appointment_date
                                                )}
                                            </td>

                                            <td>
                                                {formatTime(
                                                    item.appointment_time
                                                )}
                                            </td>

                                            <td>
                                                <span className="md-priority">
                                                    {item.priority || "NORMAL"}
                                                </span>
                                            </td>

                                            <td className="md-reason-cell">
                                                {item.reason || "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={getStatusClass(
                                                        item.status
                                                    )}
                                                >
                                                    {item.status || "UNKNOWN"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
};

const StatCard = ({ label, value, icon, variant = "total" }) => (
    <article className={`md-stat-card md-stat-${variant} h-100`}>
        <div className="md-stat-info">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>

        {icon && (
            <div className="md-stat-icon">
                <i className={`bi ${icon}`} />
            </div>
        )}
    </article>
);

const ProfileItem = ({ label, value, icon }) => (
    <div className="md-profile-item">
        <div className="md-profile-icon">
            <i className={`bi ${icon || "bi-info-circle"}`} />
        </div>

        <div className="md-profile-text">
            <span>{label}</span>
            <strong>{value || "—"}</strong>
        </div>
    </div>
);

export default ManageDoctors;
