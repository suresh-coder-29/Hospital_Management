import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DoctorConsultation.css";
import API from "../Services/Api";

const DoctorConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [form, setForm] = useState({
    diagnosis: "",
    treatment: "",
    prescription: "",
    test_results: "",
    allergies: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


useEffect(() => {
  const loadAppointment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("appointments/doctor/");

      // Django returns a direct array, not { data: [...] }
      const appointments = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      console.log("Appointments API response:", response.data);
      console.log("Route appointment ID:", appointmentId);

      const selected = appointments.find(
        (item) => String(item.id) === String(appointmentId)
      );

      if (!selected) {
        setAppointment(null);
        setError("Appointment not found in your appointment list.");
        return;
      }

      setAppointment(selected);
    } catch (err) {
      console.error("Load appointment error:", err.response?.data || err);

      setAppointment(null);
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Unable to load appointment."
      );
    } finally {
      setLoading(false);
    }
  };

  loadAppointment();
}, [appointmentId]);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.diagnosis.trim()) {
      setError("Diagnosis is required.");
      return;
    }

    if (!window.confirm(
      "Save this consultation and mark the appointment as completed?"
    )) {
      return;
    }

    setSaving(true);

    try {
      const response = await API.post(
        `appointments/doctor/appointments/${appointmentId}/consultation/`,
        form
      );

      setMessage(response.data.message);
      setAppointment((previous) => ({
        ...previous,
        status: "COMPLETED",
      }));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to save consultation."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading appointment...</p>;
  if (!appointment) return <p>{error || "Appointment not found."}</p>;

  return (
    <main className="consultation-page">
      <h2>Patient Consultation</h2>

      <section className="consultation-patient">
        <p><strong>Patient:</strong> {appointment.patient_name}</p>
        <p><strong>Date:</strong> {appointment.appointment_date}</p>
        <p><strong>Time:</strong> {appointment.appointment_time}</p>
        <p><strong>Reason:</strong> {appointment.reason}</p>
        <p><strong>Status:</strong> {appointment.status}</p>
      </section>

      {error && <p role="alert" className="consultation-error">{error}</p>}
      {message && <p role="status" className="consultation-success">{message}</p>}

      {appointment.status === "COMPLETED" ? (
        <p>This appointment has already been completed.</p>
      ) : (
        <form onSubmit={handleSubmit} className="consultation-form">
          <label htmlFor="diagnosis">Diagnosis *</label>
          <textarea
            id="diagnosis"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            required
          />

          <label htmlFor="treatment">Treatment</label>
          <textarea
            id="treatment"
            name="treatment"
            value={form.treatment}
            onChange={handleChange}
          />

          <label htmlFor="prescription">Prescription</label>
          <textarea
            id="prescription"
            name="prescription"
            value={form.prescription}
            onChange={handleChange}
            placeholder="Medicine, dosage, duration"
          />

          <label htmlFor="test_results">Test Results</label>
          <textarea
            id="test_results"
            name="test_results"
            value={form.test_results}
            onChange={handleChange}
          />

          <label htmlFor="allergies">Allergies</label>
          <textarea
            id="allergies"
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
          />

          <label htmlFor="notes">Notes / Follow-up</label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save & Complete Appointment"}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="consultation-back"
      >
        Back
      </button>
    </main>
  );
};

export default DoctorConsultation;