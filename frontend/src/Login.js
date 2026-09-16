import React, { useState } from "react";
import "./Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login({ setLoggedIn, setShowSignup }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {

    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {

      const response = await fetch(
        "http://127.0.0.1:5000/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password
          })
        }
      );

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      // ==========================================
      // LOGIN SUCCESS
      // ==========================================

      if (
        response.ok &&
        (
          data.status === true ||
          data.status === "success" ||
          data.success === true
        )
      ) {

        // Save user information
        if (data.user) {

          localStorage.setItem(
            "user",
            JSON.stringify(data.user)
          );

        }

        // Remember login
        if (remember) {

          localStorage.setItem(
            "rememberMe",
            "true"
          );

        } else {

          localStorage.removeItem(
            "rememberMe"
          );

        }

        // Close signup
        setShowSignup(false);

        // ========================================
        // GO TO DASHBOARD
        // ========================================

        setLoggedIn(true);

      } else {

        alert(
          data.message ||
          "Invalid email or password"
        );

      }

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      alert(
        "Unable to connect to Flask server. Make sure Flask is running."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="login-container">

      {/* ==========================================
          LEFT SIDE
      ========================================== */}

      <div className="login-left">

        <img
          src="/disaster.jpg"
          alt="Disaster Management"
          className="login-image"
        />

        <div className="image-overlay">

          <div className="brand">
            🌊
            <span>DISASTER</span>
          </div>

          <h2>
            Prepare. Protect. Recover.
          </h2>

          <p>
            Smart disaster verification and relief
            distribution for safer communities.
          </p>

          <div className="feature-box">

            <div>
              <span>🚨</span>
              <small>ALERT</small>
            </div>

            <div>
              <span>🛡️</span>
              <small>VERIFY</small>
            </div>

            <div>
              <span>🤝</span>
              <small>RESPOND</small>
            </div>

            <div>
              <span>💙</span>
              <small>RECOVER</small>
            </div>

          </div>

        </div>

      </div>


      {/* ==========================================
          RIGHT SIDE
      ========================================== */}

      <div className="login-right">

        <div className="login-card">

          <div className="login-logo">
            🌍
          </div>

          <h1>
            Disaster Verification
          </h1>

          <h3>
            & Distribution System
          </h3>

          <p className="login-text">
            Together we prepare. Together we protect.
          </p>


          {/* ========================================
              LOGIN FORM
          ======================================== */}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}

            <label>
              Email Address
            </label>

            <div className="input-box">

              <span className="input-icon">
                ✉️
              </span>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                required
              />

            </div>


            {/* PASSWORD */}

            <label>
              Password
            </label>

            <div className="input-box">

              <span className="input-icon">
                🔒
              </span>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                required
              />

              <span
                className="eye"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >

                {showPassword
                  ? <FaEyeSlash />
                  : <FaEye />}

              </span>

            </div>


            {/* ========================================
                OPTIONS
            ======================================== */}

            <div className="login-options">

              <label className="remember">

                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) =>
                    setRemember(
                      e.target.checked
                    )
                  }
                />

                <span>
                  Remember Me
                </span>

              </label>

              <span className="forgot">
                Forgot Password?
              </span>

            </div>


            {/* ========================================
                SIGN IN BUTTON
            ======================================== */}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >

              {loading
                ? "Signing In..."
                : "Sign In →"}

            </button>

          </form>


          {/* ==========================================
              OR
          ========================================== */}

          <div className="or-section">

            <span></span>

            <p>
              OR
            </p>

            <span></span>

          </div>


          {/* ==========================================
              GOOGLE
          ========================================== */}

          <button
            type="button"
            className="google-btn"
          >

            🌐

            <span>
              Continue with Google
            </span>

          </button>


          {/* ==========================================
              MICROSOFT
          ========================================== */}

          <button
            type="button"
            className="microsoft-btn"
          >

            🪟

            <span>
              Continue with Microsoft
            </span>

          </button>


          {/* ==========================================
              CREATE ACCOUNT
          ========================================== */}

          <p className="create-account">

            Don't have an account?

            <span
              onClick={() =>
                setShowSignup(true)
              }
            >
              {" "}Create Account
            </span>

          </p>

        </div>

      </div>

    </div>

  );
}

export default Login;