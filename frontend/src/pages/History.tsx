import { useEffect, useState } from "react";
import { History as HistoryIcon, Search } from "lucide-react";
import { beneficiaryApi, normalizeListResponse } from "../api";
import type { Beneficiary } from "../types";
export function History() {
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    beneficiaryApi
      .list()
      .then(({ data }) => {
        const items = normalizeListResponse<Beneficiary>(data);
        setItems(items);
        return Promise.all(
          items.map((item: Beneficiary) => beneficiaryApi.history(item.id)),
        );
      })
      .then(
        (results) =>
          results?.length &&
          setRecords(results.flatMap((result: any) => result.data.records)),
      )
      .finally(() => setLoading(false));
  }, []);
  const filtered = records.filter((record) =>
    `${record.officer} ${record.new_status} ${record.remarks}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DECISION TRAIL</span>
          <h1>Verification history</h1>
          <p>Review every status change and officer action.</p>
        </div>
      </div>
      <label className="search-box wide">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search officer, status, or remarks"
        />
      </label>
      <section className="panel">
        <div className="table-meta">
          <span>{filtered.length} decisions</span>
          <span>Audit-sensitive activity</span>
        </div>
        <div className="timeline">
          {loading ? (
            <div className="empty-state">Loading history...</div>
          ) : filtered.length ? (
            filtered.map((record) => (
              <div className="timeline-item" key={record.id}>
                <span
                  className={`timeline-marker ${record.new_status.toLowerCase()}`}
                >
                  <HistoryIcon size={16} />
                </span>
                <div>
                  <div className="timeline-title">
                    <strong>{record.new_status.replace("_", " ")}</strong>
                    <span>{new Date(record.created_at).toLocaleString()}</span>
                  </div>
                  <p>{record.remarks}</p>
                  <small>
                    Performed by {record.officer} · Previous:{" "}
                    {record.previous_status}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No verification decisions have been recorded.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
