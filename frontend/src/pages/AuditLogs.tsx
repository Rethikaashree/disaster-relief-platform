import { useEffect, useState } from "react";
import { FileClock, Search } from "lucide-react";
import { auditApi, normalizeListResponse } from "../api";

interface AuditItem {
  id: number;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  remarks: string | null;
  created_at: string;
}
export function AuditLogs() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    auditApi
      .list()
      .then(({ data }) => setItems(normalizeListResponse<AuditItem>(data)))
      .finally(() => setLoading(false));
  }, []);
  const filtered = items.filter((item) =>
    `${item.user_name} ${item.action} ${item.entity_type} ${item.remarks}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMIN AUDIT</span>
          <h1>Audit logs</h1>
          <p>Immutable activity trail for privileged actions.</p>
        </div>
      </div>
      <label className="search-box wide">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search action, user, or entity"
        />
      </label>
      <section className="panel audit-panel">
        <div className="table-meta">
          <span>{filtered.length} audit events</span>
          <span>Protected administrator records</span>
        </div>
        <div className="audit-list">
          {loading ? (
            <div className="empty-state">Loading audit events...</div>
          ) : filtered.length ? (
            filtered.map((item) => (
              <div className="audit-row" key={item.id}>
                <div className="audit-icon">
                  <FileClock size={18} />
                </div>
                <div>
                  <div className="audit-title">
                    <strong>{item.action.replace(/_/g, " ")}</strong>
                    <span>{item.user_name || "System"}</span>
                    <time>{new Date(item.created_at).toLocaleString()}</time>
                  </div>
                  <p>{item.remarks || "No remarks provided."}</p>
                  <small>
                    {item.entity_type} · {item.entity_id}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No audit events found.</div>
          )}
        </div>
      </section>
    </div>
  );
}
