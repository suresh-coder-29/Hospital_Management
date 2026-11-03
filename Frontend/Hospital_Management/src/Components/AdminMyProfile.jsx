
import React, { useEffect, useState } from "react";
import API from "../Services/Api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./AdminMyProfile.css";

const initialProfile = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone_number: "",
};

const initialPasswords = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const AdminMyProfile = () => {
  const [profile, setProfile] = useState(initialProfile);
  const [passwords, setPasswords] = useState(initialPasswords);

  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("accounts/profile/");
        const data = response.data?.profile || response.data;

        setProfile({
          ...initialProfile,
          ...data,
        });
      } catch (err) {
        console.error(
          "Admin profile error:",
          err.response?.data || err.message
        );

        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Unable to load profile. Please check the profile API."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await API.patch("accounts/profile/", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone_number: profile.phone_number,
      });

      const updated = response.data?.profile || response.data;

      setProfile((previous) => ({
        ...previous,
        ...updated,
      }));

      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error(
        "Profile update error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (passwords.new_password !== passwords.confirm_password) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (passwords.new_password.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await API.post("accounts/change-password/", {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });

      setMessage(
        response.data?.message || "Password changed successfully."
      );

      setPasswords({ ...initialPasswords });
      setChangingPassword(false);
    } catch (err) {
      console.error(
        "Password change error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to change password. Please verify your current password."
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelProfileEdit = () => {
    setEditing(false);
    setError("");
    setMessage("");

    // Reload the saved profile to discard unsaved changes.
    API.get("accounts/profile/")
      .then((response) => {
        const data = response.data?.profile || response.data;

        setProfile({
          ...initialProfile,
          ...data,
        });
      })
      .catch((err) => {
        console.error("Profile reload error:", err.message);
      });
  };

  const fullName =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    profile.username ||
    "Administrator";

  const avatarLetter = (
    profile.first_name?.[0] ||
    profile.username?.[0] ||
    "A"
  ).toUpperCase();

  if (loading) {
    return (
      <div className="admin-profile-page container-fluid">
        <div className="admin-profile-loading">
          <div
            className="spinner-border admin-spinner"
            role="status"
            aria-label="Loading"
          />
          <p>Loading admin profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-page container-fluid">
      {/* Page Header */}
      <div className="admin-profile-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="admin-profile-eyebrow">
            <i className="bi bi-person-gear me-2" />
            ACCOUNT MANAGEMENT
          </div>

          <h2>Admin Profile</h2>

          <p>Manage your administrator account details and security.</p>
        </div>

        <span className="admin-role-badge">
          <i className="bi bi-shield-check me-2" />
          ADMIN
        </span>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className="alert admin-alert admin-alert-success d-flex align-items-start gap-2"
          role="status"
        >
          <i className="bi bi-check-circle-fill mt-1" />

          <div className="flex-grow-1">{message}</div>

          <button
            type="button"
            className="admin-alert-close"
            aria-label="Dismiss message"
            onClick={() => setMessage("")}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {error && (
        <div
          className="alert admin-alert admin-alert-error d-flex align-items-start gap-2"
          role="alert"
        >
          <i className="bi bi-exclamation-circle-fill mt-1" />

          <div className="flex-grow-1">{error}</div>

          <button
            type="button"
            className="admin-alert-close"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {/* Centered Profile Card */}
      <div className="admin-profile-card card">
        <div className="admin-profile-avatar">
          <span>{avatarLetter}</span>

          <span className="admin-avatar-status" title="Administrator" />
        </div>

        <h3>{fullName}</h3>

        <p className="admin-profile-email">
          <i className="bi bi-envelope me-2" />
          {profile.email || "Email not available"}
        </p>

        <span className="admin-profile-department">
          <i className="bi bi-hospital me-2" />
          Hospital Management System
        </span>

        <div className="admin-profile-divider" />

        <div className="admin-profile-summary row g-3 w-100">
          <div className="col-12 col-sm-6">
            <div className="admin-summary-item">
              <i className="bi bi-person-badge" />

              <div>
                <span>Username</span>
                <strong>{profile.username || "Not available"}</strong>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6">
            <div className="admin-summary-item">
              <i className="bi bi-shield-lock" />

              <div>
                <span>Account Role</span>
                <strong>Administrator</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <section className="admin-profile-section card">
        <div className="admin-section-heading">
          <div className="admin-section-title-icon">
            <div className="admin-section-icon">
              <i className="bi bi-person-lines-fill" />
            </div>

            <div>
              <h3>Personal Information</h3>
              <p>View and update your account information.</p>
            </div>
          </div>

          {!editing && (
            <button
              type="button"
              className="admin-profile-btn"
              onClick={() => {
                setError("");
                setMessage("");
                setEditing(true);
              }}
            >
              <i className="bi bi-pencil-square me-2" />
              Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <div className="admin-profile-field">
                <label htmlFor="admin-first-name">First Name</label>

                <div className="admin-input-wrapper">
                  <i className="bi bi-person" />

                  <input
                    id="admin-first-name"
                    type="text"
                    name="first_name"
                    className="form-control"
                    placeholder="Enter first name"
                    value={profile.first_name || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    autoComplete="given-name"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="admin-profile-field">
                <label htmlFor="admin-last-name">Last Name</label>

                <div className="admin-input-wrapper">
                  <i className="bi bi-person" />

                  <input
                    id="admin-last-name"
                    type="text"
                    name="last_name"
                    className="form-control"
                    placeholder="Enter last name"
                    value={profile.last_name || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="admin-profile-field">
                <label htmlFor="admin-username">Username</label>

                <div className="admin-input-wrapper">
                  <i className="bi bi-at" />

                  <input
                    id="admin-username"
                    type="text"
                    className="form-control"
                    value={profile.username || ""}
                    disabled
                    autoComplete="username"
                  />
                </div>

                <small className="admin-field-help">
                  Username cannot be changed here.
                </small>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="admin-profile-field">
                <label htmlFor="admin-email">Email Address</label>

                <div className="admin-input-wrapper">
                  <i className="bi bi-envelope" />

                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Enter email address"
                    value={profile.email || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="admin-profile-field">
                <label htmlFor="admin-phone">Phone Number</label>

                <div className="admin-input-wrapper">
                  <i className="bi bi-telephone" />

                  <input
                    id="admin-phone"
                    type="tel"
                    name="phone_number"
                    className="form-control"
                    placeholder="Enter phone number"
                    value={profile.phone_number || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="admin-profile-field">
                <label htmlFor="admin-role">Account Role</label>

                <div className="admin-input-wrapper">
                  <i className="bi bi-shield-check" />

                  <input
                    id="admin-role"
                    type="text"
                    className="form-control"
                    value="ADMIN"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {editing && (
            <div className="admin-profile-actions">
              <button
                type="submit"
                className="admin-profile-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2" />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                className="admin-profile-cancel"
                disabled={saving}
                onClick={cancelProfileEdit}
              >
                <i className="bi bi-x-circle me-2" />
                Cancel
              </button>
            </div>
          )}
        </form>
      </section>

      {/* Security Section */}
      <section className="admin-profile-section card">
        <div className="admin-section-heading">
          <div className="admin-section-title-icon">
            <div className="admin-section-icon admin-security-icon">
              <i className="bi bi-shield-lock" />
            </div>

            <div>
              <h3>Security</h3>
              <p>Protect your administrator account with a strong password.</p>
            </div>
          </div>

          {!changingPassword && (
            <button
              type="button"
              className="admin-profile-btn"
              onClick={() => {
                setError("");
                setMessage("");
                setChangingPassword(true);
              }}
            >
              <i className="bi bi-key me-2" />
              Change Password
            </button>
          )}
        </div>

        {!changingPassword ? (
          <div className="admin-security-info">
            <div className="admin-security-info-icon">
              <i className="bi bi-lock-fill" />
            </div>

            <div>
              <h4>Password Protection</h4>

              <p>
                Change your password periodically and never share it with
                anyone. Use at least 8 characters.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="admin-profile-field">
                  <label htmlFor="admin-old-password">
                    Current Password
                  </label>

                  <div className="admin-input-wrapper">
                    <i className="bi bi-lock" />

                    <input
                      id="admin-old-password"
                      type="password"
                      name="old_password"
                      className="form-control"
                      placeholder="Enter current password"
                      value={passwords.old_password}
                      onChange={handlePasswordChange}
                      autoComplete="current-password"
                      disabled={saving}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="admin-profile-field">
                  <label htmlFor="admin-new-password">
                    New Password
                  </label>

                  <div className="admin-input-wrapper">
                    <i className="bi bi-key" />

                    <input
                      id="admin-new-password"
                      type="password"
                      name="new_password"
                      className="form-control"
                      placeholder="Enter new password"
                      value={passwords.new_password}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                      minLength={8}
                      disabled={saving}
                      required
                    />
                  </div>

                  <small className="admin-field-help">
                    Minimum 8 characters.
                  </small>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="admin-profile-field">
                  <label htmlFor="admin-confirm-password">
                    Confirm New Password
                  </label>

                  <div className="admin-input-wrapper">
                    <i className="bi bi-shield-check" />

                    <input
                      id="admin-confirm-password"
                      type="password"
                      name="confirm_password"
                      className="form-control"
                      placeholder="Confirm new password"
                      value={passwords.confirm_password}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                      minLength={8}
                      disabled={saving}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-profile-actions">
              <button
                type="submit"
                className="admin-profile-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check me-2" />
                    Update Password
                  </>
                )}
              </button>

              <button
                type="button"
                className="admin-profile-cancel"
                disabled={saving}
                onClick={() => {
                  setChangingPassword(false);
                  setPasswords({ ...initialPasswords });
                  setError("");
                  setMessage("");
                }}
              >
                <i className="bi bi-x-circle me-2" />
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Footer */}
      <div className="admin-profile-footer">
        <i className="bi bi-shield-check me-2" />
        Your administrator account information is protected.
      </div>
    </div>
  );
};

export default AdminMyProfile;
