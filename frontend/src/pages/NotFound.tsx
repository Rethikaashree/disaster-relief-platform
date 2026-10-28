import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
export function NotFound() {
  return (
    <div className="page not-found">
      <Compass size={48} />
      <span>404</span>
      <h1>Page not found</h1>
      <p>The requested verification workspace is unavailable.</p>
      <Link to="/dashboard" className="primary-button">
        <ArrowLeft size={18} />
        Return to dashboard
      </Link>
    </div>
  );
}
