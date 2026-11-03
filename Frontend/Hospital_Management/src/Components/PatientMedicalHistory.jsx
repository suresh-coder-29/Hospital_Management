
import React, { useEffect, useMemo, useState } from "react";
import API from "../Services/Api";
import "./PatientMedicalHistory.css";

const PatientMedicalHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    fetchMedicalHistory();
  }, []);

  const fetchMedicalHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("patients/medical-history/");
      const result = response.data;

      if (result?.success) {
        setRecords(Array.isArray(result.data) ? result.data : []);
      } else {
        setRecords([]);
        setError(result?.message || "Unable to load medical history.");
      }
    } catch (err) {
      console.error("Medical history error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to load medical history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (value) => {
    return value && String(value).trim()
      ? value
      : "Not recorded";
  };

  const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(`${value}`.slice(0, 10) + "T00:00:00");

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !term ||
        [
          record.doctor_name,
          record.specialization,
          record.symptoms,
          record.diagnosis,
          record.treatment,
          record.prescription,
          record.test_results,
        ].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );

      const matchesDate =
        !selectedDate ||
        String(record.consultation_date || "").slice(0, 10) ===
          selectedDate;

      return matchesSearch && matchesDate;
    });
  }, [records, search, selectedDate]);

  const totalVisits = records.length;

  const latestVisit = records.length
    ? formatDate(records[0].consultation_date)
    : "No visits yet";

  const allAllergies = [
    ...new Set(
      records
        .map((record) => record.allergies?.trim())
        .filter(Boolean)
    ),
  ];

  if (loading) {
    return (
      <main className="medical-history-page">
        <div className="medical-history-loading">
          <span className="medical-history-spinner" />
          <p>Loading your medical history...</p>
        </div>
      </main>
    );
  }

  if (error && records.length === 0) {
    return (
      <main className="medical-history-page">
        <div className="medical-history-error">
          <div className="medical-history-error-icon">!</div>
          <h2>Medical history unavailable</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchMedicalHistory}>
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="medical-history-page">
      <header className="medical-history-header">
        <div>
          <span className="medical-history-eyebrow">
            PATIENT PORTAL
          </span>
          <h1>Medical History</h1>
          <p>
            Review your previous consultations, diagnoses and treatment
            records.
          </p>
        </div>

        <button
          className="medical-history-refresh"
          type="button"
          onClick={fetchMedicalHistory}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="medical-history-alert" role="alert">
          {error}
        </div>
      )}

      <section className="medical-history-summary">
        <article className="medical-summary-card">
          <div className="medical-summary-icon">▤</div>
          <div>
            <span>Total Records</span>
            <strong>{totalVisits}</strong>
            <small>Recorded consultations</small>
          </div>
        </article>

        <article className="medical-summary-card">
          <div className="medical-summary-icon">▦</div>
          <div>
            <span>Latest Visit</span>
            <strong className="medical-summary-date">{latestVisit}</strong>
            <small>Most recent consultation</small>
          </div>
        </article>

        <article className="medical-summary-card">
          <div className="medical-summary-icon">♡</div>
          <div>
            <span>Allergy Entries</span>
            <strong>{allAllergies.length}</strong>
            <small>Distinct recorded entries</small>
          </div>
        </article>
      </section>

      <section className="medical-history-section">
        <div className="medical-history-section-heading">
          <div>
            <h2>Consultation Records</h2>
            <p>Your recorded medical visits and treatment details</p>
          </div>

          <span className="medical-history-count">
            {filteredRecords.length} record(s)
          </span>
        </div>

        <div className="medical-history-filters">
          <div className="medical-history-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search doctor, diagnosis or treatment..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search medical history"
            />
          </div>

          <input
            className="medical-history-date-filter"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            aria-label="Filter by consultation date"
          />

          <button
            className="medical-history-clear"
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedDate("");
            }}
          >
            Clear
          </button>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="medical-history-empty">
            <div className="medical-history-empty-icon">＋</div>
            <h3>
              {records.length === 0
                ? "No medical records yet"
                : "No matching records"}
            </h3>
            <p>
              {records.length === 0
                ? "Your consultation history will appear here when a doctor or authorized staff member records it."
                : "Try another search term or clear the date filter."}
            </p>
            {(search || selectedDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedDate("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="medical-history-record-list">
            {filteredRecords.map((record) => (
              <article
                className="medical-history-record"
                key={record.id}
              >
                <div className="medical-record-top">
                  <div className="medical-record-date-icon">▦</div>

                  <div className="medical-record-title">
                    <span className="medical-record-date">
                      {formatDate(record.consultation_date)}
                    </span>
                    <h3>{displayValue(record.diagnosis)}</h3>
                    <p>
                      Dr. {displayValue(record.doctor_name)}
                      {record.specialization
                        ? ` · ${record.specialization}`
                        : ""}
                    </p>
                  </div>

                  <span className="medical-record-badge">
                    Medical Record
                  </span>
                </div>

                <div className="medical-record-details">
                  <div className="medical-record-detail">
                    <span className="medical-record-detail-icon">✚</span>
                    <div>
                      <h4>Symptoms</h4>
                      <p>{displayValue(record.symptoms)}</p>
                    </div>
                  </div>

                  <div className="medical-record-detail">
                    <span className="medical-record-detail-icon">♡</span>
                    <div>
                      <h4>Diagnosis</h4>
                      <p>{displayValue(record.diagnosis)}</p>
                    </div>
                  </div>

                  <div className="medical-record-detail">
                    <span className="medical-record-detail-icon">⚕</span>
                    <div>
                      <h4>Treatment</h4>
                      <p>{displayValue(record.treatment)}</p>
                    </div>
                  </div>

                  <div className="medical-record-detail">
                    <span className="medical-record-detail-icon">▤</span>
                    <div>
                      <h4>Prescription</h4>
                      <p>{displayValue(record.prescription)}</p>
                    </div>
                  </div>

                  <div className="medical-record-detail">
                    <span className="medical-record-detail-icon">⌕</span>
                    <div>
                      <h4>Test Results</h4>
                      <p>{displayValue(record.test_results)}</p>
                    </div>
                  </div>

                  <div className="medical-record-detail">
                    <span className="medical-record-detail-icon">!</span>
                    <div>
                      <h4>Allergies</h4>
                      <p>{displayValue(record.allergies)}</p>
                    </div>
                  </div>
                </div>

                {record.notes && (
                  <div className="medical-record-notes">
                    <strong>Doctor's Notes</strong>
                    <p>{record.notes}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="medical-history-footer">
        <span>ⓘ</span>
        <p>
          These records reflect information entered into the hospital
          system. For corrections or missing reports, contact your
          hospital or treating doctor.
        </p>
      </footer>
    </main>
  );
};

export default PatientMedicalHistory;
