import React, { useEffect, useState } from "react";
import "./ResourceForm.css";

function ResourceForm() {

  const [resources, setResources] = useState([]);

  const [formData, setFormData] = useState({
    resource_name: "",
    category: "",
    quantity: "",
    unit: "",
    camp_name: "",
    expiry_date: ""
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };


  // =====================================================
  // GET RESOURCES
  // =====================================================

  const fetchResources = async () => {

    try {

      setFetching(true);

      const response = await fetch(
        "http://127.0.0.1:5000/getresources"
      );

      const data = await response.json();

      if (data.success) {

        setResources(data.resources);

      } else {

        alert(data.message || "Unable to load resources");
      }

    } catch (error) {

      console.error("Resource fetch error:", error);

      alert(
        "Unable to connect to Flask.\n" +
        "Make sure the backend is running."
      );

    } finally {

      setFetching(false);
    }
  };


  // =====================================================
  // LOAD RESOURCES
  // =====================================================

  useEffect(() => {

    fetchResources();

  }, []);


  // =====================================================
  // ADD RESOURCE
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!formData.resource_name.trim()) {

      alert("Resource Name is required");
      return;
    }

    if (!formData.category) {

      alert("Please select a category");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {

      alert("Enter a valid quantity");
      return;
    }

    if (!formData.unit.trim()) {

      alert("Unit is required");
      return;
    }

    if (!formData.camp_name.trim()) {

      alert("Camp Name is required");
      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/addresource",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            resource_name: formData.resource_name.trim(),
            category: formData.category,
            quantity: Number(formData.quantity),
            unit: formData.unit.trim(),
            camp_name: formData.camp_name.trim(),
            expiry_date: formData.expiry_date || null
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {

        alert(
          "Resource added successfully!\n\n" +
          "Resource ID: " +
          data.resource_id
        );

        setFormData({
          resource_name: "",
          category: "",
          quantity: "",
          unit: "",
          camp_name: "",
          expiry_date: ""
        });

        fetchResources();

      } else {

        alert(
          data.message ||
          "Unable to add resource"
        );
      }

    } catch (error) {

      console.error("Add resource error:", error);

      alert(
        "Unable to connect to Flask.\n" +
        "Make sure backend is running on port 5000."
      );

    } finally {

      setLoading(false);
    }
  };


  // =====================================================
  // DELETE RESOURCE
  // =====================================================

  const deleteResource = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this resource?"
    );

    if (!confirmDelete) {
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:5000/deleteresource/${id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {

        alert("Resource deleted successfully");

        fetchResources();

      } else {

        alert(
          data.message ||
          "Unable to delete resource"
        );
      }

    } catch (error) {

      console.error("Delete error:", error);

      alert("Unable to connect to Flask");
    }
  };


  // =====================================================
  // RESOURCE STATUS
  // =====================================================

  const getStatus = (quantity) => {

    if (quantity === 0) {
      return {
        text: "Out of Stock",
        className: "out-stock"
      };
    }

    if (quantity <= 10) {
      return {
        text: "Low Stock",
        className: "low-stock"
      };
    }

    return {
      text: "Available",
      className: "available"
    };
  };


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="resource-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="resource-title">

        <div className="resource-title-icon">
          📦
        </div>

        <div>

          <h1>
            Resource Management
          </h1>

          <p>
            Manage and distribute relief resources
            efficiently across camps.
          </p>

        </div>

      </div>


      {/* =================================================
          ADD RESOURCE CARD
      ================================================= */}

      <div className="resource-card">

        <div className="card-heading">

          <span>
            ➕
          </span>

          <div>
            <h2>
              Add New Resource
            </h2>

            <p>
              Enter the details of the available relief resource.
            </p>
          </div>

        </div>


        <form onSubmit={handleSubmit}>

          {/* ROW 1 */}

          <div className="resource-form-row">

            <div className="resource-group">

              <label>
                Resource Name
              </label>

              <input
                type="text"
                name="resource_name"
                value={formData.resource_name}
                onChange={handleChange}
                placeholder="Example: Rice"
              />

            </div>


            <div className="resource-group">

              <label>
                Category
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >

                <option value="">
                  Select Category
                </option>

                <option value="Food">
                  🍚 Food
                </option>

                <option value="Water">
                  💧 Water
                </option>

                <option value="Medicine">
                  💊 Medicine
                </option>

                <option value="Clothing">
                  👕 Clothing
                </option>

                <option value="Shelter">
                  ⛺ Shelter
                </option>

                <option value="Hygiene">
                  🧴 Hygiene
                </option>

                <option value="Other">
                  📦 Other
                </option>

              </select>

            </div>

          </div>


          {/* ROW 2 */}

          <div className="resource-form-row">

            <div className="resource-group">

              <label>
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                min="1"
              />

            </div>


            <div className="resource-group">

              <label>
                Unit
              </label>

              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="Example: kg, litres, boxes"
              />

            </div>

          </div>


          {/* ROW 3 */}

          <div className="resource-form-row">

            <div className="resource-group">

              <label>
                Camp Name
              </label>

              <input
                type="text"
                name="camp_name"
                value={formData.camp_name}
                onChange={handleChange}
                placeholder="Enter relief camp"
              />

            </div>


            <div className="resource-group">

              <label>
                Expiry Date
              </label>

              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
              />

            </div>

          </div>


          {/* BUTTON */}

          <button
            type="submit"
            className="resource-submit"
            disabled={loading}
          >

            {loading
              ? "Adding Resource..."
              : "📦 Add Resource"
            }

          </button>

        </form>

      </div>


      {/* =================================================
          RESOURCE LIST
      ================================================= */}

      <div className="resource-card">

        <div className="list-header">

          <div>

            <h2>
              📋 Available Resources
            </h2>

            <p>
              Resources currently registered in the system.
            </p>

          </div>


          <button
            className="refresh-button"
            onClick={fetchResources}
          >
            🔄 Refresh
          </button>

        </div>


        {fetching ? (

          <div className="empty-resource">
            Loading resources...
          </div>

        ) : resources.length === 0 ? (

          <div className="empty-resource">

            <div className="empty-icon">
              📦
            </div>

            <h3>
              No Resources Found
            </h3>

            <p>
              Add your first relief resource above.
            </p>

          </div>

        ) : (

          <div className="resource-table-container">

            <table className="resource-table">

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Resource
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Camp
                  </th>

                  <th>
                    Expiry
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {resources.map((resource) => {

                  const status =
                    getStatus(
                      Number(resource.quantity)
                    );

                  return (

                    <tr
                      key={resource.resource_id}
                    >

                      <td>
                        #{resource.resource_id}
                      </td>

                      <td className="resource-name">
                        {resource.resource_name}
                      </td>

                      <td>
                        {resource.category}
                      </td>

                      <td>
                        <strong>
                          {resource.quantity}
                        </strong>{" "}
                        {resource.unit}
                      </td>

                      <td>
                        {resource.camp_name}
                      </td>

                      <td>
                        {resource.expiry_date
                          ? resource.expiry_date
                          : "—"
                        }
                      </td>

                      <td>

                        <span
                          className={
                            `status-badge ${status.className}`
                          }
                        >
                          {status.text}
                        </span>

                      </td>

                      <td>

                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteResource(
                              resource.resource_id
                            )
                          }
                        >
                          🗑️
                        </button>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default ResourceForm;