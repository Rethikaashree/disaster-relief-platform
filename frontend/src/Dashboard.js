import React from "react";
import "./Dashboard.css";

function Dashboard({ setPage }) {

  const modules = [
    {
      id: "beneficiaries",
      icon: "👥",
      title: "Beneficiaries",
      description: "Register and manage disaster-affected families.",
      button: "Open Beneficiaries →"
    },
    {
      id: "camps",
      icon: "🏕️",
      title: "Relief Camps",
      description: "Add, view and manage relief camps.",
      button: "Open Camps →"
    },
    {
      id: "resources",
      icon: "📦",
      title: "Resources",
      description: "Manage food, water, medicines and relief supplies.",
      button: "Open Resources →"
    },
    {
      id: "distribution",
      icon: "🚚",
      title: "Distribution",
      description: "Distribute relief materials to registered beneficiaries.",
      button: "Open Distribution →"
    },
    {
      id: "emergency",
      icon: "🚨",
      title: "Emergency",
      description: "Respond to emergency requests quickly.",
      button: "Open Emergency →"
    },
    {
      id: "reports",
      icon: "📊",
      title: "Reports",
      description: "View statistics and generate relief reports.",
      button: "Open Reports →"
    }
  ];

  return (
    <div className="dashboard-page">

      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <section className="dashboard-heading">

        <div>
          <h1>
            🌊 Disaster Relief Portal
          </h1>

          <p>
            Smart relief management for safer communities.
          </p>
        </div>

        <button
          className="admin-dashboard-btn"
          onClick={() => setPage("dashboard")}
        >
          🛡️ Admin Dashboard
        </button>

      </section>


      {/* =========================================
          WELCOME BANNER
      ========================================= */}

      


      {/* =========================================
          MODULE SECTION
      ========================================= */}

      <section className="modules-section">

        <div className="section-heading">

          <h2>
            Management Modules
          </h2>

          <p>
            Select a module to manage the corresponding information.
          </p>

        </div>


        {/* =========================================
            MODULE CARDS
        ========================================= */}

        <div className="module-grid">

          {modules.map((module) => (

            <div
              className="module-card"
              key={module.id}
              onClick={() => setPage(module.id)}
            >

              {/* ICON */}

              <div className="module-icon">
                {module.icon}
              </div>


              {/* TITLE */}

              <h3>
                {module.title}
              </h3>


              {/* DESCRIPTION */}

              <p>
                {module.description}
              </p>


              {/* BUTTON */}

              <button
                className="module-link"
                onClick={(e) => {

                  e.stopPropagation();

                  setPage(module.id);

                }}
              >
                {module.button}
              </button>

            </div>

          ))}

        </div>

      </section>

    </div>
  );
}

export default Dashboard;