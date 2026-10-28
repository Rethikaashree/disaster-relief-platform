import { useState, type FormEvent } from "react";
import { Camera, FileCheck2, ScanLine, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { documentApi } from "../api";

export function Scanner() {
  const { beneficiaryId } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scan = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await documentApi.scan(Number(beneficiaryId), file);
      setResult(JSON.stringify(data.extracted_fields, null, 2));
    } catch (err) {
      setError(
        typeof err === "object" && err && "response" in err
          ? (err as any).response?.data?.detail || "OCR failed."
          : "OCR failed.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OCR WORKSPACE</span>
          <h1>Document scanner</h1>
          <p>Process and extract Aadhaar fields for manual review.</p>
        </div>
        <div className="secure-chip">
          <ShieldCheck size={16} />
          Document stored securely
        </div>
      </div>
      <section className="scanner-layout">
        <form className="panel scanner-form" onSubmit={scan}>
          <div className="panel-header">
            <div>
              <h2>Upload document</h2>
              <p>Camera input is supported by compatible browsers.</p>
            </div>
            <Camera />
          </div>
          <label className="file-drop">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <FileCheck2 size={30} />
            <strong>{file ? file.name : "Select or capture image"}</strong>
            <span>Image files only</span>
          </label>
          <button className="primary-button full" disabled={loading}>
            <ScanLine size={18} />
            {loading ? "Extracting fields..." : "Process document"}
          </button>
          {error && <div className="alert danger">{error}</div>}
        </form>
        <article className="panel result-panel">
          <div className="panel-header">
            <div>
              <h2>OCR result</h2>
              <p>Extracted fields remain visible only to authorized users.</p>
            </div>
          </div>
          {result ? (
            <pre>{result}</pre>
          ) : (
            <div className="empty-state large">
              <ScanLine size={42} />
              <strong>No document processed</strong>
              <span>Upload a clear image to begin OCR.</span>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
