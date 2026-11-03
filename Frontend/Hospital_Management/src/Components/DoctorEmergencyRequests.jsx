
import React, { useCallback, useEffect, useState } from "react";
import API from "../Services/Api";
import "./DoctorEmergencyRequests.css";

const DoctorEmergencyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);

    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Fetch emergency requests
    const fetchRequests = useCallback(async () => {
        try {
            const response = await API.get(
                "appointments/emergency/doctor/"
            );

            console.log("Emergency API response:", response.data);

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.results || [];

            setRequests(data);
            setError("");
        } catch (err) {
            console.error("Emergency API error:", err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                (err.response
                    ? `API error: ${err.response.status}`
                    : "Backend connection/CORS error. Django server check pannunga.")
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and automatic refresh
    useEffect(() => {
        fetchRequests();

        const timer = setInterval(() => {
            fetchRequests();
        }, 5000);

        return () => clearInterval(timer);
    }, [fetchRequests]);

    // Open/close full patient details
const handlePatientClick = (request) => {
    const requestId = request.emergency_id;

    if (!requestId) {
        setError("Emergency request ID missing.");
        return;
    }

    if (selectedRequestId === requestId) {
        setSelectedRequestId(null);
        setPatientDetails(null);
        setError("");
        return;
    }

    setSelectedRequestId(requestId);
    setPatientDetails(request);
    setDetailsLoading(false);
    setError("");

        try {
            /*
             * IMPORTANT:
             * Indha URL backend-la define pannirukkanum.
             * Unga actual detail endpoint different-aa irundha
             * adha use pannunga.
             */
            // const response = await API.get(
            //     `appointments/emergency/${requestId}/`
            // );

            console.log("Full patient details:", response.data);

            // API response nested-aa irundhaalum handle pannum
            const data =
                response.data?.patient_details ||
                response.data?.data ||
                response.data;

            setPatientDetails(data);
        } catch (err) {
            console.error("Patient details API error:", err);

            /*
             * Detail endpoint fail aana list API-la irukkura
             * details-ai display pannum.
             */
            setPatientDetails(request);

            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                (err.response
                    ? `Patient details API error: ${err.response.status}. List-la irukkura details mattum kaattappadum.`
                    : "Patient details load panna mudiyala.")
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    // Accept emergency request
    const acceptRequest = async (request) => {
        const requestId = request.emergency_id;

        if (!requestId) {
            setError("Emergency request ID missing.");
            return;
        }

        if (
            !window.confirm(
                "Indha emergency request-ai accept pannalama?"
            )
        ) {
            return;
        }

        setProcessingId(requestId);
        setError("");

        try {
            const response = await API.post(
                `appointments/emergency/${requestId}/accept/`,
                {}
            );

            alert(
                response.data?.message ||
                "Emergency request accepted successfully!"
            );

            await fetchRequests();
        } catch (err) {
            console.error("Accept emergency error:", err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                (err.response
                    ? `Accept failed: ${err.response.status}`
                    : "Backend connection error.")
            );
            
        } finally {
            setProcessingId(null);
        }
    };

    // Display missing values clearly
    const displayValue = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "Not provided";
        }

        return String(value);
    };

    // Loading screen
    if (loading) {
        return (
            <div className="emergency-page">
                <div className="emergency-loading">
                    <div className="emergency-spinner"></div>
                    <p>Loading emergency requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="emergency-page">
            {/* Page heading */}
            <div className="emergency-heading">
                <div>
                    <h2>Emergency Requests</h2>
                    <p>
                        Patients requiring urgent medical attention
                    </p>
                </div>

                <button
                    className="emergency-refresh"
                    onClick={fetchRequests}
                    type="button"
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="emergency-error" role="alert">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Close error"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Empty state */}
            {requests.length === 0 ? (
                <div className="emergency-empty">
                    <span className="emergency-empty-icon">
                        🚑
                    </span>

                    <h3>No Emergency Requests</h3>

                    <p>
                        New requests will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="emergency-grid">
                    {requests.map((request) => {
                        const requestId = request.emergency_id;
                        const isSelected =
                            selectedRequestId === requestId;

                        const isPending =
                            request.status === "PENDING";

                        return (
                            <article
                                className={`emergency-card ${
                                    isSelected ? "emergency-card-open" : ""
                                }`}
                                key={
                                    request.notification_id ??
                                    requestId
                                }
                            >
                                {/* Card header */}
                                <div className="emergency-card-top">
                                    <span className="emergency-badge">
                                        🚨 EMERGENCY
                                    </span>

                                    <span
                                        className={`emergency-status status-${(
                                            request.status || "unknown"
                                        ).toLowerCase()}`}
                                    >
                                        {request.status || "UNKNOWN"}
                                    </span>
                                </div>

                                {/* Clickable patient name */}
                                <button
                                    type="button"
                                    className="emergency-patient-name"
                                    onClick={() =>
                                        handlePatientClick(request)
                                    }
                                    aria-expanded={isSelected}
                                >
                                    <span className="patient-avatar">
                                        {(request.patient_name || "P")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>

                                    <span className="patient-name-text">
                                        <strong>
                                            {request.patient_name ||
                                                "Patient"}
                                        </strong>

                                        <small>
                                            {isSelected
                                                ? "Hide full details"
                                                : "Click to view full details"}
                                        </small>
                                    </span>

                                    <span className="patient-toggle">
                                        {isSelected ? "−" : "+"}
                                    </span>
                                </button>

                                {/* Basic emergency details */}
                                <div className="emergency-details">
                                    <p>
                                        <strong>Request ID:</strong>{" "}
                                        #{displayValue(requestId)}
                                    </p>

                                    <p>
                                        <strong>Specialization:</strong>{" "}
                                        {displayValue(
                                            request.specialization
                                        )}
                                    </p>

                                    <p>
                                        <strong>Date:</strong>{" "}
                                        {displayValue(
                                            request.appointment_date
                                        )}
                                    </p>

                                    <div className="emergency-reason">
                                        <strong>Emergency Reason</strong>
                                        <p>
                                            {request.reason ||
                                                "No reason provided"}
                                        </p>
                                    </div>
                                </div>

                                {/* Expandable patient details */}
                                {isSelected && (
                                    <section className="patient-full-details">
                                        <div className="patient-details-heading">
                                            <div>
                                                <h4>
                                                    Full Patient Details
                                                </h4>
                                                <p>
                                                    Emergency request information
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="patient-details-close"
                                                onClick={() => {
                                                    setSelectedRequestId(null);
                                                    setPatientDetails(null);
                                                    setError("");
                                                }}
                                                aria-label="Close patient details"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        {detailsLoading ? (
                                            <div className="details-loading">
                                                <div className="emergency-spinner"></div>
                                                <p>
                                                    Loading patient details...
                                                </p>
                                            </div>
                                        ) : patientDetails ? (
                                            <div className="patient-details-grid">
                                                <div className="patient-info-item">
                                                    <span>Patient Name</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.patient_name ||
                                                            patientDetails.name
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Patient ID</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.patient_id
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Phone Number</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.phone ||
                                                            patientDetails.phone_number ||
                                                            patientDetails.patient_phone
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Email</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.email ||
                                                            patientDetails.patient_email
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Age</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.age
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Gender</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.gender
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Specialization</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.specialization
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Appointment Date</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.appointment_date
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Appointment Time</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.appointment_time
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Priority</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.priority
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Request Status</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.status
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item">
                                                    <span>Address</span>
                                                    <strong>
                                                        {displayValue(
                                                            patientDetails.address ||
                                                            patientDetails.patient_address
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="patient-info-item patient-info-wide">
                                                    <span>Emergency Reason</span>
                                                    <p>
                                                        {displayValue(
                                                            patientDetails.reason
                                                        )}
                                                    </p>
                                                </div>

                                                {patientDetails.description && (
                                                    <div className="patient-info-item patient-info-wide">
                                                        <span>
                                                            Additional Information
                                                        </span>
                                                        <p>
                                                            {patientDetails.description}
                                                        </p>
                                                    </div>
                                                )}

                                                {patientDetails.medical_history && (
                                                    <div className="patient-info-item patient-info-wide">
                                                        <span>
                                                            Medical History
                                                        </span>
                                                        <p>
                                                            {patientDetails.medical_history}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p>
                                                Patient details unavailable.
                                            </p>
                                        )}
                                    </section>
                                )}

                                {/* Accept button */}
                                {isPending ? (
                                    <button
                                        type="button"
                                        className="emergency-accept"
                                        disabled={processingId !== null}
                                        onClick={() =>
                                            acceptRequest(request)
                                        }
                                    >
                                        {processingId === requestId
                                            ? "Accepting..."
                                            : "✓ Accept Request"}
                                    </button>
                                ) : (
                                    <p className="emergency-processed">
                                        This request has already been processed.
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DoctorEmergencyRequests;
