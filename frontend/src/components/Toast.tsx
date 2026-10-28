import { CheckCircle2, Info, XCircle } from "lucide-react";
export function Toast({
  type,
  message,
}: {
  type: "success" | "error" | "info";
  message: string;
}) {
  const Icon =
    type === "success" ? CheckCircle2 : type === "error" ? XCircle : Info;
  return (
    <div className={`toast ${type}`}>
      <Icon size={18} />
      <span>{message}</span>
    </div>
  );
}
