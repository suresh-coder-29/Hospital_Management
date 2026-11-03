
import React, { useEffect, useMemo, useState } from "react";
import API from "../Services/Api";
import "./FindDoctors.css";

const FindDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [search, setSearch] = useState("");
    const [specialization, setSpecialization] = useState("ALL");
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await API.get("appointments/doctors/");

                const data = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.data)
                        ? response.data.data
                        : Array.isArray(response.data?.results)
                            ? response.data.results
                            : [];

                setDoctors(data);
            } catch (err) {
                console.error(
                    "Error fetching doctors:",
                    err.response?.data || err
                );

                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.error ||
                    "Unable to load doctors. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const specializations = useMemo(() => {
        return [
            ...new Set(
                doctors
                    .map((doctor) => doctor.specialization?.trim())
                    .filter(Boolean)
            ),
        ].sort((a, b) => a.localeCompare(b));
    }, [doctors]);

    const filteredDoctors = useMemo(() => {
        return doctors.filter((doctor) => {
            const doctorName = (doctor.name || "").toLowerCase();
            const doctorSpecialization =
                (doctor.specialization || "").toLowerCase();
            const doctorQualification =
                (doctor.qualification || "").toLowerCase();

            const searchText = search.trim().toLowerCase();

            const matchesSearch =
                doctorName.includes(searchText) ||
                doctorSpecialization.includes(searchText) ||
                doctorQualification.includes(searchText);

            const matchesSpecialization =
                specialization === "ALL" ||
                doctor.specialization?.toLowerCase() ===
                    specialization.toLowerCase();

            return matchesSearch && matchesSpecialization;
        });
    }, [doctors, search, specialization]);

    const closeDetails = () => setSelectedDoctor(null);

    const retryFetch = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("appointments/doctors/");

            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.data)
                    ? response.data.data
                    : Array.isArray(response.data?.results)
                        ? response.data.results
                        : [];

            setDoctors(data);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load doctors. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const getInitial = (name) =>
        name?.trim()?.charAt(0)?.toUpperCase() || "D";

    if (loading) {
        return (
            <main className="find-doctors-page">
                <div className="doctors-loading">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h3>Finding your doctors</h3>
                    <p>Please wait while we load available specialists.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="find-doctors-page container-fluid">

            {/* Page heading */}
            <section className="find-doctors-header">
                <div className="doctors-header-content">
                    <span className="doctors-eyebrow">
                        <i className="bi bi-heart-pulse-fill me-2"></i>
                        YOUR HEALTH, OUR PRIORITY
                    </span>

                    <h1>Find Your Doctor</h1>

                    <p>
                        Discover qualified doctors and find the right
                        specialist for your healthcare needs.
                    </p>
                </div>

                <div className="doctors-header-icon" aria-hidden="true">
                    <i className="bi bi-hospital"></i>
                </div>

                <div className="doctor-search-controls">
                    <div className="doctor-search-box">
                        <i className="bi bi-search search-icon"></i>

                        <input
                            type="search"
                            placeholder="Search doctor, specialty or qualification..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search doctors"
                        />

                        {search && (
                            <button
                                type="button"
                                className="search-clear-btn"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>

                    <div className="doctor-specialization-select">
                        <i className="bi bi-funnel"></i>

                        <select
                            value={specialization}
                            onChange={(e) =>
                                setSpecialization(e.target.value)
                            }
                            aria-label="Filter by specialization"
                        >
                            <option value="ALL">
                                All Specializations
                            </option>

                            {specializations.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="doctors-results">

                <div className="doctors-results-heading">
                    <div>
                        <h2>Our Specialists</h2>
                        <p>Choose a doctor to view professional details.</p>
                    </div>

                    <span className="doctor-count">
                        <i className="bi bi-people me-2"></i>
                        {filteredDoctors.length}{" "}
                        {filteredDoctors.length === 1 ? "Doctor" : "Doctors"}
                    </span>
                </div>

                {error && (
                    <div className="doctors-error" role="alert">
                        <i className="bi bi-exclamation-circle-fill"></i>

                        <div className="doctors-error-content">
                            <strong>Unable to load doctors</strong>
                            <p>{error}</p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-sm"
                            onClick={retryFetch}
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Retry
                        </button>
                    </div>
                )}

                {!error && filteredDoctors.length === 0 && (
                    <div className="doctors-empty">
                        <div className="empty-doctor-icon">
                            <i className="bi bi-search"></i>
                        </div>

                        <h3>No doctors found</h3>

                        <p>
                            Try another name or choose a different
                            specialization.
                        </p>

                        <button
                            type="button"
                            className="btn doctors-clear-btn"
                            onClick={() => {
                                setSearch("");
                                setSpecialization("ALL");
                            }}
                        >
                            <i className="bi bi-arrow-counterclockwise me-2"></i>
                            Clear Filters
                        </button>
                    </div>
                )}

                {!error && filteredDoctors.length > 0 && (
                    <div className="doctors-grid row g-3 g-xl-4">
                        {filteredDoctors.map((doctor) => (
                            <div
                                className="col-12 col-sm-6 col-xl-4"
                                key={doctor.id}
                            >
                                <article className="doctor-card h-100">

                                    <div className="doctor-card-top">
                                        <div className="doctor-avatar">
                                            {getInitial(doctor.name)}
                                        </div>

                                        <span className="doctor-verified">
                                            <i className="bi bi-patch-check-fill me-1"></i>
                                            Approved
                                        </span>
                                    </div>

                                    <h3>
                                        Dr. {doctor.name || "Doctor"}
                                    </h3>

                                    <p className="doctor-specialization">
                                        <i className="bi bi-heart-pulse me-2"></i>
                                        {doctor.specialization ||
                                            "Specialization not provided"}
                                    </p>

                                    <div className="doctor-card-info">

                                        <div className="doctor-info-item">
                                            <span>
                                                <i className="bi bi-mortarboard me-1"></i>
                                                Qualification
                                            </span>

                                            <strong>
                                                {doctor.qualification || "Not provided"}
                                            </strong>
                                        </div>

                                        <div className="doctor-info-item">
                                            <span>
                                                <i className="bi bi-briefcase me-1"></i>
                                                Experience
                                            </span>

                                            <strong>
                                                {doctor.experience_years ?? 0} years
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="doctor-card-bottom">

                                        <div className="doctor-fee">
                                            <span>Consultation fee</span>
                                            <strong>
                                                {doctor.consultation_fee != null
                                                    ? `₹${doctor.consultation_fee}`
                                                    : "N/A"}
                                            </strong>
                                        </div>

                                        <button
                                            type="button"
                                            className="doctor-details-btn"
                                            onClick={() =>
                                                setSelectedDoctor(doctor)
                                            }
                                        >
                                            View Details
                                            <i className="bi bi-arrow-right"></i>
                                        </button>

                                    </div>

                                </article>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Doctor details modal */}
            {selectedDoctor && (
                <div
                    className="doctor-modal-overlay"
                    onClick={closeDetails}
                >
                    <section
                        className="doctor-details-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="doctor-details-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="doctor-modal-close"
                            onClick={closeDetails}
                            aria-label="Close doctor details"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className="doctor-modal-header">
                            <div className="doctor-avatar doctor-avatar-large">
                                {getInitial(selectedDoctor.name)}
                            </div>

                            <div className="doctor-modal-heading">
                                <span className="doctor-modal-label">
                                    <i className="bi bi-patch-check-fill me-1"></i>
                                    DOCTOR PROFILE
                                </span>

                                <h2 id="doctor-details-title">
                                    Dr. {selectedDoctor.name || "Doctor"}
                                </h2>

                                <p>
                                    {selectedDoctor.specialization ||
                                        "Specialization not provided"}
                                </p>

                                <span className="doctor-verified">
                                    <i className="bi bi-check-circle-fill me-1"></i>
                                    Approved Doctor
                                </span>
                            </div>
                        </div>

                        <div className="doctor-professional-details">
                            <h3>
                                <i className="bi bi-person-vcard me-2"></i>
                                Professional Details
                            </h3>

                            <div className="doctor-detail-row">
                                <span>Specialization</span>
                                <strong>
                                    {selectedDoctor.specialization || "N/A"}
                                </strong>
                            </div>

                            <div className="doctor-detail-row">
                                <span>Qualification</span>
                                <strong>
                                    {selectedDoctor.qualification || "N/A"}
                                </strong>
                            </div>

                            <div className="doctor-detail-row">
                                <span>Experience</span>
                                <strong>
                                    {selectedDoctor.experience_years ?? 0} years
                                </strong>
                            </div>

                            <div className="doctor-detail-row">
                                <span>Consultation Fee</span>
                                <strong>
                                    {selectedDoctor.consultation_fee != null
                                        ? `₹${selectedDoctor.consultation_fee}`
                                        : "N/A"}
                                </strong>
                            </div>

                            <div className="doctor-detail-row">
                                <span>Doctor ID</span>
                                <strong>#{selectedDoctor.id}</strong>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="doctor-modal-done"
                            onClick={closeDetails}
                        >
                            Close Details
                            <i className="bi bi-check2 ms-2"></i>
                        </button>
                    </section>
                </div>
            )}

        </main>
    );
};

export default FindDoctors;
