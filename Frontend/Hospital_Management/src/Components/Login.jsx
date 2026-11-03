
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../Services/Api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(
        location.state?.message || ""
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await API.post("accounts/login/", {
                email: email.trim(),
                password,
            });

            console.log("Login response:", response.data);

            const data = response.data;

            if (data.success && data.access) {
                // Save new JWT tokens
                localStorage.setItem("access", data.access);

                if (data.refresh) {
                    localStorage.setItem("refresh", data.refresh);
                } else {
                    localStorage.removeItem("refresh");
                }

                localStorage.setItem("role", data.role);
                localStorage.setItem("user_id", String(data.user_id));

                // Navigate after successful login
                navigate("/dashboard", { replace: true });
            } else {
                setMessage(
                    data.message || "Login failed. Please try again."
                );
            }
        } catch (error) {
            console.log("Status:", error.response.status);
                console.log("Error:", error.response.data);
            console.error(
                "Login error:",
                error.response?.data || error.message
            );

            setMessage(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Login failed. Please check your email and password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <h1>Welcome Back</h1>
                <p>Login to your hospital account</p>

                {message && (
                    <div className="login-message">
                        {message}
                    </div>
                )}

                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email"
                    autoComplete="email"
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    autoComplete="current-password"
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p>
                    Don't have an account?
                    <Link to="/register"> Register</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
