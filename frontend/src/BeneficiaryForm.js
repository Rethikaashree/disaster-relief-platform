import React, { useState } from "react";
import "./BeneficiaryForm.css";

function BeneficiaryForm() {

  const [formData, setFormData] = useState({
    full_name: "",
    aadhaar_number: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
    family_members: "",
    camp_name: ""
  });

  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [beneficiaryId, setBeneficiaryId] = useState("");

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // If Aadhaar is changed after verification,
    // verification becomes invalid again.
    if (name === "aadhaar_number") {
      setAadhaarVerified(false);
      setBeneficiaryId("");
    }
  };


  // ==========================================
  // VERIFY AADHAAR
  // ==========================================

  const verifyAadhaar = async () => {

    const aadhaar = formData.aadhaar_number.trim();

    if (!/^\d{12}$/.test(aadhaar)) {
      alert("Please enter a valid 12-digit Aadhaar number.");
      setAadhaarVerified(false);
      return;
    }

    setVerifying(true);

    try {

      const response = await fetch(
        "http://127.0.0.1:5000/verifyaadhaar",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            aadhaar_number: aadhaar
          })
        }
      );

      const data = await response.json();

      console.log("AADHAAR RESPONSE:", data);

      if (
        response.ok &&
        (
          data.success === true ||
          data.status === true
        )
      ) {

        setAadhaarVerified(true);

        alert(
          data.message ||
          "Aadhaar Verified Successfully"
        );

      } else {

        setAadhaarVerified(false);

        alert(
          data.message ||
          "Aadhaar verification failed"
        );

      }

    } catch (error) {

      console.error(
        "AADHAAR ERROR:",
        error
      );

      setAadhaarVerified(false);

      alert(
        "Unable to connect to Flask server. Make sure Flask is running."
      );

    } finally {

      setVerifying(false);

    }

  };


  // ==========================================
  // REGISTER BENEFICIARY
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    // ------------------------------------------
    // REQUIRED FIELDS
    // ------------------------------------------

    if (!formData.full_name.trim()) {
      alert("Full Name is required.");
      return;
    }

    if (!formData.aadhaar_number.trim()) {
      alert("Aadhaar Number is required.");
      return;
    }

    if (!formData.age) {
      alert("Age is required.");
      return;
    }

    if (!formData.gender) {
      alert("Gender is required.");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Phone Number is required.");
      return;
    }

    if (!formData.address.trim()) {
      alert("Address is required.");
      return;
    }

    // ------------------------------------------
    // AADHAAR VERIFICATION
    // ------------------------------------------

    if (!aadhaarVerified) {

      alert(
        "Please verify Aadhaar before registering the beneficiary."
      );

      return;
    }

    setRegistering(true);

    try {

      const response = await fetch(
        "http://127.0.0.1:5000/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            full_name: formData.full_name.trim(),

            aadhaar_number:
              formData.aadhaar_number.trim(),

            age: Number(formData.age),

            gender: formData.gender,

            phone: formData.phone.trim(),

            address: formData.address.trim(),

            family_members:
              formData.family_members
                ? Number(formData.family_members)
                : 1,

            camp_name:
              formData.camp_name.trim()
          })
        }
      );

      const data = await response.json();

      console.log(
        "BENEFICIARY REGISTRATION RESPONSE:",
        data
      );

      if (
        response.ok &&
        (
          data.success === true ||
          data.status === true
        )
      ) {

        // --------------------------------------
        // SAVE BENEFICIARY ID
        // --------------------------------------

        const newId =
          data.beneficiary_id ||
          data.id ||
          "";

        setBeneficiaryId(newId);

        alert(
          data.message ||
          "Beneficiary Registered Successfully"
        );

        // --------------------------------------
        // IMPORTANT:
        // Keep Aadhaar verified after successful
        // registration until form is cleared.
        // --------------------------------------

      } else {

        alert(
          data.message ||
          "Beneficiary registration failed"
        );

      }

    } catch (error) {

      console.error(
        "REGISTRATION ERROR:",
        error
      );

      alert(
        "Unable to connect to Flask server. Make sure Flask is running."
      );

    } finally {

      setRegistering(false);

    }

  };


  // ==========================================
  // CLEAR FORM
  // ==========================================

  const clearForm = () => {

    setFormData({
      full_name: "",
      aadhaar_number: "",
      age: "",
      gender: "",
      phone: "",
      address: "",
      family_members: "",
      camp_name: ""
    });

    setAadhaarVerified(false);
    setBeneficiaryId("");

  };


  return (

    <div className="beneficiary-page">

      <div className="beneficiary-card">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="beneficiary-header">

          <div>

            <h1>
              Register Beneficiary
            </h1>

            <p>
              Register and verify disaster relief beneficiaries
            </p>

          </div>

          <div className="beneficiary-icon">
            👤
          </div>

        </div>


        {/* ======================================
            FORM
        ====================================== */}

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            {/* FULL NAME */}

            <div className="form-group">

              <label>
                Full Name *
              </label>

              <input
                type="text"
                name="full_name"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={handleChange}
              />

            </div>


            {/* AADHAAR */}

            <div className="form-group">

              <label>
                Aadhaar Number *
              </label>

              <div className="aadhaar-row">

                <input
                  type="text"
                  name="aadhaar_number"
                  placeholder="Enter 12-digit Aadhaar"
                  value={formData.aadhaar_number}
                  onChange={handleChange}
                  maxLength="12"
                  inputMode="numeric"
                />

                <button
                  type="button"
                  className={
                    aadhaarVerified
                      ? "verify-btn verified"
                      : "verify-btn"
                  }
                  onClick={verifyAadhaar}
                  disabled={
                    verifying ||
                    aadhaarVerified
                  }
                >

                  {verifying
                    ? "Verifying..."
                    : aadhaarVerified
                    ? "✓ Verified"
                    : "Verify Aadhaar"}

                </button>

              </div>

              {aadhaarVerified && (

                <div className="verified-message">
                  ✓ Aadhaar verified successfully
                </div>

              )}

            </div>


            {/* AGE */}

            <div className="form-group">

              <label>
                Age *
              </label>

              <input
                type="number"
                name="age"
                placeholder="Enter age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
              />

            </div>


            {/* GENDER */}

            <div className="form-group">

              <label>
                Gender *
              </label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >

                <option value="">
                  Select gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>


            {/* PHONE */}

            <div className="form-group">

              <label>
                Phone Number *
              </label>

              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                maxLength="10"
              />

            </div>


            {/* FAMILY MEMBERS */}

            <div className="form-group">

              <label>
                Family Members
              </label>

              <input
                type="number"
                name="family_members"
                placeholder="Number of family members"
                value={formData.family_members}
                onChange={handleChange}
                min="1"
              />

            </div>


            {/* CAMP */}

            <div className="form-group">

              <label>
                Relief Camp
              </label>

              <input
                type="text"
                name="camp_name"
                placeholder="Enter relief camp name"
                value={formData.camp_name}
                onChange={handleChange}
              />

            </div>


            {/* ADDRESS */}

            <div className="form-group full-width">

              <label>
                Address *
              </label>

              <textarea
                name="address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={handleChange}
                rows="4"
              />

            </div>

          </div>


          {/* ======================================
              BENEFICIARY ID
          ====================================== */}

          {beneficiaryId && (

            <div className="beneficiary-success">

              <div className="success-icon">
                ✓
              </div>

              <div>

                <strong>
                  Beneficiary Registered Successfully
                </strong>

                <p>
                  Beneficiary ID:
                  <span>
                    {" "}
                    {beneficiaryId}
                  </span>
                </p>

              </div>

            </div>

          )}


          {/* ======================================
              BUTTONS
          ====================================== */}

          <div className="form-actions">

            <button
              type="button"
              className="clear-btn"
              onClick={clearForm}
            >
              Clear
            </button>

            <button
              type="submit"
              className="register-btn"
              disabled={registering}
            >

              {registering
                ? "Registering..."
                : "Register Beneficiary"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );
}

export default BeneficiaryForm;