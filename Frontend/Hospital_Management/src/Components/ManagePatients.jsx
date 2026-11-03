
import React, { useEffect, useState } from "react";
import API from "../Services/Api";
import "./ManagePatients.css";

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    pending: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  // =====================================
  // FETCH ALL PATIENTS AND ADMIN STATS
  // =====================================
  const fetchPatients = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("appointments/admin/patients/");
      const data = response.data;

      const patientList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.patients)
        ? data.patients
        : [];

      setPatients(patientList);

      // Fetch each patient's appointment history
      const histories = await Promise.all(
        patientList.map(async (patient) => {
          try {
            const res = await API.get(
              `appointments/admin/patients/${patient.id}/appointments/`
            );

            return res.data;
          } catch (err) {
            console.error(
              `Failed to load history for patient ${patient.id}`,
              err
            );
            return null;
          }
        })
      );

      const validHistories = histories.filter(Boolean);

      setStats({
        totalPatients: patientList.length,

        totalAppointments: validHistories.reduce(
          (sum, item) =>
            sum + Number(item.total_appointments || 0),
          0
        ),

        pending: validHistories.reduce(
          (sum, item) =>
            sum + Number(item.pending_count || 0),
          0
        ),

        completed: validHistories.reduce(
          (sum, item) =>
            sum + Number(item.completed_count || 0),
          0
        ),
      });
    } catch (err) {
      console.error("Patient loading error:", err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to load patients. Please check your admin login."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // FETCH SELECTED PATIENT HISTORY
  // =====================================
  const fetchPatientHistory = async (patient) => {
    setSelectedPatient(patient);
    setHistory(null);
    setHistoryLoading(true);
    setError("");

    try {
      const response = await API.get(
        `appointments/admin/patients/${patient.id}/appointments/`
      );

      setHistory(response.data);
    } catch (err) {
      console.error("Patient history error:", err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to load this patient's appointments."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================
  // BACK TO PATIENT LIST
  // =====================================
  const closeHistory = () => {
    setSelectedPatient(null);
    setHistory(null);
    setError("");
  };

  // =====================================
  // STATUS CSS CLASS
  // =====================================
  const statusClass = (value) =>
    String(value || "unknown")
      .toLowerCase()
      .replace(/\s+/g, "-");

  // =====================================
  // FORMAT DATE
  // =====================================
  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================
  // DASHBOARD UI
  // =====================================
  return (
    <div className="manage-patients-page">

      {/* HEADER */}
      <div className="mp-header">
        <div>
          <span className="mp-eyebrow">ADMINISTRATION</span>

          <h2>
            {selectedPatient ? "Patient History" : "Manage Patients"}
          </h2>

          <p>
            {selectedPatient
              ? "View complete appointment details for this patient."
              : "Manage registered patients and monitor their appointments."}
          </p>
        </div>

        {selectedPatient && (
          <button
            type="button"
            className="mp-back-btn"
            onClick={closeHistory}
          >
            <span>←</span> Back to Patients
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mp-error" role="alert">
          <span>!</span>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => {
              if (selectedPatient) {
                fetchPatientHistory(selectedPatient);
              } else {
                fetchPatients();
              }
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* TOP STATISTICS - ALWAYS VISIBLE */}
      <section className="mp-top-stats">

        <div className="mp-top-card total-patients">
          <div className="mp-top-icon">👥</div>

          <div className="mp-top-info">
            <p>Total Patients</p>
            <h2>{stats.totalPatients}</h2>
            <span>Registered patients</span>
          </div>
        </div>

        <div className="mp-top-card total-appointments">
          <div className="mp-top-icon">📅</div>

          <div className="mp-top-info">
            <p>Total Appointments</p>
            <h2>{stats.totalAppointments}</h2>
            <span>All patient appointments</span>
          </div>
        </div>

        <div className="mp-top-card pending-appointments">
          <div className="mp-top-icon">⏳</div>

          <div className="mp-top-info">
            <p>Pending Appointments</p>
            <h2>{stats.pending}</h2>
            <span>Awaiting action</span>
          </div>
        </div>

        <div className="mp-top-card completed-appointments">
          <div className="mp-top-icon">✓</div>

          <div className="mp-top-info">
            <p>Completed Appointments</p>
            <h2>{stats.completed}</h2>
            <span>Successfully completed</span>
          </div>
        </div>

      </section>

      {/* PATIENT LIST */}
      {!selectedPatient && (
        <section className="mp-list-section">

          <div className="mp-section-header">
            <div>
              <h3>Registered Patients</h3>
              <p>Select a patient to view their appointment history.</p>
            </div>

            <button
              type="button"
              className="mp-refresh-btn"
              onClick={fetchPatients}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="mp-loading">
              <div className="mp-spinner"></div>
              <p>Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-icon">👥</div>
              <h3>No Patients Found</h3>
              <p>Registered patients will appear here.</p>
            </div>
          ) : (
            <div className="mp-patient-grid">
              {patients.map((patient) => (
                <button
                  type="button"
                  className="mp-patient-card"
                  key={patient.id}
                  onClick={() => fetchPatientHistory(patient)}
                >
                  <div className="mp-card-top">
                    <div className="mp-avatar">
                      {(patient.name || "P")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <span className="mp-view-icon">↗</span>
                  </div>

                  <h3>{patient.name || "Patient"}</h3>

                  <div className="mp-patient-contact">
                    <p>
                      <span>✉</span>
                      {patient.email || "No email available"}
                    </p>

                    <p>
                      <span>☎</span>
                      {patient.phone_number || "No phone number"}
                    </p>
                  </div>

                  <div className="mp-card-footer">
                    <span>View Appointment History</span>
                    <span>→</span>
                  </div>
                </button>
              ))}
            </div>
          )}

        </section>
      )}

      {/* SELECTED PATIENT HISTORY */}
      {selectedPatient && (
        <section className="mp-history">

          {/* PATIENT INFORMATION */}
          <div className="mp-patient-summary">
            <div className="mp-summary-left">
              <div className="mp-avatar mp-summary-avatar">
                {(selectedPatient.name || "P")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <span className="mp-eyebrow">PATIENT DETAILS</span>
                <h3>{selectedPatient.name || "Patient"}</h3>
                <p>{selectedPatient.email || "No email available"}</p>
                <p>
                  {selectedPatient.phone_number || "No phone number"}
                </p>
              </div>
            </div>

            <div className="mp-total">
              <span>Total Appointments</span>
              <strong>
                {history ? history.total_appointments : "—"}
              </strong>
            </div>
          </div>

          {historyLoading ? (
            <div className="mp-loading">
              <div className="mp-spinner"></div>
              <p>Loading appointment history...</p>
            </div>
          ) : history ? (
            <>
              {/* SELECTED PATIENT STATISTICS */}
              <div className="mp-stats">

                <div className="mp-stat">
                  <span>Total</span>
                  <strong>{history.total_appointments ?? 0}</strong>
                </div>

                <div className="mp-stat pending">
                  <span>Pending</span>
                  <strong>{history.pending_count ?? 0}</strong>
                </div>

                <div className="mp-stat confirmed">
                  <span>Confirmed</span>
                  <strong>{history.confirmed_count ?? 0}</strong>
                </div>

                <div className="mp-stat completed">
                  <span>Completed</span>
                  <strong>{history.completed_count ?? 0}</strong>
                </div>

                <div className="mp-stat cancelled">
                  <span>Cancelled</span>
                  <strong>{history.cancelled_count ?? 0}</strong>
                </div>

                <div className="mp-stat rescheduled">
                  <span>Rescheduled</span>
                  <strong>{history.rescheduled_count ?? 0}</strong>
                </div>

              </div>

              {/* APPOINTMENT TABLE */}
              <div className="mp-appointments-section">
                <div className="mp-section-header">
                  <div>
                    <h3>Appointment History</h3>
                    <p>
                      All appointments booked by this patient.
                    </p>
                  </div>
                </div>

                {Array.isArray(history.appointments) &&
                history.appointments.length > 0 ? (
                  <div className="mp-table-wrapper">
                    <table className="mp-table">
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Specialization</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Priority</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {history.appointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td>
                              <div className="mp-doctor-cell">
                                <div className="mp-doctor-avatar">
                                  {(appointment.doctor_name || "D")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <span>
                                  {appointment.doctor_name || "—"}
                                </span>
                              </div>
                            </td>

                            <td>
                              {appointment.specialization || "—"}
                            </td>

                            <td>
                              {formatDate(appointment.appointment_date)}
                            </td>

                            <td>
                              {appointment.appointment_time || "—"}
                            </td>

                            <td>
                              <span
                                className={`mp-priority ${statusClass(
                                  appointment.priority
                                )}`}
                              >
                                {appointment.priority || "NORMAL"}
                              </span>
                            </td>

                            <td className="mp-reason">
                              {appointment.reason || "—"}
                            </td>

                            <td>
                              <span
                                className={`mp-status ${statusClass(
                                  appointment.status
                                )}`}
                              >
                                {appointment.status || "Unknown"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mp-empty">
                    <div className="mp-empty-icon">📅</div>
                    <h3>No Appointments Yet</h3>
                    <p>
                      This patient has not booked any appointments.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}

        </section>
      )}

    </div>
  );
};

export default ManagePatients;
