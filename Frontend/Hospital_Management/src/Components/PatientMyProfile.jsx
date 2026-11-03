
import React, { useEffect, useState } from "react";
import API from "../Services/Api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./PatientMyProfile.css";

const PatientMyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await API.get("patients/my-profile/");

      if (response.data?.success) {
        setProfile(response.data.data);
      } else {
        setError(
          response.data?.message || "Unable to load your profile."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load profile. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not provided";
    }

    return value;
  };

  const getName = () => {
    if (!profile) return "Patient";

    const name =
      `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

    return name || profile.username || "Patient";
  };

  const getImage = () => {
    if (!profile?.profile_image) return "";

    if (
      profile.profile_image.startsWith("http://") ||
      profile.profile_image.startsWith("https://")
    ) {
      return profile.profile_image;
    }

    return `http://127.0.0.1:8000${profile.profile_image}`;
  };

  const getInitials = () => {
    const name = getName();

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const InfoItem = ({ icon, label, value }) => (
    <div className="patient-profile-info-item">
      <div className="patient-profile-info-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div className="patient-profile-info-content">
        <span className="patient-profile-info-label">{label}</span>
        <p className="patient-profile-info-value">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="patient-profile-page container-fluid">
        <div className="patient-profile-loading">
          <div
            className="spinner-border patient-profile-spinner"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>

          <h5>Loading your profile...</h5>
          <p>Please wait while we fetch your details.</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="patient-profile-page container-fluid">
        <div className="patient-profile-error">
          <div className="patient-profile-error-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>

          <h4>Unable to Load Profile</h4>
          <p>{error}</p>

          <button
            type="button"
            className="btn patient-profile-primary-btn"
            onClick={() => fetchProfile()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-profile-page container-fluid">
      <div className="patient-profile-container">
        {/* Page Heading */}
        <div className="patient-profile-heading d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <span className="patient-profile-eyebrow">
              PATIENT PORTAL
            </span>

            <h2>My Profile</h2>

            <p>View and manage your personal information.</p>
          </div>

          <button
            type="button"
            className="btn patient-profile-refresh-btn"
            onClick={() => fetchProfile(true)}
            disabled={refreshing}
          >
            <i
              className={`bi ${
                refreshing
                  ? "bi-arrow-repeat"
                  : "bi-arrow-clockwise"
              } me-2`}
            ></i>

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && profile && (
          <div className="alert alert-warning patient-profile-alert">
            {error}
          </div>
        )}

        {/* Profile Hero */}
        <section className="patient-profile-hero">
          <div className="patient-profile-hero-decoration"></div>

          <div className="patient-profile-hero-content">
            <div className="patient-profile-avatar">
              {getImage() ? (
                <img
                  src={getImage()}
                  alt={getName()}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>

            <div className="patient-profile-hero-details">
              <span className="patient-profile-status">
                <i className="bi bi-patch-check-fill me-1"></i>
                Patient Profile
              </span>

              <h3>{getName()}</h3>

              <p className="patient-profile-hero-email">
                <i className="bi bi-envelope me-2"></i>
                {getValue(profile?.email)}
              </p>

              <div className="patient-profile-id">
                <i className="bi bi-person-badge me-2"></i>
                Patient ID: {getValue(profile?.id)}
              </div>
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="patient-profile-card">
          <div className="patient-profile-section-heading">
            <div className="patient-profile-section-icon">
              <i className="bi bi-person-lines-fill"></i>
            </div>

            <div>
              <h4>Personal Information</h4>
              <p>Your basic personal details</p>
            </div>
          </div>

          <div className="row g-3 g-lg-4 patient-profile-info-grid">
            <div className="col-12 col-sm-6 col-xl-4">
              <InfoItem
                icon="bi-person"
                label="Full Name"
                value={getName()}
              />
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <InfoItem
                icon="bi-envelope"
                label="Email Address"
                value={getValue(profile?.email)}
              />
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <InfoItem
                icon="bi-telephone"
                label="Phone Number"
                value={getValue(profile?.phone_number)}
              />
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <InfoItem
                icon="bi-calendar-heart"
                label="Date of Birth"
                value={formatDate(profile?.date_of_birth)}
              />
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <InfoItem
                icon="bi-gender-ambiguous"
                label="Gender"
                value={getValue(profile?.gender)}
              />
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <InfoItem
                icon="bi-droplet"
                label="Blood Group"
                value={getValue(profile?.blood_group)}
              />
            </div>
          </div>
        </section>

        {/* Address Information */}
        <section className="patient-profile-card">
          <div className="patient-profile-section-heading">
            <div className="patient-profile-section-icon">
              <i className="bi bi-geo-alt"></i>
            </div>

            <div>
              <h4>Address Information</h4>
              <p>Your registered residential address</p>
            </div>
          </div>

          <div className="patient-profile-address">
            <div className="patient-profile-address-icon">
              <i className="bi bi-house-door"></i>
            </div>

            <div>
              <span className="patient-profile-info-label">
                Residential Address
              </span>

              <p className="patient-profile-address-value">
                {getValue(profile?.address)}
              </p>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="patient-profile-card">
          <div className="patient-profile-section-heading">
            <div className="patient-profile-section-icon patient-profile-emergency-icon">
              <i className="bi bi-heart-pulse"></i>
            </div>

            <div>
              <h4>Emergency Contact</h4>
              <p>Contact information for emergencies</p>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <InfoItem
                icon="bi-person-heart"
                label="Contact Person"
                value={getValue(profile?.emergency_contact_name)}
              />
            </div>

            <div className="col-12 col-md-6">
              <InfoItem
                icon="bi-telephone-plus"
                label="Emergency Phone Number"
                value={getValue(profile?.emergency_contact_number)}
              />
            </div>
          </div>
        </section>

        {/* Information Note */}
        <div className="patient-profile-note">
          <div className="patient-profile-note-icon">
            <i className="bi bi-info-circle"></i>
          </div>

          <div>
            <h6>Keep Your Information Updated</h6>
            <p>
              Please ensure your personal and emergency contact
              information is accurate so the hospital can contact you
              when necessary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMyProfile;
