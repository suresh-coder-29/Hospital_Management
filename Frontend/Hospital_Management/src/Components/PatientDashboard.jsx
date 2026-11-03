
import React, { useEffect, useMemo, useState } from "react";
import API from "../Services/Api";
import "./PatientDashboard.css";

const getAppointmentList = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.results)) return responseData.results;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.appointments)) {
        return responseData.appointments;
    }
    return [];
};

const PatientDashboard = ({ setPage }) => {
    const [username, setUsername] = useState(
        localStorage.getItem("username") || ""
    );

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            // Load logged-in user details
            try {
                const userResponse = await API.get("accounts/me/");
                const user =
                    userResponse.data?.user || userResponse.data;

                const name =
                    user?.username ||
                    user?.name ||
                    user?.first_name;

                if (name) {
                    setUsername(name);
                    localStorage.setItem("username", name);
                }
            } catch (userError) {
                console.info("Using username saved during login.");
            }

            // Load patient appointments
            const response = await API.get("appointments/patient/");
            setAppointments(getAppointmentList(response.data));
        } catch (err) {
            console.error(
                "Dashboard error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to load dashboard information."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    // Calculate appointment statistics
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = appointments
            .filter((item) => {
                if (!item.appointment_date) return false;

                const date = new Date(
                    `${item.appointment_date}T00:00:00`
                );

                return (
                    !Number.isNaN(date.getTime()) &&
                    date >= today &&
                    [
                        "PENDING",
                        "CONFIRMED",
                        "RESCHEDULED",
                    ].includes(
                        String(item.status || "").toUpperCase()
                    )
                );
            })
            .sort((a, b) => {
                const first =
                    `${a.appointment_date || ""}T${a.appointment_time || ""}`;

                const second =
                    `${b.appointment_date || ""}T${b.appointment_time || ""}`;

                return first.localeCompare(second);
            });

        return {
            total: appointments.length,
            upcoming: upcoming.length,
            completed: appointments.filter(
                (item) =>
                    String(item.status || "").toUpperCase() ===
                    "COMPLETED"
            ).length,
            pending: appointments.filter(
                (item) =>
                    String(item.status || "").toUpperCase() ===
                    "PENDING"
            ).length,
            next: upcoming[0] || null,
        };
    }, [appointments]);

    // Navigate to the selected page
    const goTo = (page) => {
        if (typeof setPage !== "function") {
            console.error(
                "PatientDashboard: setPage prop was not provided."
            );
            return;
        }

        setPage(page);
    };

    const formatDate = (value) => {
        if (!value) return "Date not available";

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (value) => {
        if (!value) return "Time not available";

        const [hours, minutes] = value.split(":");
        const date = new Date();

        date.setHours(Number(hours), Number(minutes), 0, 0);

        return date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getDoctorName = (appointment) => {
        return (
            appointment.doctor_name ||
            appointment.doctor?.name ||
            appointment.doctor?.user?.username ||
            appointment.doctor?.username ||
            "Doctor"
        );
    };

    // Quick Actions: page names exactly match Dashboard.jsx
    const quickActions = [
        {
            icon: "bi-search",
            title: "Find Doctors",
            description: "Find your specialist",
            page: "FindDoctors",
        },
        {
            icon: "bi-calendar-plus",
            title: "Book Appointment",
            description: "Schedule a consultation",
            page: "BookAppointment",
        },
        {
            icon: "bi-calendar-check",
            title: "My Appointments",
            description: "Track your bookings",
            page: "PatientAppointments",
        },
        {
            icon: "bi-person-circle",
            title: "My Profile",
            description: "Manage your information",
            page: "PatientProfile",
        },
    ];

    return (
        <main className="patient-dashboard">

            {/* Welcome Banner */}
            <section className="patient-welcome">
                <div className="patient-welcome-content">
                    <span className="patient-eyebrow">
                        PATIENT PORTAL
                    </span>

                    <h1>
                        Welcome back, {username.trim() || "Patient"}!
                    </h1>

                    <p>
                        Manage your appointments and keep track of
                        your healthcare in one place.
                    </p>

                    <button
                        type="button"
                        className="patient-primary-btn"
                        onClick={() => goTo("FindDoctors")}
                    >
                        Find a Doctor
                        <i className="bi bi-arrow-right"></i>
                    </button>
                </div>

                <div
                    className="patient-welcome-icon"
                    aria-hidden="true"
                >
                    <i className="bi bi-hospital"></i>
                </div>
            </section>

            {/* Error Message */}
            {error && (
                <div
                    className="patient-dashboard-error"
                    role="alert"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={loadDashboard}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Try Again
                    </button>
                </div>
            )}

            {/* Statistics */}
            <section className="patient-stats-grid">
                <StatCard
                    icon="bi-calendar-week"
                    label="Total Appointments"
                    value={loading ? "—" : stats.total}
                    accent="teal"
                />

                <StatCard
                    icon="bi-clock-history"
                    label="Upcoming"
                    value={loading ? "—" : stats.upcoming}
                    accent="blue"
                />

                <StatCard
                    icon="bi-check-circle"
                    label="Completed"
                    value={loading ? "—" : stats.completed}
                    accent="green"
                />

                <StatCard
                    icon="bi-hourglass-split"
                    label="Pending"
                    value={loading ? "—" : stats.pending}
                    accent="orange"
                />
            </section>

            {/* Quick Actions */}
            <section className="patient-dashboard-section">
                <div className="patient-section-heading">
                    <div>
                        <span className="patient-section-eyebrow">
                            YOUR HEALTHCARE
                        </span>

                        <h2>Quick Actions</h2>

                        <p>
                            What would you like to do today?
                        </p>
                    </div>
                </div>

                <div className="patient-actions-grid">
                    {quickActions.map((action) => (
                        <button
                            type="button"
                            className="patient-action-card"
                            key={action.page}
                            onClick={() => goTo(action.page)}
                        >
                            <span className="patient-action-icon">
                                <i className={`bi ${action.icon}`}></i>
                            </span>

                            <span className="patient-action-arrow">
                                <i className="bi bi-arrow-up-right"></i>
                            </span>

                            <span className="patient-action-title">
                                {action.title}
                            </span>

                            <span className="patient-action-description">
                                {action.description}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Upcoming Appointment */}
            <section className="patient-dashboard-section">
                <div className="patient-section-heading patient-appointment-heading">
                    <div>
                        <span className="patient-section-eyebrow">
                            APPOINTMENT OVERVIEW
                        </span>

                        <h2>Upcoming Appointment</h2>

                        <p>
                            Your next scheduled consultation
                        </p>
                    </div>

                    <button
                        type="button"
                        className="patient-text-btn"
                        onClick={() => goTo("PatientAppointments")}
                    >
                        View All
                        <i className="bi bi-arrow-right"></i>
                    </button>
                </div>

                {loading ? (
                    <div className="patient-empty-state">
                        <div
                            className="spinner-border patient-spinner"
                            role="status"
                        >
                            <span className="visually-hidden">
                                Loading...
                            </span>
                        </div>

                        <p>Loading appointments...</p>
                    </div>
                ) : stats.next ? (
                    <div className="patient-next-appointment">
                        <div className="patient-appointment-date">
                            <span>
                                {new Date(
                                    `${stats.next.appointment_date}T00:00:00`
                                ).toLocaleDateString("en-IN", {
                                    month: "short",
                                })}
                            </span>

                            <strong>
                                {new Date(
                                    `${stats.next.appointment_date}T00:00:00`
                                ).getDate()}
                            </strong>
                        </div>

                        <div className="patient-appointment-info">
                            <h3>
                                Dr. {getDoctorName(stats.next)}
                            </h3>

                            <p>
                                {stats.next.specialization ||
                                    stats.next.doctor?.specialization ||
                                    "Medical consultation"}
                            </p>

                            <div className="patient-appointment-meta">
                                <span>
                                    <i className="bi bi-calendar3"></i>
                                    {formatDate(
                                        stats.next.appointment_date
                                    )}
                                </span>

                                <span>
                                    <i className="bi bi-clock"></i>
                                    {formatTime(
                                        stats.next.appointment_time
                                    )}
                                </span>
                            </div>
                        </div>

                        <span
                            className={`patient-status patient-status-${String(
                                stats.next.status || "pending"
                            ).toLowerCase()}`}
                        >
                            {stats.next.status || "PENDING"}
                        </span>
                    </div>
                ) : (
                    <div className="patient-empty-state">
                        <div className="patient-empty-icon">
                            <i className="bi bi-calendar2-x"></i>
                        </div>

                        <h3>No upcoming appointments</h3>

                        <p>
                            Book an appointment with a specialist
                            to get started.
                        </p>

                        <button
                            type="button"
                            className="patient-primary-btn patient-empty-btn"
                            onClick={() => goTo("FindDoctors")}
                        >
                            Find Doctors
                            <i className="bi bi-arrow-right"></i>
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
};

const StatCard = ({ icon, label, value, accent }) => (
    <article className={`patient-stat-card stat-${accent}`}>
        <div className="patient-stat-top">
            <span className="patient-stat-icon">
                <i className={`bi ${icon}`}></i>
            </span>
        </div>

        <strong className="patient-stat-value">
            {value}
        </strong>

        <span className="patient-stat-label">
            {label}
        </span>
    </article>
);

export default PatientDashboard;
