
import React, { useEffect, useState } from "react";
import API from "../Services/Api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./PatientBookAppointment.css";

function getErrorMessage(err, fallback) {
  const data = err.response?.data;

  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    if (data.error) return String(data.error);
    if (data.detail) return String(data.detail);
    if (data.message) return String(data.message);

    return Object.entries(data)
      .map(([key, value]) => {
        const text = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

        return `${key}: ${text}`;
      })
      .join(" | ");
  }

  if (err.response?.status === 401) {
    return "Login expire aagirukkalaam. Logout panni login pannunga.";
  }

  if (err.response?.status === 403) {
    return "Patient account-la login pannunga.";
  }

  if (!err.response) {
    return "Django backend running-ah irukka check pannunga.";
  }

  return fallback;
}

const PatientBookAppointment = () => {
  const [allDoctors, setAllDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  const [specialization, setSpecialization] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [availableDates, setAvailableDates] = useState([]);

  const [priority, setPriority] = useState("NORMAL");
  const [reason, setReason] = useState("");

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const today = new Date();

  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const filteredDoctors = allDoctors.filter((doctor) => {
    if (!specialization) return true;

    return (
      String(doctor.specialization || "").trim().toLowerCase() ===
      specialization.trim().toLowerCase()
    );
  });

  // Load approved doctors and specializations.
  useEffect(() => {
    let active = true;

    const loadDoctors = async () => {
      setLoadingDoctors(true);
      setError("");

      try {
        const response = await API.get("appointments/doctors/");

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.results ||
            response.data?.doctors ||
            [];

        if (!active) return;

        setAllDoctors(data);

        setSpecializations([
          ...new Set(
            data
              .map((doctor) =>
                String(doctor.specialization || "").trim()
              )
              .filter(Boolean)
          ),
        ]);
      } catch (err) {
        if (active) {
          setError(
            getErrorMessage(err, "Doctors load panna mudiyala.")
          );
        }
      } finally {
        if (active) setLoadingDoctors(false);
      }
    };

    loadDoctors();

    return () => {
      active = false;
    };
  }, []);

  // Reset dependent fields when specialization changes.
  useEffect(() => {
    setDoctorId("");
    setDate("");
    setAvailableDates([]);
  }, [specialization]);

  // Reset date when priority changes.
  useEffect(() => {
    setDate("");
    setAvailableDates([]);
  }, [priority]);

  // Load available dates for normal appointments.
  useEffect(() => {
    let active = true;

    const loadDates = async () => {
      if (priority !== "NORMAL" || !doctorId) {
        setAvailableDates([]);
        setLoadingDates(false);
        return;
      }

      setLoadingDates(true);
      setAvailableDates([]);
      setDate("");

      try {
        const response = await API.get(
          "appointments/schedules/available-dates/",
          {
            params: { doctor_id: doctorId },
          }
        );

        if (!active) return;

        setAvailableDates(
          Array.isArray(response.data?.available_dates)
            ? response.data.available_dates
            : []
        );
      } catch (err) {
        if (active) {
          setError(
            getErrorMessage(
              err,
              "Available dates load panna mudiyala."
            )
          );
        }
      } finally {
        if (active) setLoadingDates(false);
      }
    };

    loadDates();

    return () => {
      active = false;
    };
  }, [doctorId, priority]);

  // Load dates available with at least one doctor for emergencies.
  useEffect(() => {
    let active = true;

    const loadEmergencyDates = async () => {
      if (priority !== "EMERGENCY" || !specialization) {
        return;
      }

      setLoadingDates(true);
      setAvailableDates([]);
      setDate("");

      try {
        const matchingDoctors = allDoctors.filter(
          (doctor) =>
            String(doctor.specialization || "").trim().toLowerCase() ===
            specialization.trim().toLowerCase()
        );

        const dateResponses = await Promise.all(
          matchingDoctors.map(async (doctor) => {
            try {
              const response = await API.get(
                "appointments/schedules/available-dates/",
                {
                  params: { doctor_id: doctor.id },
                }
              );

              return response.data?.available_dates || [];
            } catch {
              return [];
            }
          })
        );

        if (!active) return;

        const combinedDates = [
          ...new Set(dateResponses.flat()),
        ].sort();

        setAvailableDates(combinedDates);
      } catch (err) {
        if (active) {
          setError(
            getErrorMessage(
              err,
              "Emergency dates load panna mudiyala."
            )
          );
        }
      } finally {
        if (active) setLoadingDates(false);
      }
    };

    loadEmergencyDates();

    return () => {
      active = false;
    };
  }, [priority, specialization, allDoctors]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!specialization || !date || !reason.trim()) {
      setError(
        "Specialization, appointment date and reason fill pannunga."
      );
      return;
    }

    if (date < minDate) {
      setError("Past date-la appointment book panna mudiyadhu.");
      return;
    }

    if (!availableDates.includes(date)) {
      setError(
        "Indha date available illa. Available dates-la irundhu select pannunga."
      );
      return;
    }

    if (priority === "NORMAL" && !doctorId) {
      setError("Doctor select pannunga.");
      return;
    }

    setSubmitting(true);

    try {
      let response;

      if (priority === "EMERGENCY") {
        response = await API.post("appointments/emergency/", {
          specialization,
          appointment_date: date,
          reason: reason.trim(),
        });
      } else {
        response = await API.post("appointments/book/", {
          doctor_id: Number(doctorId),
          appointment_date: date,
          reason: reason.trim(),
        });
      }

      setMessage(
        response.data?.message || "Request submitted successfully."
      );

      setReason("");

      // Refresh available dates after normal booking.
      if (priority === "NORMAL" && doctorId) {
        const refreshed = await API.get(
          "appointments/schedules/available-dates/",
          {
            params: { doctor_id: doctorId },
          }
        );

        setAvailableDates(
          refreshed.data?.available_dates || []
        );
      }
    } catch (err) {
      setError(
        getErrorMessage(err, "Appointment booking failed.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatAppointmentDate = (item) => {
    const parsedDate = new Date(`${item}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return item;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <main className="patient-book-page container-fluid">
      <div className="patient-book-container">

        {/* Page heading */}
        <header className="booking-heading d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <span className="booking-eyebrow">
              PATIENT PORTAL
            </span>

            <h1>Book an Appointment</h1>

            <p>
              Select a specialization, doctor and available date.
            </p>
          </div>

          <div className="booking-heading-icon">
            <i className="bi bi-calendar2-check"></i>
          </div>
        </header>

        {/* Booking form */}
        <form
          className="booking-card"
          onSubmit={handleSubmit}
        >
          {/* Messages */}
          {message && (
            <div
              className="booking-message success"
              role="status"
            >
              <i className="bi bi-check-circle-fill"></i>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div
              className="booking-message error"
              role="alert"
            >
              <i className="bi bi-exclamation-circle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Appointment type */}
          <section className="booking-section">
            <div className="booking-section-heading">
              <div className="booking-section-icon">
                <i className="bi bi-calendar2-event"></i>
              </div>

              <div>
                <h2>Appointment Type</h2>
                <p>Choose your appointment priority.</p>
              </div>
            </div>

            <div className="booking-type-options">
              <label
                className={`booking-type-option ${
                  priority === "NORMAL" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="NORMAL"
                  checked={priority === "NORMAL"}
                  onChange={() => {
                    setPriority("NORMAL");
                    setError("");
                    setMessage("");
                  }}
                />

                <span className="booking-type-icon normal-icon">
                  <i className="bi bi-calendar-check"></i>
                </span>

                <span className="booking-type-content">
                  <strong>Normal Appointment</strong>
                  <small>Book with a specific doctor.</small>
                </span>

                <span className="booking-radio-indicator">
                  <i className="bi bi-check-lg"></i>
                </span>
              </label>

              <label
                className={`booking-type-option ${
                  priority === "EMERGENCY" ? "selected emergency-selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="EMERGENCY"
                  checked={priority === "EMERGENCY"}
                  onChange={() => {
                    setPriority("EMERGENCY");
                    setError("");
                    setMessage("");
                  }}
                />

                <span className="booking-type-icon emergency-icon">
                  <i className="bi bi-heart-pulse"></i>
                </span>

                <span className="booking-type-content">
                  <strong>Emergency Appointment</strong>
                  <small>Send a request to matching doctors.</small>
                </span>

                <span className="booking-radio-indicator">
                  <i className="bi bi-check-lg"></i>
                </span>
              </label>
            </div>
          </section>

          {/* Doctor details */}
          <section className="booking-section">
            <div className="booking-section-heading">
              <div className="booking-section-icon">
                <i className="bi bi-person-badge"></i>
              </div>

              <div>
                <h2>Doctor Information</h2>
                <p>Select the specialization and doctor.</p>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="booking-field">
                  <label htmlFor="specialization">
                    Choose Specialization
                    <span className="booking-required">*</span>
                  </label>

                  <div className="booking-input-wrapper">
                    <i className="bi bi-heart-pulse booking-input-icon"></i>

                    <select
                      id="specialization"
                      className="form-select booking-control"
                      value={specialization}
                      onChange={(event) => {
                        setSpecialization(event.target.value);
                        setError("");
                        setMessage("");
                      }}
                      disabled={loadingDoctors || submitting}
                      required
                    >
                      <option value="">
                        {loadingDoctors
                          ? "Loading specializations..."
                          : "Select Specialization"}
                      </option>

                      {specializations.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {loadingDoctors && (
                    <small className="booking-help">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Loading approved doctors...
                    </small>
                  )}
                </div>
              </div>

              {priority === "NORMAL" && (
                <div className="col-12 col-md-6">
                  <div className="booking-field">
                    <label htmlFor="doctor">
                      Choose Doctor
                      <span className="booking-required">*</span>
                    </label>

                    <div className="booking-input-wrapper">
                      <i className="bi bi-person-check booking-input-icon"></i>

                      <select
                        id="doctor"
                        className="form-select booking-control"
                        value={doctorId}
                        onChange={(event) => {
                          setDoctorId(event.target.value);
                          setError("");
                          setMessage("");
                        }}
                        disabled={
                          !specialization ||
                          loadingDoctors ||
                          submitting
                        }
                        required
                      >
                        <option value="">
                          Select Doctor
                        </option>

                        {filteredDoctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name || `Doctor ${doctor.id}`}
                            {doctor.specialization
                              ? ` - ${doctor.specialization}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!loadingDoctors &&
                      specialization &&
                      filteredDoctors.length === 0 && (
                        <small className="booking-help">
                          No doctors found for this specialization.
                        </small>
                      )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Appointment date */}
          <section className="booking-section">
            <div className="booking-section-heading">
              <div className="booking-section-icon">
                <i className="bi bi-calendar3"></i>
              </div>

              <div>
                <h2>Appointment Date</h2>
                <p>Select one of the available dates.</p>
              </div>
            </div>

            <div className="booking-field">
              <label htmlFor="appointment-date">
                Available Appointment Date
                <span className="booking-required">*</span>
              </label>

              <div className="booking-input-wrapper">
                <i className="bi bi-calendar-date booking-input-icon"></i>

                <select
                  id="appointment-date"
                  className="form-select booking-control"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setError("");
                    setMessage("");
                  }}
                  disabled={
                    loadingDates ||
                    submitting ||
                    !specialization ||
                    (priority === "NORMAL" && !doctorId)
                  }
                  required
                >
                  <option value="">
                    {loadingDates
                      ? "Loading available dates..."
                      : "Select Available Date"}
                  </option>

                  {availableDates
                    .filter((item) => item >= minDate)
                    .map((item) => (
                      <option key={item} value={item}>
                        {formatAppointmentDate(item)}
                      </option>
                    ))}
                </select>
              </div>

              {!loadingDates &&
                (priority === "NORMAL"
                  ? doctorId
                  : specialization) &&
                availableDates.filter((item) => item >= minDate)
                  .length === 0 && (
                  <small className="booking-help booking-no-dates">
                    <i className="bi bi-info-circle me-1"></i>
                    Available dates illa. Vera doctor or specialization
                    select pannunga.
                  </small>
                )}

              <small className="booking-help">
                <i className="bi bi-info-circle me-1"></i>
                Appointment time will be assigned automatically by the system.
              </small>
            </div>

            {loadingDates && (
              <div className="booking-loading-dates">
                <span className="spinner-border spinner-border-sm"></span>
                <span>Checking available dates...</span>
              </div>
            )}
          </section>

          {/* Emergency information */}
          {priority === "EMERGENCY" && (
            <div className="emergency-note">
              <div className="emergency-note-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>

              <div>
                <h3>Emergency Request</h3>

                <p>
                  Your request will be sent to approved doctors in the
                  selected specialization. Appointment availability and
                  confirmation depend on the hospital system.
                </p>

                <p className="emergency-warning">
                  For a life-threatening emergency, contact local emergency
                  services immediately. Do not wait for an online response.
                </p>
              </div>
            </div>
          )}

          {/* Reason */}
          <section className="booking-section booking-reason-section">
            <div className="booking-section-heading">
              <div className="booking-section-icon">
                <i className="bi bi-chat-left-text"></i>
              </div>

              <div>
                <h2>Reason for Appointment</h2>
                <p>Tell the doctor why you need a consultation.</p>
              </div>
            </div>

            <div className="booking-field">
              <label htmlFor="reason">
                Describe Your Symptoms or Reason
                <span className="booking-required">*</span>
              </label>

              <textarea
                id="reason"
                className="form-control booking-control booking-textarea"
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Briefly describe your symptoms or reason for visiting..."
                maxLength={1000}
                required
              />

              <div className="booking-character-count">
                <span>Please provide relevant information.</span>
                <span>{reason.length}/1000</span>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="booking-submit-area">
            <button
              className="btn booking-submit"
              type="submit"
              disabled={
                submitting ||
                loadingDoctors ||
                loadingDates ||
                !date ||
                !availableDates.includes(date)
              }
            >
              {submitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Submitting Request...
                </>
              ) : (
                <>
                  <i
                    className={`bi ${
                      priority === "EMERGENCY"
                        ? "bi-heart-pulse"
                        : "bi-calendar2-check"
                    } me-2`}
                  ></i>

                  {priority === "EMERGENCY"
                    ? "Send Emergency Request"
                    : "Book Appointment"}

                  <i className="bi bi-arrow-right ms-2"></i>
                </>
              )}
            </button>

            <p className="booking-submit-note">
              <i className="bi bi-shield-check me-1"></i>
              Your appointment request is submitted securely.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
};

export default PatientBookAppointment;
