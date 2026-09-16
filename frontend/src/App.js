import React, { useState } from "react";
import "./App.css";

// Pages / Components
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import BeneficiaryForm from "./BeneficiaryForm";
import CampForm from "./CampForm";
import ViewCamps from "./ViewCamps";
import ResourceForm from "./ResourceForm";
import DistributionForm from "./DistributionForm";

function App() {

  // ==========================================
  // LOGIN STATE
  // ==========================================

  const [loggedIn, setLoggedIn] = useState(false);

  // ==========================================
  // CURRENT PAGE
  // ==========================================

  const [page, setPage] = useState("dashboard");

  // ==========================================
  // MENU
  // ==========================================

  const [menuOpen, setMenuOpen] = useState(false);

  // ==========================================
  // DARK MODE
  // ==========================================

  const [darkMode, setDarkMode] = useState(false);

  // ==========================================
  // SIGNUP PAGE
  // ==========================================

  const [showSignup, setShowSignup] = useState(false);


  // ==========================================
  // LOGIN SUCCESS
  // ==========================================

  const handleLoginSuccess = () => {

    setLoggedIn(true);
    setPage("dashboard");
    setMenuOpen(false);
    setShowSignup(false);

  };


  // ==========================================
  // SIGN OUT
  // ==========================================

  const signOut = () => {

    setLoggedIn(false);

    setPage("dashboard");

    setMenuOpen(false);

    setShowSignup(false);

    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");

    sessionStorage.removeItem("loggedIn");
    sessionStorage.removeItem("userEmail");

    alert("Signed Out Successfully");

  };


  // ==========================================
  // IF USER IS NOT LOGGED IN
  // ==========================================

  if (!loggedIn) {

    // ========================================
    // SIGNUP PAGE
    // ========================================

    if (showSignup) {

      return (
        <Signup
          setLoggedIn={setLoggedIn}
          setShowSignup={setShowSignup}
        />
      );

    }


    // ========================================
    // LOGIN PAGE
    // ========================================

    return (
      <Login
        setLoggedIn={handleLoginSuccess}
        setShowSignup={setShowSignup}
      />
    );

  }


  // ==========================================
  // LOGGED-IN APPLICATION
  // ==========================================

  return (

    <div
      className={
        darkMode
          ? "dark app-container"
          : "light app-container"
      }
    >

      {/* ======================================
          TOP HEADER
      ====================================== */}

      <div className="topbar">


        {/* ====================================
            LOGO
        ==================================== */}

        <div
          className="logo"
          onClick={() => {

            setPage("dashboard");
            setMenuOpen(false);

          }}
        >
          🌊 Disaster Verification & Distribution System
        </div>


        {/* ====================================
            HAMBURGER MENU
        ==================================== */}

        <div
          className="menu-icon"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
        >
          ☰
        </div>


        {/* ====================================
            DROPDOWN MENU
        ==================================== */}

        {menuOpen && (

          <div className="dropdown">


            {/* DASHBOARD */}

            <div
              className="dropdown-item"
              onClick={() => {

                setPage("dashboard");
                setMenuOpen(false);

              }}
            >
              🏠 Dashboard
            </div>


            {/* DARK / LIGHT MODE */}

            <div
              className="dropdown-item"
              onClick={() => {

                setDarkMode(!darkMode);
                setMenuOpen(false);

              }}
            >

              {darkMode
                ? "☀️ Light Mode"
                : "🌙 Dark Mode"}

            </div>


            {/* SIGN OUT */}

            <div
              className="dropdown-item"
              onClick={signOut}
            >
              🚪 Sign Out
            </div>

          </div>

        )}

      </div>


      {/* ======================================
          DASHBOARD
      ====================================== */}

      {page === "dashboard" && (

        <Dashboard
          setPage={setPage}
        />

      )}


      {/* ======================================
          BENEFICIARIES
      ====================================== */}

      {page === "beneficiaries" && (

        <BeneficiaryForm />

      )}


      {/* ======================================
          CAMPS
      ====================================== */}

      {page === "camps" && (

        <>

          <CampForm />

          <ViewCamps />

        </>

      )}


      {/* ======================================
          RESOURCES
      ====================================== */}

      {page === "resources" && (

        <ResourceForm />

      )}


      {/* ======================================
          DISTRIBUTION
      ====================================== */}

      {page === "distribution" && (

        <DistributionForm />

      )}


      {/* ======================================
          EMERGENCY
      ====================================== */}

      {page === "emergency" && (

        <div className="coming-soon">

          <h2>
            🚨 Emergency Management
          </h2>

          <p>
            Emergency response module coming soon.
          </p>

          <button
            onClick={() => setPage("dashboard")}
          >
            ← Back to Dashboard
          </button>

        </div>

      )}


      {/* ======================================
          REPORTS
      ====================================== */}

      {page === "reports" && (

        <div className="coming-soon">

          <h2>
            📊 Disaster Reports
          </h2>

          <p>
            Reports and analytics module coming soon.
          </p>

          <button
            onClick={() => setPage("dashboard")}
          >
            ← Back to Dashboard
          </button>

        </div>

      )}

    </div>

  );

}

export default App;