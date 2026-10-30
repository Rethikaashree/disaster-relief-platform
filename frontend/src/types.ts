export type UserRole =
  | "MAIN_ADMIN"
  | "VERIFICATION_OFFICER"
  | "BENEFICIARY"
  | "DONOR";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  role: UserRole;
  must_change_password?: boolean;
  created_at: string;
}

export interface ReliefRequestItem {
  id: number;
  beneficiary_id: number;
  item_name: string;
  category: string;
  unit: string;
  quantity_requested: number;
  quantity_allocated: number;
  quantity_delivered: number;
  status: "PENDING" | "PARTIAL" | "FULFILLED" | "AWAITING_STOCK" | string;
}

export interface SupplyInventory {
  id: number;
  centre_id: number;
  item_name: string;
  category: string;
  unit: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_allocated: number;
  quantity_delivered: number;
  storage_location: string;
  low_stock_threshold: number;
  stock_status: "In Stock" | "Low Stock" | "Out of Stock" | string;
  centre_name?: string;
  centre_district?: string;
  description?: string | null;
}

export interface DistributionCentre {
  id: number;
  code: string;
  name: string;
  district: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  latitude: number;
  longitude: number;
  map_x: number;
  map_y: number;
  operating_status: string;
  created_at: string;
  total_items_count: number;
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  inventories?: SupplyInventory[];
}

export interface SupplyAllocation {
  id: number;
  beneficiary_id: number;
  request_item_id?: number | null;
  centre_id: number;
  centre_name?: string;
  centre_district?: string;
  inventory_id: number;
  item_name?: string;
  category?: string;
  officer_name?: string;
  quantity_allocated: number;
  quantity_delivered: number;
  unit: string;
  status: "ALLOCATED" | "DISPATCHED" | "DELIVERED" | "CANCELLED" | string;
  notes?: string | null;
  allocated_at: string;
  dispatched_at?: string | null;
  delivered_at?: string | null;
}

export interface CentreRecommendation {
  centre_id: number;
  centre_name: string;
  centre_code: string;
  district: string;
  address: string;
  distance_km: number;
  contact_phone: string;
  inventory_id: number | null;
  available_stock: number;
  unit: string;
  can_fulfill_full: boolean;
  sufficient_quantity: number;
}

export interface AllocationRecommendation {
  request_item_id: number;
  item_name: string;
  category: string;
  unit: string;
  quantity_requested: number;
  quantity_allocated: number;
  quantity_remaining: number;
  recommended_centres: CentreRecommendation[];
}

export interface Beneficiary {
  id: number;
  application_id: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  disaster_type: string | null;
  affected_location: string | null;
  date_affected: string | null;
  family_size: number | null;
  number_of_dependents: number | null;
  masked_aadhaar: string | null;
  aadhaar_last_four: string | null;
  document_status: string;
  verification_status: string;
  verification_score: number;
  duplicate_status: string;
  duplicate_reason: string | null;
  priority_level?: "URGENT" | "HIGH" | "NORMAL" | "LOW" | string;
  allocation_status?: "UNALLOCATED" | "PARTIALLY_ALLOCATED" | "FULLY_ALLOCATED" | "AWAITING_SUPPLIES" | string;
  delivery_status?: "PENDING" | "DISPATCHED" | "DELIVERED" | "PARTIALLY_DELIVERED" | string;
  verification_remarks?: string | null;
  created_at: string;
  updated_at: string;
  request_items?: ReliefRequestItem[];
  allocations?: SupplyAllocation[];
  distributions?: ReliefDistribution[];
}

export interface DashboardStatistics {
  total: number;
  pending: number;
  under_review: number;
  verified: number;
  rejected: number;
  flagged: number;
  total_centres?: number;
  total_available_stock?: number;
  total_allocated_stock?: number;
  total_delivered_stock?: number;
  low_stock_count?: number;
  out_of_stock_count?: number;
  awaiting_supplies?: number;
  most_requested?: { resource: string; requested: number }[];
  recent_applications: Beneficiary[];
  recent_activity: Record<string, unknown>[];
}


export type DistributionStatus =
  | "Allocated"
  | "Distributed – Awaiting Beneficiary Confirmation"
  | "Fully Received – Confirmed"
  | "Partially Received"
  | "Not Received"
  | "Issue Reported";

export interface ReliefDistributionItem {
  id: number;
  distribution_id: number;
  allocation_id?: number | null;
  item_name: string;
  category?: string | null;
  unit: string;
  quantity_allocated: number;
  quantity_distributed: number;
  quantity_received?: number | null;
  quantity_missing?: number | null;
  item_status: DistributionStatus | string;
  notes?: string | null;
}

export interface ReliefDistribution {
  id: number;
  distribution_ref: string;
  beneficiary_id: number;
  beneficiary_name?: string | null;
  application_id?: string | null;
  officer_id: number;
  officer_name?: string | null;
  centre_id?: number | null;
  centre_name?: string | null;
  status: DistributionStatus | string;
  distributed_at: string;
  confirmed_at?: string | null;
  officer_notes?: string | null;
  beneficiary_feedback?: string | null;
  discrepancy_details?: string | null;
  items: ReliefDistributionItem[];
}

export interface DistributionTrackingSummary {
  total_beneficiaries_with_allocations: number;
  total_distributions_completed: number;
  beneficiaries_confirmed_receipt: number;
  pending_confirmations: number;
  partial_or_unsuccessful: number;
  reported_discrepancies: number;
  distributions: ReliefDistribution[];
}


export interface BeneficiarySupplyRequestItem {
  id: number;
  request_id: number;
  inventory_id: number;
  item_name: string;
  category?: string | null;
  unit: string;
  quantity_requested: number;
  quantity_approved: number;
  status: "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED" | string;
  decision_reason?: string | null;
  allocation_id?: number | null;
  available_stock?: number;
}

export interface BeneficiarySupplyRequest {
  id: number;
  request_ref: string;
  beneficiary_id: number;
  beneficiary_name?: string | null;
  application_id?: string | null;
  district?: string | null;
  priority_level?: string | null;
  family_size?: number | null;
  status: "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED" | string;
  notes?: string | null;
  reviewed_by_id?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  officer_remarks?: string | null;
  created_at: string;
  updated_at: string;
  items: BeneficiarySupplyRequestItem[];
}
