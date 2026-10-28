import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { beneficiaryApi, normalizeListResponse } from "../api";
import type { Beneficiary } from "../types";

export function DuplicateFlags() {
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  useEffect(() => {
    beneficiaryApi
      .list()
      .then(({ data }) =>
        setItems(
          normalizeListResponse<Beneficiary>(data).filter(
            (item: Beneficiary) =>
              item.duplicate_status === "FLAGGED" ||
              item.verification_status === "DUPLICATE_FLAGGED",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const filtered = items.filter((item) =>
    `${item.name} ${item.application_id}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DUPLICATE REVIEW</span>
          <h1>Duplicate flags</h1>
          <p>Review potential duplicate beneficiaries before final approval.</p>
        </div>
      </div>
      <label className="search-box wide">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search flagged beneficiaries"
        />
      </label>
      <section className="panel table-panel">
        <div className="table-meta">
          <span>{filtered.length} flagged records</span>
          <span>Matching is rule-based and requires manual confirmation</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Beneficiary</th>
                <th>Application ID</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading flags...</td>
                </tr>
              ) : filtered.length ? (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <small>{item.phone || "No phone"}</small>
                    </td>
                    <td>
                      <code>{item.application_id}</code>
                    </td>
                    <td>{item.duplicate_reason || "Rule-based match"}</td>
                    <td>
                      <span className="status-badge duplicate-flagged">
                        {item.duplicate_status}
                      </span>
                    </td>
                    <td>
                      <span className="score-value">
                        {item.verification_score}/100
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <CheckCircle2 size={32} />
                      <strong>No duplicate flags</strong>
                      <span>All visible records are clear.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
