
import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../Services/Api";
import "./AdminDashboard.css";

const getList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.patients)) return data.patients;
  if (Array.isArray(data?.doctors)) return data.doctors;
  if (Array.isArray(data?.appointments)) return data.appointments;

  return [];
};

const getDoctorId = (doctor) =>
  doctor?.id ??
  doctor?.doctor_id ??
  doctor?.profile_id ??
  doctor?.doctor_profile?.id;

const getAppointmentDate = (appointment) =>
  appointment?.appointment_date ??
  appointment?.date ??
  "";

const getAppointmentTime = (appointment) =>
  appointment?.appointment_time ??
  appointment?.time ??
  "";

const getStatus = (appointment) =>
  String(appointment?.status ?? "PENDING").toUpperCase();

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(`${date}`.slice(0, 10) + "T00:00:00");

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatTime = (time) => {
  if (!time) return "—";

  const [hours, minutes] = String(time).split(":");
  const parsed = new Date();
  parsed.setHours(Number(hours), Number(minutes), 0, 0);

  return Number.isNaN(parsed.getTime())
    ? time
    : parsed.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
};

const getDoctorName = (appointment) =>
  appointment?.doctor_name ??
  appointment?.doctor?.name ??
  appointment?.doctor?.user?.first_name ??
  appointment?.doctor?.user?.username ??
  "Doctor";

const getPatientName = (appointment) =>
  appointment?.patient_name ??
  appointment?.patient?.name ??
  appointment?.patient?.user?.first_name ??
  appointment?.patient?.user?.username ??
  "Patient";

const getSpecialization = (appointment) =>
  appointment?.specialization ??
  appointment?.doctor?.specialization ??
  appointment?.doctor_specialization ??
  "General";

const getStatusClass = (status) => {
  const value = status.toLowerCase();

  if (value === "confirmed" || value === "approved") return "success";
  if (value === "completed") return "completed";
  if (value === "cancelled" || value === "rejected") return "danger";
  if (value === "rescheduled") return "info";

  return "pending";
};

