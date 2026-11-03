import React, { useEffect, useState } from "react";
import API from "../Services/Api";
import "./MyAppoinments.css";

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("appointments/doctor/");
            const data = response.data;

            const appointmentList = Array.isArray(data)
                ? data
                : data.results || [];

            setAppointments(appointmentList);

            setSelectedAppointment((previous) => {
                if (!previous) return null;

                const latest = appointmentList.find(
                    (item) => item.id === previous.id
                );

                return latest
                    ? {
                          ...previous,
                          ...latest,
                          patient_details:
                              previous.patient_details ??
                              latest.patient_details,
                      }
                    : null;
            });
        } catch (err) {
            console.error("Appointment error:", err);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load appointments. Please check your login."
            );
        } finally {
            setLoading(false);
        }
    };

    const openAppointment = async (appointment) => {
        try {
            setDetailsLoading(true);
            setError("");
            setMessage("");
            setSelectedAppointment(appointment);

            const response = await API.get(
                `appointments/doctor/${appointment.id}/`
            );

            setSelectedAppointment((previous) =>
                previous?.id === appointment.id
                    ? { ...appointment, ...response.data }
                    : previous
            );
        } catch (err) {
            console.error("Appointment details error:", err);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load patient details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleAppointmentAction = async (action) => {
        if (!selectedAppointment || actionLoading) return;

        const actionInfo = {
            accept: {
                text: "accept",
                success: "Appointment accepted successfully.",
            },
            reject: {
                text: "reject",
                success: "Appointment rejected successfully.",
            },
            complete: {
                text: "mark as completed",
                success: "Appointment marked as completed successfully.",
            },
        };

        const info = actionInfo[action];
        if (!info) return;

        const confirmed = window.confirm(
            `Are you sure you want to ${info.text} this appointment?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            setError("");
            setMessage("");

            const response = await API.post(
                `appointments/doctor/${selectedAppointment.id}/${action}/`,
                {}
            );

            const updatedStatus = response.data.status;

            setSelectedAppointment((previous) => ({
                ...previous,
                status: updatedStatus,
            }));

            setAppointments((previous) =>
                previous.map((item) =>
                    item.id === selectedAppointment.id
                        ? { ...item, status: updatedStatus }
                        : item
                )
            );

            setMessage(response.data.message || info.success);

            await fetchAppointments();
        } catch (err) {
            console.error("Appointment action error:", err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                `Unable to ${info.text} appointment.`
            );
        } finally {
            setActionLoading(false);
        }
    };

    const total = appointments.length;
    const pending = appointments.filter(
        (item) => item.status === "PENDING"
    ).length;
    const confirmed = appointments.filter(
        (item) => item.status === "CONFIRMED"
    ).length;
    const completed = appointments.filter(
        (item) => item.status === "COMPLETED"
    ).length;

    const patient = selectedAppointment?.patient_details;

    if (loading) {
        return (
            <main className="appointments-page">
                <div className="appointments-loading">
                    <span className="spinner-border" role="status" />
                    <p>Loading your appointments...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="appointments-page">
            <header className="appointments-header">
                <div>
                    <span className="appointments-eyebrow">
                        DOCTOR PORTAL
                    </span>
                    <h1>My Appointments</h1>
                    <p>Manage appointments and review patient information.</p>
                </div>

                <button
                    type="button"
                    className="refresh-btn"
                    onClick={fetchAppointments}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise" />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="appointments-alert error-alert" role="alert">
                    <i className="bi bi-exclamation-circle" />
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {message && (
                <div className="appointments-alert success-alert" role="status">
                    <i className="bi bi-check-circle" />
                    <span>{message}</span>
                    <button
                        type="button"
                        onClick={() => setMessage("")}
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}

            <section className="appointment-stats">
                <StatCard
                    icon="bi-calendar2-week"
                    label="Total Appointments"
                    value={total}
                    tone="teal"
                />
                <StatCard
                    icon="bi-hourglass-split"
                    label="Pending"
                    value={pending}
                    tone="orange"
                />
                <StatCard
                    icon="bi-calendar-check"
                    label="Confirmed"
                    value={confirmed}
                    tone="blue"
                />
                <StatCard
                    icon="bi-check-circle"
                    label="Completed"
                    value={completed}
                    tone="green"
                />
            </section>

            <section className="appointments-content">
                <div className="appointment-list panel-card">
                    <div className="panel-heading">
                        <div>
                            <h2>Appointment List</h2>
                            <p>{total} appointments received</p>
                        </div>
                        <i className="bi bi-people panel-heading-icon" />
                    </div>

                    {appointments.length === 0 ? (
                        <div className="appointment-list-empty">
                            <i className="bi bi-calendar-x" />
                            <h3>No appointments yet</h3>
                            <p>New patient bookings will appear here.</p>
                        </div>
                    ) : (
                        <div className="appointment-list-items">
                            {appointments.map((appointment) => (
                                <button
                                    type="button"
                                    key={appointment.id}
                                    className={`appointment-item ${
                                        selectedAppointment?.id === appointment.id
                                            ? "selected"
                                            : ""
                                    }`}
                                    onClick={() => openAppointment(appointment)}
                                >
                                    <div className="patient-avatar">
                                        {(appointment.patient_name || "P")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div className="appointment-summary">
                                        <h3>
                                            {appointment.patient_name ||
                                                `Patient #${appointment.patient}`}
                                        </h3>
                                        <p>
                                            <i className="bi bi-calendar3" />
                                            {appointment.appointment_date || "Date unavailable"}
                                        </p>
                                        <p>
                                            <i className="bi bi-clock" />
                                            {appointment.appointment_time || "Time unavailable"}
                                        </p>
                                        <span
                                            className={`status status-${(
                                                appointment.status || "pending"
                                            ).toLowerCase()}`}
                                        >
                                            {appointment.status || "PENDING"}
                                        </span>
                                    </div>

                                    <i className="bi bi-chevron-right appointment-chevron" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="appointment-details panel-card">
                    {!selectedAppointment ? (
                        <div className="details-placeholder">
                            <div className="placeholder-icon">
                                <i className="bi bi-person-vcard" />
                            </div>
                            <h2>Patient Details</h2>
                            <p>
                                Select an appointment from the list to view
                                the patient's information.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="details-heading">
                                <div className="patient-avatar large">
                                    {(
                                        patient?.username ||
                                        selectedAppointment.patient_name ||
                                        "P"
                                    ).charAt(0).toUpperCase()}
                                </div>

                                <div className="details-heading-text">
                                    <span className="details-overline">
                                        PATIENT PROFILE
                                    </span>
                                    <h2>
                                        {patient?.username ||
                                            selectedAppointment.patient_name ||
                                            `Patient #${selectedAppointment.patient}`}
                                    </h2>
                                    <p>Patient information and booking details</p>
                                </div>
                            </div>

                            {detailsLoading && (
                                <div className="details-loading">
                                    <span className="spinner-border spinner-border-sm" />
                                    Loading patient details...
                                </div>
                            )}

                            <DetailGroup title="Personal Information" icon="bi-person">
                                <Detail label="Username" value={patient?.username} />
                                <Detail label="Email" value={patient?.email} />
                                <Detail label="Phone" value={patient?.phone_number} />
                                <Detail label="Date of Birth" value={patient?.date_of_birth} />
                                <Detail label="Gender" value={patient?.gender} />
                                <Detail label="Blood Group" value={patient?.blood_group} />
                                <Detail label="Address" value={patient?.address} />
                            </DetailGroup>

                            <DetailGroup title="Emergency Contact" icon="bi-telephone">
                                <Detail
                                    label="Contact Name"
                                    value={patient?.emergency_contact_name}
                                />
                                <Detail
                                    label="Contact Number"
                                    value={patient?.emergency_contact_number}
                                />
                            </DetailGroup>

                            <DetailGroup title="Appointment Information" icon="bi-calendar2-check">
                                <Detail label="Appointment ID" value={selectedAppointment.id} />
                                <Detail label="Date" value={selectedAppointment.appointment_date} />
                                <Detail label="Time" value={selectedAppointment.appointment_time} />
                                <Detail label="Priority" value={selectedAppointment.priority} />
                                <Detail label="Reason" value={selectedAppointment.reason} />
                                <Detail label="Status" value={selectedAppointment.status} />
                            </DetailGroup>

                            {selectedAppointment.status === "PENDING" && (
                                <div className="appointment-action-buttons">
                                    <button
                                        type="button"
                                        className="accept-btn"
                                        disabled={actionLoading || detailsLoading}
                                        onClick={() => handleAppointmentAction("accept")}
                                    >
                                        <i className="bi bi-check-lg" />
                                        {actionLoading ? "Please wait..." : "Accept Appointment"}
                                    </button>

                                    <button
                                        type="button"
                                        className="reject-btn"
                                        disabled={actionLoading || detailsLoading}
                                        onClick={() => handleAppointmentAction("reject")}
                                    >
                                        <i className="bi bi-x-lg" />
                                        {actionLoading ? "Please wait..." : "Reject Appointment"}
                                    </button>
                                </div>
                            )}

                            {selectedAppointment.status === "CONFIRMED" && (
                                <div className="appointment-action-buttons">
                                    <button
                                        type="button"
                                        className="complete-btn"
                                        disabled={actionLoading || detailsLoading}
                                        onClick={() => handleAppointmentAction("complete")}
                                    >
                                        <i className="bi bi-check2-circle" />
                                        {actionLoading ? "Please wait..." : "Complete Appointment"}
                                    </button>
                                </div>
                            )}

                            {selectedAppointment.status === "COMPLETED" && (
                                <p className="action-result accepted">
                                    <i className="bi bi-check-circle-fill" />
                                    Appointment completed successfully.
                                </p>
                            )}

                            {selectedAppointment.status === "CANCELLED" && (
                                <p className="action-result rejected">
                                    <i className="bi bi-x-circle-fill" />
                                    Appointment rejected or cancelled.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </section>
        </main>
    );
};

const StatCard = ({ icon, label, value, tone }) => (
    <article className="stat-card">
        <div className={`stat-icon ${tone}`}>
            <i className={`bi ${icon}`} />
        </div>
        <div className="stat-info">
            <span>{label}</span>
            <h2>{value}</h2>
        </div>
    </article>
);

const DetailGroup = ({ title, icon, children }) => (
    <section className="detail-group">
        <h3>
            <span><i className={`bi ${icon}`} /></span>
            {title}
        </h3>
        <div className="detail-grid">{children}</div>
    </section>
);

const Detail = ({ label, value }) => (
    <div className="detail-row">
        <span>{label}</span>
        <strong>
            {value === null || value === undefined || value === ""
                ? "Not provided"
                : value}
        </strong>
    </div>
);

export default MyAppointments;