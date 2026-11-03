
import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../Services/Api";
import "./DoctorDashboard.css";

const normalizeStatus = (status = "") =>
  String(status).trim().toUpperCase();

const getList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(data?.requests)) return data.requests;

  return [];
};

const getPatientName = (appointment) =>
  appointment.patient_name ||
  appointment.patient_details?.username ||
  appointment.patient_details?.name ||
  appointment.patient?.username ||
  appointment.patient?.name ||
  "Patient";

const getAppointmentDate = (appointment) =>
  appointment.appointment_date ||
  appointment.date ||
  "";

const getAppointmentTime = (appointment) =>
  appointment.appointment_time ||
  appointment.time ||
  "";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}`.slice(0, 10) + "T00:00:00");

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const parts = String(value).split(":");

  if (parts.length < 2) return value;

  const date = new Date();
  date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const isToday = (value) => {
  if (!value) return false;

  const date = String(value).slice(0, 10);
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return date === todayString;
};

const DoctorDashboard = ({ setPage }) => {
  const [appointments, setAppointments] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    setError("");

    try {
      const results = await Promise.allSettled([
        API.get("appointments/doctor/"),
        API.get("appointments/emergency/doctor/"),
      ]);

      const appointmentResult = results[0];
      const emergencyResult = results[1];

      if (appointmentResult.status === "fulfilled") {
        setAppointments(getList(appointmentResult.value));
      } else {
        setError(
          appointmentResult.reason?.response?.data?.detail ||
            "Unable to load appointments. Please try again."
        );
      }

      if (emergencyResult.status === "fulfilled") {
        setEmergencyRequests(getList(emergencyResult.value));
      } else {
        // Emergency endpoint may not be available yet.
        setEmergencyRequests([]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    // Refresh dashboard data every 30 seconds.
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => isToday(getAppointmentDate(appointment)))
      .sort((a, b) => {
        return getAppointmentTime(a).localeCompare(
          getAppointmentTime(b)
        );
      });
  }, [appointments]);

  const stats = useMemo(() => {
    const pending = appointments.filter(
      (item) => normalizeStatus(item.status) === "PENDING"
    ).length;

    const confirmed = appointments.filter(
      (item) => normalizeStatus(item.status) === "CONFIRMED"
    ).length;

    const completed = appointments.filter(
      (item) => normalizeStatus(item.status) === "COMPLETED"
    ).length;

    const cancelled = appointments.filter(
      (item) => normalizeStatus(item.status) === "CANCELLED"
    ).length;

    const pendingEmergency = emergencyRequests.filter((item) => {
      const status = normalizeStatus(item.status);
      return status === "PENDING";
    }).length;

    return {
      total: appointments.length,
      pending,
      confirmed,
      completed,
      cancelled,
      pendingEmergency,
    };
  }, [appointments, emergencyRequests]);

  const goTo = (page) => {
    if (typeof setPage === "function") {
      setPage(page);
    }
  };

  const getStatusClass = (status) => {
    const value = normalizeStatus(status).toLowerCase();
    return `doctor-status doctor-status-${value || "unknown"}`;
  };

  if (loading) {
    return (
      <main className="doctor-dashboard">
        <div className="doctor-loading">
          <div className="doctor-spinner" />
          <p>Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="doctor-dashboard">
      <header className="doctor-dashboard-header">
        <div>
          <p className="doctor-eyebrow">DOCTOR PORTAL</p>
          <h1>Dashboard</h1>
          <p className="doctor-dashboard-subtitle">
            Manage your appointments and patient visits.
          </p>
        </div>

        <button
          className="doctor-refresh-btn"
          onClick={() => loadDashboard()}
          type="button"
        >
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </header>

      {error && (
        <div className="doctor-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => loadDashboard()}>
            Retry
          </button>
        </div>
      )}

      <section className="doctor-welcome-panel">
        <div>
          <p className="doctor-welcome-label">YOUR WORKSPACE</p>
          <h2>Welcome back, Doctor!</h2>
          <p>
            Here is your appointment and patient activity overview.
          </p>
        </div>

        <div className="doctor-welcome-icon" aria-hidden="true">
          ✚
        </div>
      </section>

      <section className="doctor-stats-grid" aria-label="Appointment statistics">
        <article className="doctor-stat-card stat-total">
          <div className="doctor-stat-top">
            <span>Total Appointments</span>
            <span className="doctor-stat-icon">▦</span>
          </div>
          <strong>{stats.total}</strong>
          <p>All appointment statuses</p>
        </article>

        <article className="doctor-stat-card stat-pending">
          <div className="doctor-stat-top">
            <span>Pending</span>
            <span className="doctor-stat-icon">◷</span>
          </div>
          <strong>{stats.pending}</strong>
          <p>Waiting for your action</p>
        </article>

        <article className="doctor-stat-card stat-confirmed">
          <div className="doctor-stat-top">
            <span>Confirmed</span>
            <span className="doctor-stat-icon">✓</span>
          </div>
          <strong>{stats.confirmed}</strong>
          <p>Scheduled appointments</p>
        </article>

        <article className="doctor-stat-card stat-completed">
          <div className="doctor-stat-top">
            <span>Completed</span>
            <span className="doctor-stat-icon">♡</span>
          </div>
          <strong>{stats.completed}</strong>
          <p>Completed appointments</p>
        </article>
      </section>

      <section className="doctor-overview-grid">
        <article className="doctor-panel doctor-appointments-panel">
          <div className="doctor-panel-header">
            <div>
              <h2>Today's Appointments</h2>
              <p>
                {todayAppointments.length} appointment
                {todayAppointments.length === 1 ? "" : "s"} scheduled today
              </p>
            </div>

            <button
              className="doctor-text-btn"
              onClick={() => goTo("Appointments")}
              type="button"
            >
              View all →
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="doctor-empty-state">
              <div className="doctor-empty-icon">▦</div>
              <h3>No appointments today</h3>
              <p>Your appointments scheduled for today will appear here.</p>
              <button
                className="doctor-primary-btn"
                onClick={() => goTo("Appointments")}
                type="button"
              >
                View Appointments
              </button>
            </div>
          ) : (
            <div className="doctor-table-wrapper">
              <table className="doctor-appointments-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.slice(0, 8).map((appointment, index) => (
                    <tr
                      key={
                        appointment.id ||
                        appointment.appointment_id ||
                        index
                      }
                    >
                      <td>
                        <div className="doctor-patient-cell">
                          <div className="doctor-patient-avatar">
                            {getPatientName(appointment)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <strong>{getPatientName(appointment)}</strong>
                            <small>
                              ID:{" "}
                              {appointment.patient_id ||
                                appointment.patient?.id ||
                                "—"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{formatTime(getAppointmentTime(appointment))}</td>
                      <td className="doctor-reason-cell">
                        {appointment.reason ||
                          appointment.description ||
                          "General consultation"}
                      </td>
                      <td>
                        <span className={getStatusClass(appointment.status)}>
                          {appointment.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="doctor-side-panels">
          <article className="doctor-panel doctor-status-panel">
            <div className="doctor-panel-header">
              <div>
                <h2>Appointment Overview</h2>
                <p>Current status breakdown</p>
              </div>
            </div>

            <div className="doctor-progress-list">
              <div className="doctor-progress-item">
                <div className="doctor-progress-label">
                  <span><i className="progress-dot pending-dot" /> Pending</span>
                  <strong>{stats.pending}</strong>
                </div>
                <div className="doctor-progress-track">
                  <div
                    className="doctor-progress-fill pending-fill"
                    style={{
                      width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="doctor-progress-item">
                <div className="doctor-progress-label">
                  <span><i className="progress-dot confirmed-dot" /> Confirmed</span>
                  <strong>{stats.confirmed}</strong>
                </div>
                <div className="doctor-progress-track">
                  <div
                    className="doctor-progress-fill confirmed-fill"
                    style={{
                      width: `${stats.total ? (stats.confirmed / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="doctor-progress-item">
                <div className="doctor-progress-label">
                  <span><i className="progress-dot completed-dot" /> Completed</span>
                  <strong>{stats.completed}</strong>
                </div>
                <div className="doctor-progress-track">
                  <div
                    className="doctor-progress-fill completed-fill"
                    style={{
                      width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="doctor-progress-item">
                <div className="doctor-progress-label">
                  <span><i className="progress-dot cancelled-dot" /> Cancelled</span>
                  <strong>{stats.cancelled}</strong>
                </div>
                <div className="doctor-progress-track">
                  <div
                    className="doctor-progress-fill cancelled-fill"
                    style={{
                      width: `${stats.total ? (stats.cancelled / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </article>

          <article className="doctor-emergency-card">
            <div className="doctor-emergency-icon">✚</div>
            <div className="doctor-emergency-content">
              <h2>Emergency Requests</h2>
              <p>
                {stats.pendingEmergency} pending request
                {stats.pendingEmergency === 1 ? "" : "s"} need attention.
              </p>
            </div>
            <button
              type="button"
              className="doctor-emergency-btn"
              onClick={() => goTo("emergency")}
            >
              View Requests →
            </button>
          </article>

          <article className="doctor-panel doctor-quick-actions">
            <div className="doctor-panel-header">
              <div>
                <h2>Quick Actions</h2>
                <p>Navigate to your workspace</p>
              </div>
            </div>

            <button
              type="button"
              className="doctor-quick-action"
              onClick={() => goTo("Appointments")}
            >
              <span className="quick-action-icon">▦</span>
              <span>
                <strong>Manage Appointments</strong>
                <small>Review and update bookings</small>
              </span>
              <span className="quick-arrow">→</span>
            </button>

            <button
              type="button"
              className="doctor-quick-action"
              onClick={() => goTo("My_patients")}
            >
              <span className="quick-action-icon">♙</span>
              <span>
                <strong>My Patients</strong>
                <small>View your patient list</small>
              </span>
              <span className="quick-arrow">→</span>
            </button>

            <button
              type="button"
              className="doctor-quick-action"
              onClick={() => goTo("Profile")}
            >
              <span className="quick-action-icon">⚙</span>
              <span>
                <strong>My Profile</strong>
                <small>View your professional details</small>
              </span>
              <span className="quick-arrow">→</span>
            </button>
          </article>
        </aside>
      </section>

      <footer className="doctor-dashboard-footer">
        <span>Doctor Portal · Hospital Management System</span>
        <span>
          {lastUpdated
            ? `Last updated at ${lastUpdated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : " "}
        </span>
      </footer>
    </main>
  );
};

export default DoctorDashboard;
