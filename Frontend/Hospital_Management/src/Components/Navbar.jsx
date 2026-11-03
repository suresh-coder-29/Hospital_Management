
import React from "react";
import "./Navbar.css";

function Navbar({ role }) {
    return (
        <nav className="navbar hospital-navbar px-3 px-md-4 py-3">

            <div className="container-fluid p-0">

                <h2 className="navbar-title mb-0">
                    <i className="bi bi-hospital me-2"></i>
                    Hospital Management
                </h2>

                <div className="navbar-right d-flex align-items-center gap-2 gap-md-3">

                    <span className="navbar-role">
                        <i className="bi bi-person-circle me-2"></i>
                        {role}
                    </span>

                    <button
                        type="button"
                        className="btn navbar-logout-btn"
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = "/login";
                        }}
                    >
                        <i className="bi bi-box-arrow-right me-1"></i>
                        <span>Logout</span>
                    </button>

                </div>

            </div>

        </nav>
    );
}

export default Navbar;
