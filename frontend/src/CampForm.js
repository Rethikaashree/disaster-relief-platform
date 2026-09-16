import React, { useEffect, useState } from "react";
import "./CampForm.css";

function CampForm() {

  const [campName, setCampName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [availableResources, setAvailableResources] = useState("");

  const [camps, setCamps] = useState([]);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // LOAD CAMPS
  // ==========================================

  const loadCamps = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:5000/getcamps"
      );

      const data = await response.json();

      console.log("CAMPS:", data);

      if (
        response.ok &&
        (
          data.success === true ||
          data.status === true
        )
      ) {

        setCamps(data.camps || []);

      } else {

        alert(
          data.message ||
          "Unable to load camps"
        );

      }

    } catch (error) {

      console.error("GET CAMPS ERROR:", error);

      alert(
        "Unable to connect to Flask server."
      );

    }

  };


  // ==========================================
  // LOAD CAMPS WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {

    loadCamps();

  }, []);


  // ==========================================
  // ADD CAMP
  // ==========================================

  const handleAddCamp = async (e) => {

    e.preventDefault();

    if (!campName.trim()) {

      alert("Camp Name is required");

      return;
    }

    if (!location.trim()) {

      alert("Location is required");

      return;
    }

    if (!capacity) {

      alert("Capacity is required");

      return;
    }

    setLoading(true);

    try {

      const response = await fetch(
        "http://127.0.0.1:5000/addcamp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            camp_name: campName.trim(),

            location: location.trim(),

            capacity: Number(capacity),

            available_resources:
              availableResources.trim()

          })

        }
      );

      const data = await response.json();

      console.log(
        "ADD CAMP RESPONSE:",
        data
      );

      if (
        response.ok &&
        (
          data.success === true ||
          data.status === true
        )
      ) {

        alert(
          data.message ||
          "Camp added successfully"
        );

        // Clear form
        setCampName("");
        setLocation("");
        setCapacity("");
        setAvailableResources("");

        // Refresh camp table
        loadCamps();

      } else {

        alert(
          data.message ||
          "Unable to add camp"
        );

      }

    } catch (error) {

      console.error(
        "ADD CAMP ERROR:",
        error
      );

      alert(
        "Unable to connect to Flask server."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // DELETE CAMP
  // ==========================================

  const handleDeleteCamp = async (campId) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this camp?"
    );

    if (!confirmDelete) {
      return;
    }

    setDeleting(true);

    try {

      const response = await fetch(
        `http://127.0.0.1:5000/deletecamp/${campId}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      console.log(
        "DELETE CAMP RESPONSE:",
        data
      );

      if (
        response.ok &&
        (
          data.success === true ||
          data.status === true
        )
      ) {

        alert(
          data.message ||
          "Camp deleted successfully"
        );

        // Remove immediately from screen
        setCamps((previousCamps) =>
          previousCamps.filter(
            (camp) =>
              camp.camp_id !== campId
          )
        );

      } else {

        alert(
          data.message ||
          "Unable to delete camp"
        );

      }

    } catch (error) {

      console.error(
        "DELETE CAMP ERROR:",
        error
      );

      alert(
        "Unable to connect to Flask server."
      );

    } finally {

      setDeleting(false);

    }

  };


  return (

    <div className="camp-page">

      {/* ======================================
          ADD CAMP
      ====================================== */}

      <div className="camp-card">

        <h1>
          Add Relief Camp
        </h1>

        <form onSubmit={handleAddCamp}>

          {/* CAMP NAME */}

          <div className="form-group">

            <label>
              Camp Name
            </label>

            <input
              type="text"
              placeholder="Enter camp name"
              value={campName}
              onChange={(e) =>
                setCampName(e.target.value)
              }
            />

          </div>


          {/* LOCATION */}

          <div className="form-group">

            <label>
              Location
            </label>

            <input
              type="text"
              placeholder="Enter location"
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
            />

          </div>


          {/* CAPACITY */}

          <div className="form-group">

            <label>
              Capacity
            </label>

            <input
              type="number"
              placeholder="Enter capacity"
              min="1"
              value={capacity}
              onChange={(e) =>
                setCapacity(e.target.value)
              }
            />

          </div>


          {/* AVAILABLE RESOURCES */}

          <div className="form-group">

            <label>
              Available Resources
            </label>

            <input
              type="text"
              placeholder="Example: Food, Water, Medicine"
              value={availableResources}
              onChange={(e) =>
                setAvailableResources(
                  e.target.value
                )
              }
            />

          </div>


          {/* ADD BUTTON */}

          <button
            type="submit"
            className="add-camp-btn"
            disabled={loading}
          >

            {loading
              ? "Adding Camp..."
              : "Add Camp"}

          </button>

        </form>

      </div>


      {/* ======================================
          CAMP LIST
      ====================================== */}

      <div className="camp-list-card">

        <div className="camp-list-header">

          <h2>
            Relief Camps
          </h2>

          <button
            type="button"
            onClick={loadCamps}
            className="refresh-btn"
          >
            🔄 Refresh
          </button>

        </div>


        {camps.length === 0 ? (

          <div className="no-camps">

            <p>
              No relief camps registered yet.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>ID</th>

                  <th>Camp Name</th>

                  <th>Location</th>

                  <th>Capacity</th>

                  <th>Available Resources</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {camps.map((camp) => (

                  <tr key={camp.camp_id}>

                    <td>
                      {camp.camp_id}
                    </td>

                    <td>
                      {camp.camp_name}
                    </td>

                    <td>
                      {camp.location || "-"}
                    </td>

                    <td>
                      {camp.capacity || 0}
                    </td>

                    <td>
                      {camp.available_resources || "-"}
                    </td>

                    <td>

                      <button
                        type="button"
                        className="delete-btn"
                        disabled={deleting}
                        onClick={() =>
                          handleDeleteCamp(
                            camp.camp_id
                          )
                        }
                      >
                        🗑 Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );
}

export default CampForm;