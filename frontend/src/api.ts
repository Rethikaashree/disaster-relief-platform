import axios from "axios";
import type { Beneficiary, DashboardStatistics, User } from "./types";

export function normalizeListResponse<T>(
  payload: T[] | { items: T[]; total?: number },
): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.items) ? (payload.items as T[]) : [];
}

export function normalizeBaseUrl(raw?: string): string {
  const url = (raw || "/api").trim().replace(/\/+$/, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }
  return url.endsWith("/api") ? url : `${url}/api`;
}

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (role: "BENEFICIARY" | "DONOR", payload: Record<string, unknown>) =>
    api.post(`/auth/${role.toLowerCase()}/register`, payload),
  changePassword: (payload: {
    current_password: string;
    password: string;
    confirm_password: string;
  }) => api.post("/auth/change-password", payload),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const beneficiaryApi = {
  create: (data: Record<string, unknown>) => api.post("/beneficiaries", data),
  mine: () =>
    api.get<{ items: Beneficiary[]; total: number }>(
      "/beneficiaries/my-applications",
    ),
  submit: (id: number) => api.post(`/beneficiaries/${id}/submit`),
  list: () =>
    api
      .get<{ items: Beneficiary[]; total: number }>("/beneficiaries")
      .then(({ data }) => ({
        data: normalizeListResponse<Beneficiary>(data),
      })),
  get: (id: number) => api.get(`/beneficiaries/${id}`),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/beneficiaries/${id}`, data),
  checkDuplicates: (data: Record<string, unknown>) =>
    api.post("/beneficiaries/check-duplicate", data),
  verify: (id: number, data: Record<string, unknown>) =>
    api.post(`/beneficiaries/${id}/verify`, data),
  reject: (id: number, data: Record<string, unknown>) =>
    api.post(`/beneficiaries/${id}/reject`, data),
  flagDuplicate: (id: number, data: Record<string, unknown>) =>
    api.post(`/beneficiaries/${id}/flag-duplicate`, data),
  history: (id: number) => api.get(`/beneficiaries/${id}/history`),
};

export const documentApi = {
  upload: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/aadhaar/upload?beneficiary_id=${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  scan: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/aadhaar/scan?beneficiary_id=${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const dashboardApi = {
  statistics: () => api.get<DashboardStatistics>("/dashboard/statistics"),
};

export const donorApi = {
  overview: () => api.get("/donor/overview"),
  pledges: () => api.get("/donor/pledges"),
  createPledge: (payload: {
    amount: string;
    campaign: string;
    message?: string;
  }) => api.post("/donor/pledges", payload),
};

export const officerApi = {
  list: () => api.get("/admin/officers"),
  create: (payload: Record<string, string>) =>
    api.post("/admin/officers", payload),
  setStatus: (id: number, status: "ACTIVE" | "INACTIVE") =>
    api.patch(`/admin/officers/${id}/status`, { status }),
  resetPassword: (
    id: number,
    payload: { password: string; confirm_password: string },
  ) => api.patch(`/admin/officers/${id}/password`, payload),
};

export const notificationApi = {
  list: () => api.get("/notifications"),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
};

export const auditApi = {
  list: () => api.get("/audit-logs"),
};

export const distributionApi = {
  centres: (district?: string) =>
    api.get<{ items: import("./types").DistributionCentre[]; total: number }>(
      "/distribution/centres",
      { params: district && district !== "all" ? { district } : {} }
    ),
  centre: (id: number) =>
    api.get<import("./types").DistributionCentre>(`/distribution/centres/${id}`),
  inventory: (params?: {
    district?: string;
    category?: string;
    stock_status?: string;
    low_stock_only?: boolean;
  }) =>
    api.get<{ items: import("./types").SupplyInventory[]; total: number }>(
      "/distribution/inventory",
      { params }
    ),
  recommendations: (beneficiaryId: number) =>
    api.get<{
      beneficiary_id: number;
      recommendations: import("./types").AllocationRecommendation[];
    }>(`/beneficiaries/${beneficiaryId}/recommendations`),
  allocate: (
    beneficiaryId: number,
    payload: {
      centre_id: number;
      allocations: {
        inventory_id: number;
        request_item_id?: number | null;
        quantity: number;
        notes?: string;
      }[];
    }
  ) => api.post(`/beneficiaries/${beneficiaryId}/allocate`, payload),
  dispatch: (allocationId: number) =>
    api.post(`/allocations/${allocationId}/dispatch`),
  deliver: (allocationId: number) =>
    api.post(`/allocations/${allocationId}/deliver`),
  allocations: (beneficiaryId: number) =>
    api.get<{ items: import("./types").SupplyAllocation[]; total: number }>(
      `/beneficiaries/${beneficiaryId}/allocations`
    ),
  handover: (payload: {
    beneficiary_id: number;
    centre_id?: number | null;
    officer_notes?: string;
    items: {
      allocation_id?: number | null;
      inventory_id?: number | null;
      item_name?: string;
      unit?: string;
      quantity_allocated?: number;
      quantity_distributed: number;
      notes?: string;
    }[];
  }) =>
    api.post<{ message: string; distribution: import("./types").ReliefDistribution }>(
      "/distributions/handover",
      payload
    ),
  myDistributions: () =>
    api.get<{ items: import("./types").ReliefDistribution[]; total: number }>(
      "/distributions/my-distributions"
    ),
  beneficiaryDistributions: (beneficiaryId: number) =>
    api.get<{ items: import("./types").ReliefDistribution[]; total: number }>(
      `/distributions/beneficiary/${beneficiaryId}`
    ),
  confirmReceipt: (
    distributionId: number,
    payload: {
      action: string;
      feedback?: string;
      missing_items?: {
        item_id: number;
        quantity_received: number;
        quantity_missing?: number;
        reason?: string;
      }[];
    }
  ) =>
    api.post<{ message: string; distribution: import("./types").ReliefDistribution }>(
      `/distributions/${distributionId}/confirm`,
      payload
    ),
  trackingSummary: () =>
    api.get<import("./types").DistributionTrackingSummary>(
      "/distributions/tracking-summary"
    ),
};

export const getUser = (): User | null => {
  const stored = localStorage.getItem("user");
  return stored ? (JSON.parse(stored) as User) : null;
};
