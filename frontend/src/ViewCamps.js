import React, { useEffect, useState } from "react";

function ViewCamps() {

  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // GET CAMPS
  // ============================================================

  const fetchCamps = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/getcamps"
      );

      const data = await response.json();

      console.log("Camps Response:", data);

      if (response.ok && data.success) {

        // IMPORTANT:
        // Backend returns { success: true, camps: [...] }

        setCamps(
          Array.isArray(data.camps)
            ? data.camps
            : []
        );

      } else {

        alert(
          data.message ||
          "Unable to load camps"
        );

        setCamps([]);

      }

    } catch (error) {

      console.error(
        "Get Camps Error:",
        error
      );

      alert(
        "Unable to connect to Flask server."
      );

      setCamps([]);

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // LOAD CAMPS
  // ============================================================

  useEffect(() => {

    fetchCamps();

  }, []);


  // ============================================================
  // DELETE CAMP
  // ============================================================

  const handleDelete = async (campId) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this camp?"
    );

    if (!confirmDelete) {
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:5000/deletecamp/${campId}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      console.log(
        "Delete Camp Response:",
        data
      );

      if (response.ok && data.success) {

        alert(
          "Camp deleted successfully"
        );

        // Refresh camps

        fetchCamps();

      } else {

        alert(
          data.message ||
          "Unable to delete camp"
        );

      }

    } catch (error) {

      console.error(
        "Delete Camp Error:",
        error
      );

      alert(
        "Unable to connect to Flask server."
      );

    }

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (
      <div>
        <h2>Relief Camps</h2>
        <p>Loading camps...</p>
      </div>
    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div>

      <h2>Relief Camps</h2>

      {/* REFRESH */}

      <button
        onClick={fetchCamps}
        style={{
          marginBottom: "15px",
          cursor: "pointer"
        }}
      >
        🔄 Refresh
      </button>


      {/* NO CAMPS */}

      {camps.length === 0 ? (

        <p>
          No relief camps registered yet.
        </p>

      ) : (

        <table
          border="1"
          cellPadding="8"
          cellSpacing="0"
          style={{
            borderCollapse: "collapse",
            width: "100%"
          }}
        >

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
                  {camp.location}
                </td>

                <td>
                  {camp.capacity}
                </td>

                <td>
                  {camp.available_resources || "N/A"}
                </td>

                <td>

                  <button
                    onClick={() =>
                      handleDelete(
                        camp.camp_id
                      )
                    }
                    style={{
                      cursor: "pointer"
                    }}
                  >
                    🗑️ Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}

export default ViewCamps;