const AdminDashboard = ({ setPage }) => {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [doctorResponse, patientResponse] = await Promise.all([
        API.get("appointments/admin/doctors/"),
        API.get("appointments/admin/patients/"),
      ]);

      const doctorList = getList(doctorResponse);
      const patientList = getList(patientResponse);

      setDoctors(doctorList);
      setPatients(patientList);

      // Existing API provides appointments for each doctor.
      const appointmentResponses = await Promise.all(
        doctorList.map(async (doctor) => {
          const doctorId = getDoctorId(doctor);

          if (!doctorId) return [];

          try {
            const response = await API.get(
              `appointments/admin/doctors/${doctorId}/appointments/`
            );

            return getList(response);
          } catch (requestError) {
            console.error(
              `Could not load appointments for doctor ${doctorId}`,
              requestError
            );
            return [];
          }
        })
      );

      const allAppointments = appointmentResponses.flat();

      // Remove duplicates if the API returns overlapping records.
      const uniqueAppointments = Array.from(
        new Map(
          allAppointments.map((appointment, index) => [
            appointment.id ??
              appointment.appointment_id ??
              `${getAppointmentDate(appointment)}-${getAppointmentTime(appointment)}-${index}`,
            appointment,
          ])
        ).values()
      );

      setAppointments(uniqueAppointments);
    } catch (requestError) {
      console.error("Admin dashboard loading failed:", requestError);

      setError(
        requestError?.response?.status === 401
          ? "Your session may have expired. Please log in again."
          : "Unable to load dashboard data. Check your backend APIs."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA");
    const pendingDoctors = doctors.filter((doctor) => {
      const status = String(
        doctor?.approval_status ??
          doctor?.profile?.approval_status ??
          doctor?.doctor_profile?.approval_status ??
          ""
      ).toUpperCase();

      return status === "PENDING";
    }).length;

    const todayAppointments = appointments.filter(
      (appointment) => getAppointmentDate(appointment) === today
    ).length;

    const confirmed = appointments.filter(
      (appointment) => getStatus(appointment) === "CONFIRMED"
    ).length;

    const completed = appointments.filter(
      (appointment) => getStatus(appointment) === "COMPLETED"
    ).length;

    const cancelled = appointments.filter(
      (appointment) => getStatus(appointment) === "CANCELLED"
    ).length;

    const pending = appointments.filter(
      (appointment) => getStatus(appointment) === "PENDING"
    ).length;

    return {
      patients: patients.length,
      doctors: doctors.length,
      pendingDoctors,
      appointments: appointments.length,
      todayAppointments,
      confirmed,
      completed,
      cancelled,
      pending,
    };
  }, [doctors, patients, appointments]);

  const recentAppointments = useMemo(
    () =>
      [...appointments]
        .sort((a, b) => {
          const dateA = `${getAppointmentDate(a)} ${getAppointmentTime(a)}`;
          const dateB = `${getAppointmentDate(b)} ${getAppointmentTime(b)}`;
          return dateB.localeCompare(dateA);
        })
        .slice(0, 7),
    [appointments]
  );

 const navigateTo = (pageName) => {
        console.log("Clicked page:", pageName);
        console.log("setPage type:", typeof setPage);

        if (typeof setPage === "function") {
            setPage(pageName);
        }
    };


  if (loading) {
    return (
      <main className="admin-dashboard">
        <div className="admin-dashboard-loading">
          <span className="dashboard-spinner" />
          <p>Loading hospital dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">HOSPITAL MANAGEMENT</p>
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor your hospital operations and daily activities.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh"
          onClick={loadDashboard}
        >
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </header>

      {error && (
        <div className="dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      )}

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="stat-icon stat-icon-teal">♙</div>
          <div className="stat-content">
            <p>Total Patients</p>
            <h2>{stats.patients}</h2>
            <span>Registered patients</span>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-icon stat-icon-blue">✚</div>
          <div className="stat-content">
            <p>Total Doctors</p>
            <h2>{stats.doctors}</h2>
            <span>Doctor registrations</span>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-icon stat-icon-purple">▦</div>
          <div className="stat-content">
            <p>Total Appointments</p>
            <h2>{stats.appointments}</h2>
            <span>{stats.todayAppointments} scheduled today</span>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="stat-icon stat-icon-orange">◷</div>
          <div className="stat-content">
            <p>Pending Approvals</p>
            <h2>{stats.pendingDoctors}</h2>
            <span>Doctors awaiting review</span>
          </div>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-panel appointment-overview">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Appointment Overview</h2>
              <p>Current appointment status breakdown</p>
            </div>
            <span className="dashboard-panel-icon">▤</span>
          </div>

          <div className="appointment-summary">
            <div className="appointment-total">
              <span>Total appointments</span>
              <strong>{stats.appointments}</strong>
            </div>

            <div className="status-progress-list">
              {[
                {
                  label: "Pending",
                  value: stats.pending,
                  color: "pending-bar",
                },
                {
                  label: "Confirmed",
                  value: stats.confirmed,
                  color: "confirmed-bar",
                },
                {
                  label: "Completed",
                  value: stats.completed,
                  color: "completed-bar",
                },
                {
                  label: "Cancelled",
                  value: stats.cancelled,
                  color: "cancelled-bar",
                },
              ].map((item) => {
                const percentage =
                  stats.appointments > 0
                    ? (item.value / stats.appointments) * 100
                    : 0;

                return (
                  <div className="status-progress-item" key={item.label}>
                    <div className="status-progress-label">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="status-progress-track">
                      <div
                        className={`status-progress-fill ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="dashboard-panel quick-actions-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage hospital activities</p>
            </div>
          </div>

          <div className="dashboard-quick-actions">
            <button
              type="button"
              onClick={() => navigateTo("ManageDoctors")}
            >
              <span className="quick-action-icon">✚</span>
              <span>
                <strong>Manage Doctors</strong>
                <small>Review and approve doctors</small>
              </span>
              <span className="quick-action-arrow">›</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("ManagePatients")}
            >
              <span className="quick-action-icon patient-action">♙</span>
              <span>
                <strong>Manage Patients</strong>
                <small>View registered patients</small>
              </span>
              <span className="quick-action-arrow">›</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("AdminAppointments")}
            >
              <span className="quick-action-icon appointment-action">▦</span>
              <span>
                <strong>Appointments</strong>
                <small>Review appointment records</small>
              </span>
              <span className="quick-action-arrow">›</span>
            </button>
          </div>
        </article>
      </section>

      <section className="dashboard-panel recent-appointments-panel">
        <div className="dashboard-panel-heading recent-heading">
          <div>
            <h2>Recent Appointments</h2>
            <p>Latest appointments across your hospital</p>
          </div>

          <button
            type="button"
            className="dashboard-text-button"
            onClick={() => navigateTo("Appointments")}
          >
            View all <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentAppointments.length > 0 ? (
                recentAppointments.map((appointment, index) => {
                  const status = getStatus(appointment);

                  return (
                    <tr
                      key={
                        appointment.id ??
                        appointment.appointment_id ??
                        index
                      }
                    >
                      <td>
                        <div className="dashboard-person-cell">
                          <span className="dashboard-avatar">
                            {getPatientName(appointment)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <strong>{getPatientName(appointment)}</strong>
                        </div>
                      </td>
                      <td>{getDoctorName(appointment)}</td>
                      <td>{getSpecialization(appointment)}</td>
                      <td>{formatDate(getAppointmentDate(appointment))}</td>
                      <td>{formatTime(getAppointmentTime(appointment))}</td>
                      <td>
                        <span
                          className={`dashboard-status ${getStatusClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="dashboard-empty">
                    No appointments available to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="dashboard-table-footer">
          Showing {recentAppointments.length} of {appointments.length} appointments
        </div>
      </section>

      <footer className="dashboard-footer">
        Hospital Management System <span>•</span> Admin Overview
      </footer>
    </main>
  );
};

export default AdminDashboard;
