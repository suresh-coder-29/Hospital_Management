
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import API from "../Services/Api";
import "./DoctorMyProfile.css";

const DoctorMyProfile = () => {
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await API.get("doctors/my-profile/");
                setDoctor(response.data);
            } catch (err) {
                console.error("Doctor profile error:", err);

                setError(
                    err.response?.data?.error ||
                    err.response?.data?.detail ||
                    "Unable to load doctor profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const showValue = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "Not provided";
        }

        return value;
    };

    if (loading) {
        return (
            <div className="doctor-profile-page container-fluid">
                <div className="doctor-profile-message">
                    <div
                        className="spinner-border doctor-profile-spinner"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>
                    <p>Loading doctor profile...</p>
                </div>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="doctor-profile-page container-fluid">
                <div className="doctor-profile-error">
                    <span className="doctor-error-icon">!</span>
                    <h3>Unable to Load Profile</h3>
                    <p>{error || "Doctor profile not found."}</p>
                </div>
            </div>
        );
    }

    const imageUrl = doctor.profile_image_url;

    const doctorName = doctor.username || "Doctor";

    const approvalStatus = (
        doctor.approval_status || "pending"
    ).toLowerCase();

    return (
        <main className="doctor-profile-page container-fluid">
            <div className="doctor-profile-container">

                {/* Page Heading */}
                <header className="doctor-profile-heading">
                    <div className="doctor-profile-heading-content">
                        <span className="doctor-profile-eyebrow">
                            DOCTOR PORTAL
                        </span>

                        <h2>My Profile</h2>

                        <p>
                            Your registered professional and
                            personal information.
                        </p>
                    </div>
                </header>

                {/* Profile Hero */}
                <section className="doctor-profile-hero card">
                    <div className="doctor-profile-avatar">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={`${doctorName} profile`}
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.parentElement.classList.add(
                                        "doctor-avatar-fallback"
                                    );
                                }}
                            />
                        ) : (
                            <span>
                                {doctorName
                                    .charAt(0)
                                    .toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div className="doctor-profile-hero-info">
                        <h3>Dr. {showValue(doctor.username)}</h3>

                        <p className="doctor-hero-specialization">
                            {showValue(doctor.specialization)}
                        </p>

                        <p className="doctor-hero-qualification">
                            {showValue(doctor.qualification)}
                        </p>

                        <span
                            className={`doctor-approval-badge ${approvalStatus}`}
                        >
                            {showValue(doctor.approval_status)}
                        </span>
                    </div>
                </section>

                {/* Account Details */}
                <ProfileSection title="Account Details">
                    <ProfileField
                        label="Username"
                        value={doctor.username}
                    />

                    <ProfileField
                        label="Email Address"
                        value={doctor.email}
                    />

                    <ProfileField
                        label="Phone Number"
                        value={doctor.phone_number}
                    />

                    <ProfileField
                        label="Profile ID"
                        value={doctor.id}
                    />
                </ProfileSection>

                {/* Personal Details */}
                <ProfileSection title="Personal Details">
                    <ProfileField
                        label="Date of Birth"
                        value={doctor.date_of_birth}
                    />

                    <ProfileField
                        label="Gender"
                        value={doctor.gender}
                    />

                    <ProfileField
                        label="Address"
                        value={doctor.address}
                        fullWidth
                    />
                </ProfileSection>

                {/* Professional Details */}
                <ProfileSection title="Professional Details">
                    <ProfileField
                        label="Qualification"
                        value={doctor.qualification}
                    />

                    <ProfileField
                        label="Specialization"
                        value={doctor.specialization}
                    />

                    <ProfileField
                        label="Experience"
                        value={
                            doctor.experience_years !== null &&
                            doctor.experience_years !== undefined
                                ? `${doctor.experience_years} years`
                                : null
                        }
                    />

                    <ProfileField
                        label="Medical License Number"
                        value={doctor.medical_license_number}
                    />

                    <ProfileField
                        label="Consultation Fee"
                        value={
                            doctor.consultation_fee !== null &&
                            doctor.consultation_fee !== undefined
                                ? `₹${doctor.consultation_fee}`
                                : null
                        }
                    />

                    <ProfileField
                        label="Approval Status"
                        value={doctor.approval_status}
                    />

                    {doctor.rejection_reason && (
                        <div className="doctor-profile-notice">
                            <strong>Admin Feedback</strong>
                            <p>{doctor.rejection_reason}</p>
                        </div>
                    )}
                </ProfileSection>

                {/* Uploaded Documents */}
                <section className="doctor-profile-section card">
                    <div className="doctor-profile-section-heading">
                        <span className="doctor-section-icon">
                            <i className="bi bi-file-earmark-medical" />
                        </span>

                        <h3>Uploaded Documents</h3>
                    </div>

                    <div className="doctor-document-row">
                        <div className="doctor-document-info">
                            <strong>Profile Image</strong>
                            <p>
                                {imageUrl
                                    ? "Profile image uploaded"
                                    : "No profile image uploaded"}
                            </p>
                        </div>

                        {imageUrl && (
                            <a
                                href={imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="doctor-document-link btn"
                            >
                                View Image
                            </a>
                        )}
                    </div>

                    <div className="doctor-document-row">
                        <div className="doctor-document-info">
                            <strong>Medical Certificate</strong>
                            <p>
                                {doctor.medical_certificate_url
                                    ? "Certificate uploaded"
                                    : "No certificate uploaded"}
                            </p>
                        </div>

                        {doctor.medical_certificate_url && (
                            <a
                                href={doctor.medical_certificate_url}
                                target="_blank"
                                rel="noreferrer"
                                className="doctor-document-link btn"
                            >
                                View Certificate
                            </a>
                        )}
                    </div>
                </section>

            </div>
        </main>
    );
};

const ProfileSection = ({ title, children }) => (
    <section className="doctor-profile-section card">
        <div className="doctor-profile-section-heading">
            <span className="doctor-section-icon">
                <i className="bi bi-person-vcard" />
            </span>

            <h3>{title}</h3>
        </div>

        <div className="doctor-profile-grid">
            {children}
        </div>
    </section>
);

const ProfileField = ({ label, value, fullWidth = false }) => (
    <div
        className={`doctor-profile-field ${
            fullWidth ? "doctor-profile-field-full" : ""
        }`}
    >
        <span>{label}</span>

        <p>
            {value === null ||
            value === undefined ||
            value === ""
                ? "Not provided"
                : value}
        </p>
    </div>
);

export default DoctorMyProfile;
