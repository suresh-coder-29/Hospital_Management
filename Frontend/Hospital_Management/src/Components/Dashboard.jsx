
import React, { useState } from "react";

import "./Dashboard.css";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MyAppointments from "./MyAppoinments";
import PatientBookAppointment from "./PatientBookAppointment";
import Chatbox from "./Chatbox";
import DoctorEmergencyRequests from "./DoctorEmergencyRequests";
import MyPatients from "./MyPatients";
import DoctorMyProfile from "./DoctorProfile";
import DoctorDashboard from "./DoctorDashboard";
import PatientMyProfile from "./PatientMyProfile";
import PatientMedicalHistory from "./PatientMedicalHistory";
import DoctorConsultation from "./DoctorConsultation";
import PatientMyAppointments from "./PatientMyAppointments";
import FindDoctors from "./FindDoctors";
import PatientDashboard from "./PatientDashboard";
import ManageDoctors from "./ManageDoctors";
import ManagePatients from "./ManagePatients";
import MyDoctorAppointments from "./MyDoctorAppointments";
import AdminMyProfile from "./AdminMyProfile";
import AdminDashboard from "./AdminDashboard";

function Dashboard() {
    const role = localStorage.getItem("role");

    const [page, setPage] = useState(
        role === "PATIENT"
            ? "PatientDashboard"
            : role === "ADMIN"
                ? "AdminDashboard"
                : "Dashboard"
    );

    return (
        <div className="hospital-dashboard-layout">
            {/* Navbar */}
            <Navbar role={role} />

            {/* Sidebar */}
            <Sidebar
                role={role}
                setPage={setPage}
            />

            {/* Main Content */}
            <main className="dashboard-content">

                {/* DOCTOR PAGES */}
                {role === "DOCTOR" && page === "Dashboard" && (
                    <DoctorDashboard setPage={setPage}/>
                )}

                {role === "DOCTOR" && page === "Appointments" && (
                    <MyAppointments />
                )}

                {role === "DOCTOR" && page === "Consultation" && (
                    <DoctorConsultation />
                )}

                {role === "DOCTOR" && page === "chat" && (
                    <Chatbox role="DOCTOR" />
                )}

                {role === "DOCTOR" && page === "emergency" && (
                    <DoctorEmergencyRequests />
                )}

                {role === "DOCTOR" && page === "My_patients" && (
                    <MyPatients />
                )}

                {role === "DOCTOR" && page === "Profile" && (
                    <DoctorMyProfile />
                )}

                {/* PATIENT PAGES */}
                {role === "PATIENT" && page === "PatientDashboard" && (
                    <PatientDashboard setPage={setPage} />
                )}

                {role === "PATIENT" && page === "FindDoctors" && (
                    <FindDoctors />
                )}

                {role === "PATIENT" && page === "BookAppointment" && (
                    <PatientBookAppointment/>
                )}

                {role === "PATIENT" && page === "PatientAppointments" && (
                    <PatientMyAppointments/>
                )}

                {role === "PATIENT" && page === "Medical_History" && (
                    <PatientMedicalHistory />
                )}

                {role === "PATIENT" && page === "chat" && (
                    <Chatbox role="PATIENT" />
                )}

                {role === "PATIENT" && page === "PatientProfile" && (
                    <PatientMyProfile/>
                )}

                {/* ADMIN PAGES */}
                {role === "ADMIN" && page === "AdminDashboard" && (
                 <AdminDashboard setPage={setPage} />
                )}

                {role === "ADMIN" && page === "ManageDoctors" && (
                    <ManageDoctors />
                )}

                {role === "ADMIN" && page === "ManagePatients" && (
                    <ManagePatients />
                )}

                {role === "ADMIN" && page === "AdminAppointments" && (
                    <MyDoctorAppointments />
                )}

                {role === "ADMIN" && page === "AdminProfile" && (
                    <AdminMyProfile />
                )}

            </main>
        </div>
    );
}

export default Dashboard;
