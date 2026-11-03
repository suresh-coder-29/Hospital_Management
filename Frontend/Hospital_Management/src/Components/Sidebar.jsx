
import React, { useState } from "react";
import "./Sidebar.css";

function Sidebar({ role, setPage }) {
    const [activePage, setActivePage] = useState("Dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handlePage = (page) => {
        setActivePage(page);
        setPage(page);
        setSidebarOpen(false);
    };

    return (
        <>
            {/* Mobile / Tablet Toggle Button */}
            <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={sidebarOpen}
            >
                <i className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-list"}`}></i>
            </button>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

                <div className="sidebar-brand">
                    <i className="bi bi-hospital sidebar-brand-icon"></i>
                    <h2>Hospital Management</h2>
                </div>

                <h3 className="sidebar-menu-title">
                    <i className="bi bi-grid me-2"></i>
                    {role} MENU
                </h3>

                {role === "ADMIN" && (
                    <div className="sidebar-menu">
                        <p
                            className={activePage === "AdminDashboard" ? "active" : ""}
                            onClick={() => handlePage("AdminDashboard")}
                        >
                            <i className="bi bi-speedometer2"></i>
                            <span>Dashboard</span>
                        </p>

                        <p
                            className={activePage === "ManageDoctors" ? "active" : ""}
                            onClick={() => handlePage("ManageDoctors")}
                        >
                            <i className="bi bi-person-badge"></i>
                            <span>Manage Doctors</span>
                        </p>

                        <p
                            className={activePage === "ManagePatients" ? "active" : ""}
                            onClick={() => handlePage("ManagePatients")}
                        >
                            <i className="bi bi-people"></i>
                            <span>Manage Patients</span>
                        </p>

                        <p
                            className={activePage === "AdminAppointments" ? "active" : ""}
                            onClick={() => handlePage("AdminAppointments")}
                        >
                            <i className="bi bi-calendar-check"></i>
                            <span>Appointments</span>
                        </p>

                        <p
                            className={activePage === "AdminProfile" ? "active" : ""}
                            onClick={() => handlePage("AdminProfile")}
                        >
                            <i className="bi bi-person-circle"></i>
                            <span>Profile</span>
                        </p>
                    </div>
                )}

                {role === "DOCTOR" && (
                    <div className="sidebar-menu">
                        <p
                            className={activePage === "Dashboard" ? "active" : ""}
                            onClick={() => handlePage("Dashboard")}
                        >
                            <i className="bi bi-speedometer2"></i>
                            <span>Dashboard</span>
                        </p>

                        <p
                            className={activePage === "Appointments" ? "active" : ""}
                            onClick={() => handlePage("Appointments")}
                        >
                            <i className="bi bi-calendar-check"></i>
                            <span>My Appointments</span>
                        </p>

                        <p
                            className={activePage === "emergency" ? "active" : ""}
                            onClick={() => handlePage("emergency")}
                        >
                            <i className="bi bi-heart-pulse"></i>
                            <span>Emergency Request</span>
                        </p>

                        <p
                            className={activePage === "chat" ? "active" : ""}
                            onClick={() => handlePage("chat")}
                        >
                            <i className="bi bi-chat-dots"></i>
                            <span>Chatbox</span>
                        </p>

                        <p
                            className={activePage === "My_patients" ? "active" : ""}
                            onClick={() => handlePage("My_patients")}
                        >
                            <i className="bi bi-people"></i>
                            <span>My Patients</span>
                        </p>

                        <p
                            className={activePage === "Profile" ? "active" : ""}
                            onClick={() => handlePage("Profile")}
                        >
                            <i className="bi bi-person-circle"></i>
                            <span>Profile</span>
                        </p>
                    </div>
                )}

                {role === "PATIENT" && (
                    <div className="sidebar-menu">
                        <p
                            className={activePage === "PatientDashboard" ? "active" : ""}
                            onClick={() => handlePage("PatientDashboard")}
                        >
                            <i className="bi bi-speedometer2"></i>
                            <span>Dashboard</span>
                        </p>

                        <p
                            className={activePage === "FindDoctors" ? "active" : ""}
                            onClick={() => handlePage("FindDoctors")}
                        >
                            <i className="bi bi-search"></i>
                            <span>Find Doctors</span>
                        </p>

                        <p
                            className={activePage === "BookAppointment" ? "active" : ""}
                            onClick={() => handlePage("BookAppointment")}
                        >
                            <i className="bi bi-calendar-plus"></i>
                            <span>Book Appointment</span>
                        </p>

                        <p
                            className={activePage === "PatientAppointments" ? "active" : ""}
                            onClick={() => handlePage("PatientAppointments")}
                        >
                            <i className="bi bi-calendar-check"></i>
                            <span>My Appointments</span>
                        </p>

                        <p
                            className={activePage === "chat" ? "active" : ""}
                            onClick={() => handlePage("chat")}
                        >
                            <i className="bi bi-chat-dots"></i>
                            <span>Chatbox</span>
                        </p>

                        <p
                            className={activePage === "PatientProfile" ? "active" : ""}
                            onClick={() => handlePage("PatientProfile")}
                        >
                            <i className="bi bi-person-circle"></i>
                            <span>Profile</span>
                        </p>
                    </div>
                )}

                <div className="sidebar-footer">
                    <i className="bi bi-shield-check"></i>
                    <span>Healthcare Management</span>
                </div>

            </aside>
        </>
    );
}

export default Sidebar;
