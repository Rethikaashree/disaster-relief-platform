import { useState } from "react";
import "./Navbar.css";

function Navbar({ toggleTheme }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <h2>🏠 Disaster Relief Camp Management Portal</h2>

      <div className="menu">
        <button
          className="menu-btn"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        {open && (
          <div className="dropdown">

            <button onClick={toggleTheme}>
              🌙 Dark / ☀️ Light
            </button>

            <button
              onClick={() => {
                alert("Signed Out Successfully");
                window.location.reload();
              }}
            >
              🚪 Sign Out
            </button>

          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;