import { useEffect, useState } from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { beneficiaryApi, normalizeListResponse } from "../api";
import type { Beneficiary } from "../types";

export function Beneficiaries() {
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<keyof Beneficiary>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    let active = true;
    beneficiaryApi
      .list()
      .then(
        ({ data }) =>
          active && setItems(normalizeListResponse<Beneficiary>(data)),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);
  const filtered = items
    .filter(
      (item) =>
        (status === "all" || item.verification_status === status) &&
        `${item.name} ${item.application_id} ${item.district || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const left = String(a[sortKey] || "");
      const right = String(b[sortKey] || "");
      return sortDirection === "asc"
        ? left.localeCompare(right)
        : right.localeCompare(left);
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const updateSort = (key: keyof Beneficiary) => {
    setSortKey(key);
    setSortDirection(sortKey === key && sortDirection === "asc" ? "desc" : "asc");
  };
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">REGISTRY</span>
          <h1>Beneficiaries</h1>
          <p>Search, review, and manage all registered applications.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="demo-live-badge">DEMO DATA</span>
          <Link to="/new-beneficiary" className="primary-button">
            <Plus size={18} />
            New beneficiary
          </Link>
        </div>
      </div>
      <div className="demo-banner">
        <SlidersHorizontal size={16} />
        All beneficiary records listed are synthetic DEMO DATA simulating Tamil Nadu disaster impact scenarios.
      </div>
      <section className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or application ID"
          />
        </label>
        <label className="select-box">
          <SlidersHorizontal size={17} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="DUPLICATE_FLAGGED">Flagged</option>
          </select>
        </label>
        <label className="select-box">
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </label>
      </section>
      <section className="panel table-panel">
        <div className="table-meta">
          <span>{filtered.length} records</span>
          <span>Protected verification records</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th><button className="table-sort" onClick={() => updateSort("name")}>Beneficiary</button></th>
                <th><button className="table-sort" onClick={() => updateSort("application_id")}>Application ID</button></th>
                <th><button className="table-sort" onClick={() => updateSort("district")}>District / State</button></th>
                <th>Document status</th>
                <th><button className="table-sort" onClick={() => updateSort("verification_status")}>Verification</button></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Loading records...</td>
                </tr>
              ) : filtered.length ? (
                pageItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="person-cell">
                        <span>{item.name.slice(0, 1)}</span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            {item.masked_aadhaar || item.phone || "Standard application"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code>{item.application_id}</code>
                    </td>
                    <td>
                      {item.district || "—"} / {item.state || "—"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${item.document_status.toLowerCase().replace("_", "-")}`}
                      >
                        {item.document_status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${item.verification_status.toLowerCase()}`}
                      >
                        {item.verification_status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/review/${item.id}`} className="table-action">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      No beneficiaries match the current filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-pagination">
          <button
            className="secondary-button"
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="secondary-button"
            disabled={page === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
