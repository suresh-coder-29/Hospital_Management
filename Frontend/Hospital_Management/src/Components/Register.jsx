
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../Services/Api";
import "./Register.css";


const Register = () => {
    const navigate = useNavigate();

    const [role, setRole] = useState("PATIENT");

    const [form, setForm] = useState({
        username: "",
        email: "",
        phone_number: "",
        date_of_birth: "",
        gender: "",
        blood_group: "",
        address: "",
        emergency_contact_name: "",
        emergency_contact_number: "",
        qualification: "",
        specialization: "",
        experience_years: "",
        medical_license_number: "",
        consultation_fee: "",
        profile_image: null,
        medical_certificate: null,
        password: "",
        confirm_password: ""
    });

    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Input values change
    const handleChange = (e) => {
        const { name, value, files } = e.target;

        setForm({
            ...form,
            [name]: files ? files[0] : value
        });

        setErrors({
            ...errors,
            [name]: ""
        });
    };

    // Patient / Doctor button
    const handleRole = (selectedRole) => {
        setRole(selectedRole);
        setMessage("");
        setErrors({});
    };

    // Register form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setErrors({});

        if (form.password !== form.confirm_password) {
            setErrors({
                confirm_password: ["Password does not match"]
            });
            return;
        }

        const data = new FormData();

        // Common fields
        data.append("username", form.username);
        data.append("email", form.email);
        data.append("phone_number", form.phone_number);
        data.append("date_of_birth", form.date_of_birth);
        data.append("gender", form.gender);
        data.append("address", form.address);
        data.append("password", form.password);
        data.append("confirm_password", form.confirm_password);

        if (form.profile_image) {
            data.append("profile_image", form.profile_image);
        }

        // Patient fields
        if (role === "PATIENT") {
            data.append("blood_group", form.blood_group);
            data.append("emergency_contact_name", form.emergency_contact_name);
            data.append("emergency_contact_number", form.emergency_contact_number);
        }

        // Doctor fields
        if (role === "DOCTOR") {
            data.append("qualification", form.qualification);
            data.append("specialization", form.specialization);
            data.append("experience_years", form.experience_years);
            data.append("medical_license_number", form.medical_license_number);
            data.append("consultation_fee", form.consultation_fee);

            if (form.medical_certificate) {
                data.append("medical_certificate", form.medical_certificate);
            }
        }

        // API endpoint
        const url =
            role === "PATIENT"
                ? "patients/register/"
                : "doctors/register/";

        try {
            setLoading(true);

            await API.post(url, data);

            navigate("/login", {
                state: {
                    message:
                        role === "DOCTOR"
                            ? "Doctor registration successful. Waiting for admin approval."
                            : "Patient registration successful. Please login."
                }
            });

        } catch (error) {
            const response = error.response?.data;

            if (response) {
                setErrors(response);
            } else {
                setMessage("Server connection failed");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-container">

                <h1>Hospital Management</h1>
                <p>Create Your Account</p>

                {/* Role buttons */}
                <div className="role-buttons">

                    <button
                        type="button"
                        className={role === "PATIENT" ? "active" : ""}
                        onClick={() => handleRole("PATIENT")}
                    >
                        Patient
                    </button>

                    <button
                        type="button"
                        className={role === "DOCTOR" ? "active" : ""}
                        onClick={() => handleRole("DOCTOR")}
                    >
                        Doctor
                    </button>

                </div>

                <form onSubmit={handleSubmit}>

                    <h2>
                        {role === "PATIENT"
                            ? "Patient Registration"
                            : "Doctor Registration"}
                    </h2>

                    {message && <p className="error-message">{message}</p>}

                    {/* Common fields */}
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                    {errors.username && <small>{errors.username[0]}</small>}

                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    {errors.email && <small>{errors.email[0]}</small>}

                    <label>Phone Number</label>
                    <input
                        type="tel"
                        name="phone_number"
                        value={form.phone_number}
                        onChange={handleChange}
                        required
                    />
                    {errors.phone_number && <small>{errors.phone_number[0]}</small>}

                    <label>Date of Birth</label>
                    <input
                        type="date"
                        name="date_of_birth"
                        value={form.date_of_birth}
                        onChange={handleChange}
                        required
                    />

                    <label>Gender</label>
                    <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                    </select>

                    <label>Address</label>
                    <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        required
                    />

                    {/* Patient fields */}
                    {role === "PATIENT" && (
                        <>
                            <label>Blood Group</label>
                            <select
                                name="blood_group"
                                value={form.blood_group}
                                onChange={handleChange}
                            >
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>

                            <label>Emergency Contact Name</label>
                            <input
                                type="text"
                                name="emergency_contact_name"
                                value={form.emergency_contact_name}
                                onChange={handleChange}
                                required
                            />

                            <label>Emergency Contact Number</label>
                            <input
                                type="tel"
                                name="emergency_contact_number"
                                value={form.emergency_contact_number}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}

                    {/* Doctor fields */}
                    {role === "DOCTOR" && (
                        <>
                            <label>Qualification</label>
                            <input
                                type="text"
                                name="qualification"
                                value={form.qualification}
                                onChange={handleChange}
                                required
                            />

                           <label>Doctor Specialization</label>

                            <select
                                name="specialization"
                                value={form.specialization}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Specialization</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Neurology">Neurology</option>
                                <option value="Dermatology">Dermatology</option>
                                <option value="Orthopedics">Orthopedics</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="Gynecology">Gynecology</option>
                                <option value="General Medicine">General Medicine</option>
                            </select>
                            
                            {errors.specialization && (
                                <small>{errors.specialization[0]}</small>
                            )}
                            
                            <label>Experience (Years)</label>
                            <input
                                type="number"
                                name="experience_years"
                                value={form.experience_years}
                                onChange={handleChange}
                                min="0"
                                required
                            />

                            <label>Medical License Number</label>
                            <input
                                type="text"
                                name="medical_license_number"
                                value={form.medical_license_number}
                                onChange={handleChange}
                                required
                            />

                            <label>Consultation Fee</label>
                            <input
                                type="number"
                                name="consultation_fee"
                                value={form.consultation_fee}
                                onChange={handleChange}
                                min="0"
                                required
                            />

                            <label>Medical Certificate</label>
                            <input
                                type="file"
                                name="medical_certificate"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleChange}
                            />
                        </>
                    )}

                    {/* Common image */}
                    <label>Profile Image</label>
                    <input
                        type="file"
                        name="profile_image"
                        accept="image/*"
                        onChange={handleChange}
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <label>Confirm Password</label>
                    <input
                        type="password"
                        name="confirm_password"
                        value={form.confirm_password}
                        onChange={handleChange}
                        required
                    />
                    {errors.confirm_password && (
                        <small>{errors.confirm_password[0]}</small>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>

                    <p className="login-link">
                        Already have an account?
                        <Link to="/login"> Login</Link>
                    </p>

                </form>
            </div>
        </div>
    );
};

export default Register;
