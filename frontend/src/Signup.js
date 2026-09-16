import React, { useState } from "react";
import "./Signup.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Signup({ setShowSignup }) {

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);


  // ==========================================
  // CREATE ACCOUNT
  // ==========================================

  const handleSignup = async (e) => {

    e.preventDefault();

    // Check fields
    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill all the fields");
      return;
    }


    // Check password
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }


    // Check password length
    if (password.length < 6) {
      alert("Password must contain at least 6 characters");
      return;
    }


    // Check terms
    if (!agree) {
      alert("Please agree to the Terms & Conditions");
      return;
    }


    setLoading(true);


    try {

      const response = await fetch(
        "http://127.0.0.1:5000/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            full_name: fullName,
            email: email,
            phone: phone,
            password: password
          })
        }
      );


      const data = await response.json();


      if (data.status) {

        alert("Account created successfully! Please sign in.");

        // Clear fields
        setFullName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");
        setAgree(false);

        // Go back to login
        setShowSignup(false);

      } else {

        alert(data.message);

      }

    } catch (error) {

      console.error("Signup Error:", error);

      alert(
        "Unable to connect to server. Make sure Flask is running."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="signup-page">

      <div className="signup-container">


        {/* =========================================
            LEFT IMAGE SECTION
        ========================================= */}

        <div className="signup-left">

          <img
            src="/disaster2.jpg"
            alt="Disaster Management"
            className="signup-image"
          />


          <div className="signup-overlay">


            {/* BRAND */}

            <div className="signup-brand">

              <span>🌊</span>

              <span>
                DISASTER
              </span>

            </div>


            {/* TITLE */}

            <h2>
              Protect Our Planet.
            </h2>


            <h3>
              Prepare. Protect. Recover.
            </h3>


            {/* DESCRIPTION */}

            <p>
              Join our disaster management platform
              and help build safer and stronger
              communities.
            </p>


            {/* FEATURES */}

            <div className="signup-feature-box">


              <div className="signup-feature">

                <span>🚨</span>

                <small>
                  ALERT
                </small>

              </div>


              <div className="signup-feature">

                <span>🛡️</span>

                <small>
                  VERIFY
                </small>

              </div>


              <div className="signup-feature">

                <span>🤝</span>

                <small>
                  RESPOND
                </small>

              </div>


              <div className="signup-feature">

                <span>💙</span>

                <small>
                  RECOVER
                </small>

              </div>


            </div>


          </div>

        </div>



        {/* =========================================
            RIGHT SIGNUP SECTION
        ========================================= */}

        <div className="signup-right">


          <div className="signup-card">


            {/* LOGO */}

            <div className="signup-logo">
              🌍
            </div>


            {/* TITLE */}

            <h1>
              Create Account
            </h1>


            <h3>
              Join the Disaster Management System
            </h3>


            <p className="signup-text">
              Create your account to access the platform
            </p>



            {/* =====================================
                FORM
            ===================================== */}

            <form onSubmit={handleSignup}>


              {/* FULL NAME */}

              <label>
                Full Name
              </label>


              <div className="signup-input-box">

                <span className="signup-input-icon">
                  👤
                </span>


                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  required
                />

              </div>



              {/* EMAIL */}

              <label>
                Email Address
              </label>


              <div className="signup-input-box">

                <span className="signup-input-icon">
                  ✉️
                </span>


                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />

              </div>



              {/* PHONE */}

              <label>
                Phone Number
              </label>


              <div className="signup-input-box">

                <span className="signup-input-icon">
                  📱
                </span>


                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  required
                />

              </div>



              {/* PASSWORD */}

              <label>
                Password
              </label>


              <div className="signup-input-box">

                <span className="signup-input-icon">
                  🔒
                </span>


                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />


                <span
                  className="signup-eye"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >

                  {showPassword
                    ? <FaEyeSlash />
                    : <FaEye />
                  }

                </span>

              </div>



              {/* CONFIRM PASSWORD */}

              <label>
                Confirm Password
              </label>


              <div className="signup-input-box">

                <span className="signup-input-icon">
                  🔒
                </span>


                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                />


                <span
                  className="signup-eye"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >

                  {showConfirmPassword
                    ? <FaEyeSlash />
                    : <FaEye />
                  }

                </span>

              </div>



              {/* TERMS */}

              <label className="signup-terms">

                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) =>
                    setAgree(e.target.checked)
                  }
                />

                <span>
                  I agree to the Terms & Conditions
                </span>

              </label>



              {/* CREATE ACCOUNT */}

              <button
                type="submit"
                className="signup-btn"
                disabled={loading}
              >

                {loading
                  ? "Creating Account..."
                  : "Create Account →"
                }

              </button>


            </form>



            {/* =====================================
                SIGN IN
            ===================================== */}

            <p className="signin-link">

              Already have an account?

              <span
                onClick={() =>
                  setShowSignup(false)
                }
              >
                Sign In
              </span>

            </p>


          </div>

        </div>

      </div>

    </div>

  );

}

export default Signup;