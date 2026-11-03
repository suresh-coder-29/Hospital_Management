
import React, { useCallback, useEffect, useState } from "react";
import API from "../Services/Api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./MyDoctorAppointmenets.css";

const MyDoctorAppointments = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [appointmentStatus, setAppointmentStatus] = useState("ALL");

  const role = (localStorage.getItem("role") || "").toUpperCase();

  const getDoctorId = (doctor) =>
    doctor?.user_id ?? doctor?.user?.id ?? doctor?.id;

  const getDoctorName = (doctor) => {
    const user = doctor?.user || {};

    return (
      doctor?.full_name ||
      doctor?.name ||
      user?.full_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      user?.username ||
      doctor?.username ||
      "Doctor"
    );
  };

  const getApprovalStatus = (doctor) =>
    String(doctor?.approval_status || doctor?.status || "PENDING").toUpperCase();

  const extractList = (data, key) => {
    if (Array.isArray(data)) return data;

    const list = data?.[key] || data?.results || data?.data || [];
    return Array.isArray(list) ? list : [];
  };

  const fetchDoctors = useCallback(async () => {
    if (role !== "ADMIN") {
      setError("Admin access only. Please log in as Admin.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.get("appointments/admin/doctors/");
      const list = extractList(response.data, "doctors");

      setDoctors(list);

      setSelectedDoctor((previous) => {
        if (!previous) return null;

        const previousId = String(getDoctorId(previous));

        return (
          list.find(
            (doctor) => String(getDoctorId(doctor)) === previousId
          ) || null
        );
      });
    } catch (err) {
      console.error("Fetch doctors error:", err.response?.data || err.message);

      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Admin access denied. Check your login role and permissions.");
      } else {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Unable to load doctors."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const fetchDoctorAppointments = async (doctor) => {
    const doctorId = getDoctorId(doctor);

    if (!doctorId) {
      setError("Doctor ID is missing. Check AdminDoctorSerializer.");
      return;
    }

    try {
      setSelectedDoctor(doctor);
      setAppointments([]);
      setAppointmentsLoading(true);
      setError("");
      setAppointmentStatus("ALL");

      const response = await API.get(
        `appointments/admin/doctors/${doctorId}/appointments/`
      );

      setAppointments(extractList(response.data, "appointments"));
    } catch (err) {
      console.error(
        "Fetch doctor appointments error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to load this doctor's appointments."
      );
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleApproval = async (doctor, action) => {
    const doctorId = getDoctorId(doctor);

    if (!doctorId) {
      setError("Doctor ID is missing.");
      return;
    }

    const actionLabel = action === "approve" ? "approve" : "reject";
    const doctorName = getDoctorName(doctor);

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} Dr. ${doctorName}?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await API.post(
        `appointments/admin/doctors/${doctorId}/${action}/`
      );

      setSuccess(
        `Dr. ${doctorName} has been ${
          action === "approve" ? "approved" : "rejected"
        } successfully.`
      );

      await fetchDoctors();
    } catch (err) {
      console.error("Doctor approval error:", err.response?.data || err.message);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          `Unable to ${actionLabel} this doctor. Check the backend endpoint.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getPatientName = (appointment) => {
    const patient =
      appointment?.patient_details ||
      appointment?.patient_profile ||
      appointment?.patient_data ||
      appointment?.patient;

    if (patient && typeof patient === "object") {
      const user = patient.user || {};
      const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");

      return (
        patient.name ||
        patient.full_name ||
        fullName ||
        user.username ||
        patient.username ||
        "Patient"
      );
    }

    return appointment?.patient_name || "Patient";
  };

  const getDate = (appointment) =>
    appointment?.appointment_date || appointment?.date || "—";

  const getTime = (appointment) =>
    appointment?.appointment_time ||
    appointment?.appointment_time_slot ||
    appointment?.time ||
    "—";

  const getAppointmentStatus = (appointment) =>
    String(appointment?.status || "PENDING").toUpperCase();

  const getPriority = (appointment) =>
    String(appointment?.priority || "NORMAL").toUpperCase();

  const statusClass = (value) =>
    String(value || "unknown").toLowerCase().replace(/\s+/g, "-");

  const filteredDoctors = doctors.filter((doctor) => {
    const query = search.trim().toLowerCase();

    const name = getDoctorName(doctor).toLowerCase();
    const specialization = String(doctor?.specialization || "").toLowerCase();
    const qualification = String(doctor?.qualification || "").toLowerCase();

    const matchesSearch =
      name.includes(query) ||
      specialization.includes(query) ||
      qualification.includes(query);

    const matchesStatus =
      statusFilter === "ALL" || getApprovalStatus(doctor) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const countApprovalStatus = (status) =>
    doctors.filter((doctor) => getApprovalStatus(doctor) === status).length;

  const filteredAppointments = appointments.filter((appointment) => {
    return (
      appointmentStatus === "ALL" ||
      getAppointmentStatus(appointment) === appointmentStatus
    );
  });

  const closeHistory = () => {
    setSelectedDoctor(null);
    setAppointments([]);
    setError("");
  };

  if (role !== "ADMIN") {
    return (
      <main className="mda-page container-fluid">
        <div className="mda-message">
          <i className="bi bi-shield-lock me-2" />
          Admin access only. Please log in as Admin.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mda-page container-fluid">
        <div className="mda-loading">
          <div className="spinner-border" role="status" />
          <p>Loading doctor details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mda-page container-fluid">
      {/* PAGE HEADER */}
      <header className="mda-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="mda-heading">
          <span className="mda-eyebrow">ADMINISTRATION</span>
          <h1>Manage Doctors</h1>
          <p>
            Review doctor registrations, approve accounts and view appointment
            history.
          </p>
        </div>

        <button
          type="button"
          className="mda-refresh-btn btn"
          onClick={fetchDoctors}
          disabled={loading || actionLoading}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          Refresh Doctors
        </button>
      </header>

      {/* ERROR AND SUCCESS MESSAGES */}
      {error && (
        <div className="mda-alert mda-error alert d-flex align-items-start gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          <span className="flex-grow-1">{error}</span>
          <button
            type="button"
            className="mda-alert-close"
            aria-label="Close error"
            onClick={() => setError("")}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {success && (
        <div className="mda-alert mda-success alert d-flex align-items-start gap-2">
          <i className="bi bi-check-circle-fill" />
          <span className="flex-grow-1">{success}</span>
          <button
            type="button"
            className="mda-alert-close"
            aria-label="Close success message"
            onClick={() => setSuccess("")}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <section className="mda-stats row g-3" aria-label="Doctor statistics">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mda-stat-card mda-stat-total h-100">
            <div className="mda-stat-icon">
              <i className="bi bi-people-fill" />
            </div>
            <div>
              <span>Total Doctors</span>
              <h3>{doctors.length}</h3>
              <small>Registered doctors</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mda-stat-card mda-stat-pending h-100">
            <div className="mda-stat-icon">
              <i className="bi bi-hourglass-split" />
            </div>
            <div>
              <span>Pending Approval</span>
              <h3>{countApprovalStatus("PENDING")}</h3>
              <small>Awaiting review</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mda-stat-card mda-stat-approved h-100">
            <div className="mda-stat-icon">
              <i className="bi bi-patch-check-fill" />
            </div>
            <div>
              <span>Approved</span>
              <h3>{countApprovalStatus("APPROVED")}</h3>
              <small>Active approvals</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mda-stat-card mda-stat-rejected h-100">
            <div className="mda-stat-icon">
              <i className="bi bi-person-x-fill" />
            </div>
            <div>
              <span>Rejected</span>
              <h3>{countApprovalStatus("REJECTED")}</h3>
              <small>Rejected registrations</small>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH AND FILTER */}
      <section className="mda-panel">
        <div className="mda-section-heading">
          <div>
            <h2>Registered Doctors</h2>
            <p>Search doctors and filter by approval status.</p>
          </div>
          <span className="mda-result-count">
            {filteredDoctors.length} doctor
            {filteredDoctors.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="mda-toolbar row g-3">
          <div className="col-12 col-lg-8">
            <label htmlFor="mda-doctor-search" className="mda-label">
              Search
            </label>
            <div className="mda-input-wrap">
              <i className="bi bi-search" />
              <input
                id="mda-doctor-search"
                className="form-control"
                type="search"
                placeholder="Search name, specialization or qualification..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <label htmlFor="mda-status-filter" className="mda-label">
              Approval status
            </label>
            <select
              id="mda-status-filter"
              className="form-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All Doctors</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* DOCTORS TABLE */}
        <div className="mda-table-wrapper">
          <table className="mda-table table align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th>Approval Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor, index) => {
                  const status = getApprovalStatus(doctor);
                  const doctorId = getDoctorId(doctor);

                  return (
                    <tr key={doctorId ?? index}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="mda-person-cell">
                          <div className="mda-doctor-avatar">
                            {getDoctorName(doctor).charAt(0).toUpperCase()}
                          </div>
                          <span className="mda-person-name">
                            {getDoctorName(doctor)}
                          </span>
                        </div>
                      </td>

                      <td>{doctor.specialization || "—"}</td>
                      <td>{doctor.qualification || "—"}</td>
                      <td>{doctor.experience_years ?? 0} years</td>

                      <td>
                        <span
                          className={`mda-status mda-status-${statusClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className="mda-actions">
                          <button
                            type="button"
                            className="btn mda-view-btn"
                            onClick={() => fetchDoctorAppointments(doctor)}
                          >
                            <i className="bi bi-calendar3 me-1" />
                            View Appointments
                          </button>

                          {status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                className="btn mda-approve-btn"
                                disabled={actionLoading}
                                onClick={() => handleApproval(doctor, "approve")}
                              >
                                <i className="bi bi-check-lg me-1" />
                                Approve
                              </button>

                              <button
                                type="button"
                                className="btn mda-reject-btn"
                                disabled={actionLoading}
                                onClick={() => handleApproval(doctor, "reject")}
                              >
                                <i className="bi bi-x-lg me-1" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="mda-empty">
                      <i className="bi bi-search" />
                      <h3>No doctors found</h3>
                      <p>Try changing the search term or status filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mda-table-hint">
          <i className="bi bi-arrows me-1" />
          On smaller screens, swipe horizontally to see all table columns.
        </p>
      </section>

      {/* SELECTED DOCTOR APPOINTMENT HISTORY */}
      {selectedDoctor && (
        <section className="mda-panel mda-history-section">
          <div className="mda-section-heading mda-history-heading">
            <div>
              <span className="mda-eyebrow">DOCTOR DETAILS</span>
              <h2>Dr. {getDoctorName(selectedDoctor)}</h2>
              <p>
                Specialization: {selectedDoctor.specialization || "—"}
              </p>
            </div>

            <button
              type="button"
              className="btn mda-refresh-btn"
              onClick={closeHistory}
            >
              <i className="bi bi-x-circle me-2" />
              Close History
            </button>
          </div>

          {appointmentsLoading ? (
            <div className="mda-loading">
              <div className="spinner-border" role="status" />
              <p>Loading appointment history...</p>
            </div>
          ) : (
            <>
              <div className="mda-appointment-toolbar row g-3 align-items-end">
                <div className="col-12 col-md-6">
                  <label
                    htmlFor="mda-appointment-status"
                    className="mda-label"
                  >
                    Filter appointments
                  </label>
                  <select
                    id="mda-appointment-status"
                    className="form-select"
                    value={appointmentStatus}
                    onChange={(event) =>
                      setAppointmentStatus(event.target.value)
                    }
                  >
                    <option value="ALL">All Appointment Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <div className="mda-appointment-count">
                    <i className="bi bi-calendar-check me-2" />
                    Showing {filteredAppointments.length} of{" "}
                    {appointments.length} appointments
                  </div>
                </div>
              </div>

              <div className="mda-table-wrapper">
                <table className="mda-table table align-middle">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Priority</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map((appointment, index) => {
                        const status = getAppointmentStatus(appointment);
                        const priority = getPriority(appointment);

                        return (
                          <tr
                            key={
                              appointment.id ??
                              appointment.appointment_id ??
                              index
                            }
                          >
                            <td>{index + 1}</td>

                            <td>
                              <div className="mda-person-cell">
                                <div className="mda-patient-avatar">
                                  {getPatientName(appointment)
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <span className="mda-person-name">
                                  {getPatientName(appointment)}
                                </span>
                              </div>
                            </td>

                            <td>{getDate(appointment)}</td>
                            <td>{getTime(appointment)}</td>

                            <td>
                              <span
                                className={`mda-priority mda-priority-${statusClass(priority)}`}
                              >
                                {priority}
                              </span>
                            </td>

                            <td className="mda-reason-cell">
                              {appointment.reason || "—"}
                            </td>

                            <td>
                              <span
                                className={`mda-status mda-status-${statusClass(status)}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7">
                          <div className="mda-empty">
                            <i className="bi bi-calendar-x" />
                            <h3>No appointments found</h3>
                            <p>
                              No appointments match the selected status.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
};

export default MyDoctorAppointments;
