export type UserRole = 'super_admin' | 'officer' | 'ngo' | 'volunteer' | 'beneficiary';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  district?: string;
  organization?: string;
  avatar?: string;
  aadhaarVerified?: boolean;
}

export type DisasterType = 
  | 'Flood'
  | 'Cyclone'
  | 'Earthquake'
  | 'Fire'
  | 'Landslide'
  | 'Heatwave'
  | 'Pandemic'
  | 'Tsunami'
  | 'Drought'
  | 'Industrial Accident';

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface FamilyMember {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: string;
}

export interface Beneficiary {
  id: string;
  uniqueQrId: string;
  fullName: string;
  aadhaarNumber: string;
  govtId: string;
  phone: string;
  email: string;
  photoUrl: string;
  address: string;
  gpsLocation: { lat: number; lng: number };
  state: string;
  district: string;
  taluk: string;
  village: string;
  pincode: string;
  familyMembers: FamilyMember[];
  familyCount: number;
  monthlyIncome: number;
  occupation: string;
  isDisbled: boolean;
  isPregnant: boolean;
  isSeniorCitizen: boolean;
  hasMedicalCondition: boolean;
  medicalDetails?: string;
  childrenCount: number;
  livestockCount: number;
  housingDamage: 'Total Collapse' | 'Severe Damage' | 'Partial Damage' | 'Minor Damage' | 'None';
  currentShelter: string;
  requiredAid: string[];
  bankAccount: string;
  ifscCode: string;
  upiId: string;
  emergencyContact: string;
  liveSelfieUrl?: string;
  signatureUrl?: string;
  supportingDocUrl?: string;
  
  // AI scores
  priorityScore: number; // 0 - 100
  priorityLevel: PriorityLevel;
  identityConfidenceScore: number; // 0 - 100
  riskScore: number; // 0 - 100
  ocrVerified: boolean;
  faceMatchScore: number; // 0 - 100
  duplicateFlag: boolean;
  
  // Status
  verificationStatus: 'Pending' | 'Approved' | 'Rejected' | 'Under Audit';
  aidDistributionStatus: 'Not Distributed' | 'Partially Distributed' | 'Fully Distributed';
  registeredAt: string;
  disasterId: string;
}

export interface DisasterEvent {
  id: string;
  title: string;
  type: DisasterType;
  severity: 'Critical' | 'Severe' | 'Moderate' | 'Low';
  affectedDistricts: string[];
  affectedPopulation: number;
  startDate: string;
  status: 'Active' | 'Contained' | 'Recovery';
  description: string;
  expectedReliefBudget: string;
  emergencyHelplines: string[];
  centerCoordinates: { lat: number; lng: number };
}

export interface ReliefCamp {
  id: string;
  name: string;
  district: string;
  disasterId: string;
  capacity: number;
  currentOccupancy: number;
  inChargeOfficer: string;
  contactPhone: string;
  facilities: {
    doctorsCount: number;
    foodKitsAvailable: number;
    waterLitersAvailable: number;
    electricitySupply: boolean;
    bedsAvailable: number;
    toiletsCount: number;
    womenSafetyZone: boolean;
    childrenZone: boolean;
  };
  coordinates: { lat: number; lng: number };
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  district: string;
  managerName: string;
  managerPhone: string;
  totalCapacityTons: number;
  usedCapacityTons: number;
  coordinates: { lat: number; lng: number };
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  category: 'Food' | 'Water' | 'Medicines' | 'Blankets' | 'Tents' | 'Clothes' | 'Sanitary Kits' | 'Baby Food' | 'Animal Feed' | 'Fuel';
  name: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityDistributed: number;
  unit: 'Kgs' | 'Liters' | 'Kits' | 'Boxes' | 'Units' | 'Packs';
  supplier: string;
  expiryDate?: string;
}

export interface DistributionRecord {
  id: string;
  receiptId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryQrId: string;
  disasterId: string;
  campId: string;
  volunteerId: string;
  volunteerName: string;
  itemsDistributed: { item: string; quantity: number; unit: string }[];
  gpsLocation: { lat: number; lng: number };
  liveSelfieUrl?: string;
  digitalSignatureUrl?: string;
  timestamp: string;
  blockchainHash: string;
}

export interface FraudAlert {
  id: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  type: 'Duplicate Aadhaar' | 'Duplicate Face' | 'Fake Document' | 'GPS Mismatch' | 'Suspicious Device' | 'Volunteer Anomaly' | 'Inventory Misuse';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  flaggedByAi: boolean;
  riskScore: number;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Dismissed';
  detectedAt: string;
  details: Record<string, string | number>;
}

export interface BlockchainBlock {
  index: number;
  timestamp: string;
  transactionsCount: number;
  previousHash: string;
  hash: string;
  receiptIds: string[];
  verifiedBy: string;
}

export interface Hospital {
  id: string;
  name: string;
  district: string;
  availableBeds: number;
  totalICUBeds: number;
  doctorsOnDuty: number;
  ambulancesAvailable: number;
  contactNumber: string;
  coordinates: { lat: number; lng: number };
  emergencyLevel: 'Normal' | 'High Demand' | 'Critical';
}

export interface WeatherTelemetry {
  temperature: number;
  humidity: number;
  rainfallMm: number;
  windSpeedKmh: number;
  cycloneRisk: 'None' | 'Watch' | 'Warning' | 'Severe Warning';
  floodRiskLevel: 'Safe' | 'Moderate' | 'High' | 'Severe Flood Alert';
  waterSensorLevelMeters: number;
  sensorThresholdMeters: number;
  lastUpdated: string;
}

export interface EmergencySos {
  id: string;
  callerName: string;
  phone: string;
  gpsLocation: { lat: number; lng: number };
  emergencyType: 'Medical' | 'Trapped' | 'Food Supply' | 'Child / Senior Emergency' | 'Structural Failure';
  message: string;
  audioNoteUrl?: string;
  photoUrl?: string;
  timestamp: string;
  status: 'Active' | 'Dispatched' | 'Rescued';
}

export interface Complaint {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  category: 'Missing Aid' | 'Wrong Verification' | 'Volunteer Misconduct' | 'Corruption' | 'Medical Emergency' | 'Infrastructure Issue';
  description: string;
  aiPriority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Resolved';
  filedAt: string;
  assignedOfficer?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actionLinks?: { label: string; action: string }[];
}
