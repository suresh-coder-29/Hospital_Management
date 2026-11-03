import React from "react";
import {BrowserRouter,Routes,Route,Navigate} from "react-router-dom";

import Register from "./Components/Register";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import MyAppointments from "./Components/MyAppoinments";
import PatientBookAppointment from "./Components/PatientBookAppointment";
import Chatbox from "./Components/Chatbox";
import DoctorEmergencyRequests from "./Components/DoctorEmergencyRequests";
import MyPatients from "./Components/MyPatients";
import DoctorMyProfile from "./Components/DoctorProfile";
import DoctorDashboard from "./Components/DoctorDashboard";
import PatientMyProfile from "./Components/PatientMyProfile";
import PatientMedicalHistory from "./Components/PatientMedicalHistory";
import DoctorConsultation from "./Components/DoctorConsultation";
import PatientMyAppointments from "./Components/PatientMyAppointments";
import FindDoctors from "./Components/FindDoctors";
import PatientDashboard from "./Components/PatientDashboard";
import ManageDoctors from "./Components/ManageDoctors";
import ManagePatients from "./Components/ManagePatients";
import MyDoctorAppointments from "./Components/MyDoctorAppointments";
import AdminMyProfile from "./Components/AdminMyProfile";
import AdminDashboard from "./Components/AdminDashboard";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/register" replace />}/>
                <Route path="/register" element={<Register />}/>
                <Route path="/login" element={<Login />}/>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/Appointments" element={<MyAppointments />} />
                <Route path="/BookAppointment" element={<PatientBookAppointment />} />
                <Route path="/chat" element={<Chatbox />} />
                <Route path="/emergency" element={<DoctorEmergencyRequests />} />
                <Route path="/My_patients" element={<MyPatients />} />
                <Route path="/Profile" element={<DoctorMyProfile />} />
                <Route path="/Dashboard" element={<DoctorDashboard />} />
                <Route path="/PatientProfile" element={<PatientMyProfile />} />
                <Route path="/PatientAppointments" element={<PatientMyAppointments />} />
                <Route path="/FindDoctors" element={<FindDoctors />} />
                <Route path="/PatientDashboard" element={<PatientDashboard />} />
                <Route path="/ManageDoctors" element={<ManageDoctors />} />
                <Route path="/ManagePatients" element={<ManagePatients />} />
                <Route path="/AdminAppointments" element={<MyDoctorAppointments />} />
                <Route path="/AdminProfile" element={<AdminMyProfile />} />
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
            
                {/* <Route path="/Medical_History" element={<PatientMedicalHistory />} /> */}
                {/* <Route path="/doctor/appointments/:appointmentId/consultation" element={<DoctorConsultation />} /> */}

            </Routes>
        </BrowserRouter>
    );
}

export default App;