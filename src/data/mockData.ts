import { 
  User, 
  DisasterEvent, 
  Beneficiary, 
  ReliefCamp, 
  Warehouse, 
  InventoryItem, 
  DistributionRecord, 
  FraudAlert, 
  BlockchainBlock, 
  Hospital, 
  WeatherTelemetry, 
  EmergencySos, 
  Complaint 
} from '../types';

export const mockUsers: User[] = [
  {
    id: 'usr_001',
    name: 'Dr. Rajesh Sekhar',
    email: 'admin@rescuaid.gov.in',
    role: 'super_admin',
    phone: '+91 98765 43210',
    district: 'State HQ - Chennai',
    organization: 'National Disaster Management Authority (NDMA)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    aadhaarVerified: true
  },
  {
    id: 'usr_002',
    name: 'K. Meenakshi IAS',
    email: 'officer.cuddalore@tn.gov.in',
    role: 'officer',
    phone: '+91 94433 12345',
    district: 'Cuddalore District',
    organization: 'District Collectorate Office',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    aadhaarVerified: true
  },
  {
    id: 'usr_003',
    name: 'Aarav Sharma',
    email: 'relief@redcross.org',
    role: 'ngo',
    phone: '+91 98112 88990',
    district: 'Chennai South',
    organization: 'Red Cross Relief Foundation',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    aadhaarVerified: true
  },
  {
    id: 'usr_004',
    name: 'Priya Sundaram',
    email: 'priya.vol@rescuaid.org',
    role: 'volunteer',
    phone: '+91 97900 11223',
    district: 'Cuddalore District',
    organization: 'District Disaster Cadre Volunteers',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    aadhaarVerified: true
  },
  {
    id: 'usr_005',
    name: 'Lakshmi Narayanan',
    email: 'lakshmi.ben@gmail.com',
    role: 'beneficiary',
    phone: '+91 96001 55443',
    district: 'Cuddalore District',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    aadhaarVerified: true
  }
];

export const mockDisasters: DisasterEvent[] = [
  {
    id: 'dis_2026_01',
    title: 'Severe Coastal Cyclone & Flood Alert 2026',
    type: 'Flood',
    severity: 'Critical',
    affectedDistricts: ['Cuddalore', 'Nagapattinam', 'Chennai', 'Chengalpattu'],
    affectedPopulation: 142000,
    startDate: '2026-07-24',
    status: 'Active',
    description: 'Relentless coastal storm surge resulting in severe river overflows across coastal taluks. Over 45,000 households displaced.',
    expectedReliefBudget: '₹ 85.5 Crores',
    emergencyHelplines: ['1077 (District Control)', '112 (National Emergency)', '044-28888000'],
    centerCoordinates: { lat: 11.748, lng: 79.7714 }
  },
  {
    id: 'dis_2026_02',
    title: 'Western Ghats Flash Landslide Relief',
    type: 'Landslide',
    severity: 'Severe',
    affectedDistricts: ['Nilgiris', 'Wayanad'],
    affectedPopulation: 28500,
    startDate: '2026-07-18',
    status: 'Recovery',
    description: 'Hill slope collapses damaging vital roadways and agricultural habitations in high altitude tea estates.',
    expectedReliefBudget: '₹ 22.0 Crores',
    emergencyHelplines: ['1070 (State Relief)', '108 (Ambulance)'],
    centerCoordinates: { lat: 11.4102, lng: 76.695 }
  }
];

export const mockBeneficiaries: Beneficiary[] = [
  {
    id: 'ben_001',
    uniqueQrId: 'QR-RES-2026-8891-TN',
    fullName: 'Lakshmi Narayanan',
    aadhaarNumber: 'XXXX-XXXX-7721',
    govtId: 'TN-RATION-882910',
    phone: '+91 96001 55443',
    email: 'lakshmi.ben@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    address: 'Door 42, River Bank Colony, Chidambaram Road',
    gpsLocation: { lat: 11.7512, lng: 79.7688 },
    state: 'Tamil Nadu',
    district: 'Cuddalore',
    taluk: 'Chidambaram',
    village: 'Kullanchavadi',
    pincode: '608001',
    familyMembers: [
      { name: 'Narayanan (Spouse)', age: 68, gender: 'Male', relation: 'Husband' },
      { name: 'Kavitha (Daughter)', age: 8, gender: 'Female', relation: 'Daughter' },
      { name: 'Paati (Mother-in-law)', age: 82, gender: 'Female', relation: 'Senior Mother' }
    ],
    familyCount: 4,
    monthlyIncome: 6500,
    occupation: 'Agricultural Laborer',
    isDisbled: false,
    isPregnant: false,
    isSeniorCitizen: true,
    hasMedicalCondition: true,
    medicalDetails: 'Hypertension & Insulin Dependent Diabetes (Aged 82 Mother)',
    childrenCount: 1,
    livestockCount: 2,
    housingDamage: 'Total Collapse',
    currentShelter: 'St. Joseph Higher Secondary Camp #2',
    requiredAid: ['Ration Ration Kit', 'Clean Drinking Water', 'Insulin & BP Meds', 'Tents & Tarpaulins', 'Baby Supplies'],
    bankAccount: '9921001298812',
    ifscCode: 'SBIN0001290',
    upiId: 'lakshmi@okaxis',
    emergencyContact: '+91 94441 99201',
    liveSelfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    signatureUrl: 'https://placehold.co/300x100/0b3d91/ffffff?text=Lakshmi+Sign',
    supportingDocUrl: 'https://placehold.co/600x400/e2e8f0/1e293b?text=Aadhaar+Govt+ID+Scanned',
    priorityScore: 94,
    priorityLevel: 'High',
    identityConfidenceScore: 98,
    riskScore: 2,
    ocrVerified: true,
    faceMatchScore: 96,
    duplicateFlag: false,
    verificationStatus: 'Approved',
    aidDistributionStatus: 'Partially Distributed',
    registeredAt: '2026-07-25 09:30 AM',
    disasterId: 'dis_2026_01'
  },
  {
    id: 'ben_002',
    uniqueQrId: 'QR-RES-2026-4412-TN',
    fullName: 'Ramanathan K',
    aadhaarNumber: 'XXXX-XXXX-3349',
    govtId: 'TN-VOTER-109283',
    phone: '+91 94421 88102',
    email: 'ramanathan.k@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    address: 'Plot 15, Fishermen Colony, Coastal Road',
    gpsLocation: { lat: 11.7389, lng: 79.7801 },
    state: 'Tamil Nadu',
    district: 'Cuddalore',
    taluk: 'Cuddalore Old Town',
    village: 'Sonankuppam',
    pincode: '607003',
    familyMembers: [
      { name: 'Devi (Spouse)', age: 31, gender: 'Female', relation: 'Wife' },
      { name: 'Infant Child', age: 1, gender: 'Male', relation: 'Son' }
    ],
    familyCount: 3,
    monthlyIncome: 8000,
    occupation: 'Small Scale Fisherman',
    isDisbled: false,
    isPregnant: true,
    isSeniorCitizen: false,
    hasMedicalCondition: false,
    childrenCount: 1,
    livestockCount: 0,
    housingDamage: 'Severe Damage',
    currentShelter: 'Government Boys High School Camp',
    requiredAid: ['Pregnant Care Kit', 'Baby Food', 'Dry Ration Pack', 'Blankets'],
    bankAccount: '1109299388172',
    ifscCode: 'IOBA0001092',
    upiId: 'raman@icici',
    emergencyContact: '+91 98842 11092',
    priorityScore: 88,
    priorityLevel: 'High',
    identityConfidenceScore: 95,
    riskScore: 5,
    ocrVerified: true,
    faceMatchScore: 94,
    duplicateFlag: false,
    verificationStatus: 'Approved',
    aidDistributionStatus: 'Not Distributed',
    registeredAt: '2026-07-26 11:15 AM',
    disasterId: 'dis_2026_01'
  },
  {
    id: 'ben_003',
    uniqueQrId: 'QR-RES-2026-9901-TN',
    fullName: 'Suresh Kumar M',
    aadhaarNumber: 'XXXX-XXXX-9901',
    govtId: 'TN-RATION-990111',
    phone: '+91 97102 33411',
    email: 'suresh.m@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    address: 'East Street, Sub-station Backside',
    gpsLocation: { lat: 11.7599, lng: 79.7541 },
    state: 'Tamil Nadu',
    district: 'Cuddalore',
    taluk: 'Kurinjipadi',
    village: 'Vadalur',
    pincode: '607303',
    familyMembers: [
      { name: 'Gowri (Spouse)', age: 40, gender: 'Female', relation: 'Wife' }
    ],
    familyCount: 2,
    monthlyIncome: 15000,
    occupation: 'Shopkeeper',
    isDisbled: false,
    isPregnant: false,
    isSeniorCitizen: false,
    hasMedicalCondition: false,
    childrenCount: 0,
    livestockCount: 0,
    housingDamage: 'Minor Damage',
    currentShelter: 'Home (Water Receded)',
    requiredAid: ['Drinking Water', 'Sanitary Kit'],
    bankAccount: '448109281172',
    ifscCode: 'HDFC0004481',
    upiId: 'suresh@hdfc',
    emergencyContact: '+91 97102 33411',
    priorityScore: 42,
    priorityLevel: 'Low',
    identityConfidenceScore: 89,
    riskScore: 12,
    ocrVerified: true,
    faceMatchScore: 91,
    duplicateFlag: false,
    verificationStatus: 'Approved',
    aidDistributionStatus: 'Fully Distributed',
    registeredAt: '2026-07-27 02:40 PM',
    disasterId: 'dis_2026_01'
  },
  {
    id: 'ben_004',
    uniqueQrId: 'QR-RES-2026-7782-FLAGGED',
    fullName: 'Anand Sharma (Duplicate Claim)',
    aadhaarNumber: 'XXXX-XXXX-7721', // Duplicate of Lakshmi's family or matching record
    govtId: 'TN-FAKE-00192',
    phone: '+91 99999 11111',
    email: 'anand.flagged@temp.com',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    address: 'Unknown Temporary Shack',
    gpsLocation: { lat: 13.0827, lng: 80.2707 }, // 180km away from disaster center!
    state: 'Tamil Nadu',
    district: 'Cuddalore',
    taluk: 'Chidambaram',
    village: 'Kullanchavadi',
    pincode: '608001',
    familyMembers: [],
    familyCount: 1,
    monthlyIncome: 45000,
    occupation: 'Trader',
    isDisbled: false,
    isPregnant: false,
    isSeniorCitizen: false,
    hasMedicalCondition: false,
    childrenCount: 0,
    livestockCount: 0,
    housingDamage: 'None',
    currentShelter: 'None',
    requiredAid: ['Cash Relief ₹10000', 'Gold Assistance Kit'],
    bankAccount: '000192837461',
    ifscCode: 'UTIB0000001',
    upiId: 'fake@okicici',
    emergencyContact: '+91 99999 11111',
    priorityScore: 15,
    priorityLevel: 'Low',
    identityConfidenceScore: 24,
    riskScore: 96,
    ocrVerified: false,
    faceMatchScore: 35,
    duplicateFlag: true,
    verificationStatus: 'Rejected',
    aidDistributionStatus: 'Not Distributed',
    registeredAt: '2026-07-28 08:10 PM',
    disasterId: 'dis_2026_01'
  }
];

export const mockReliefCamps: ReliefCamp[] = [
  {
    id: 'camp_001',
    name: 'St. Joseph Higher Sec. Relief Center',
    district: 'Cuddalore',
    disasterId: 'dis_2026_01',
    capacity: 1200,
    currentOccupancy: 840,
    inChargeOfficer: 'M. Thanikachalam (Deputy Tahsildar)',
    contactPhone: '+91 94432 09182',
    facilities: {
      doctorsCount: 6,
      foodKitsAvailable: 1500,
      waterLitersAvailable: 8000,
      electricitySupply: true,
      bedsAvailable: 360,
      toiletsCount: 24,
      womenSafetyZone: true,
      childrenZone: true
    },
    coordinates: { lat: 11.7525, lng: 79.7645 }
  },
  {
    id: 'camp_002',
    name: 'Government Boys High School Camp',
    district: 'Cuddalore',
    disasterId: 'dis_2026_01',
    capacity: 800,
    currentOccupancy: 620,
    inChargeOfficer: 'S. Rajeswari (Revenue Inspector)',
    contactPhone: '+91 94441 87234',
    facilities: {
      doctorsCount: 4,
      foodKitsAvailable: 750,
      waterLitersAvailable: 4200,
      electricitySupply: true,
      bedsAvailable: 180,
      toiletsCount: 16,
      womenSafetyZone: true,
      childrenZone: true
    },
    coordinates: { lat: 11.7410, lng: 79.7720 }
  },
  {
    id: 'camp_003',
    name: 'Annamalai University Indoor Stadium Safe House',
    district: 'Cuddalore',
    disasterId: 'dis_2026_01',
    capacity: 2500,
    currentOccupancy: 1950,
    inChargeOfficer: 'Dr. V. Arulmani (Special Officer)',
    contactPhone: '+91 94422 10928',
    facilities: {
      doctorsCount: 12,
      foodKitsAvailable: 3200,
      waterLitersAvailable: 15000,
      electricitySupply: true,
      bedsAvailable: 550,
      toiletsCount: 48,
      womenSafetyZone: true,
      childrenZone: true
    },
    coordinates: { lat: 11.3912, lng: 79.7148 }
  }
];

export const mockWarehouses: Warehouse[] = [
  {
    id: 'wh_001',
    name: 'Central Civil Supplies Storage Facility #1',
    location: 'Port Road, Industrial Zone',
    district: 'Cuddalore',
    managerName: 'K. Senthil Kumar',
    managerPhone: '+91 98401 22910',
    totalCapacityTons: 500,
    usedCapacityTons: 320,
    coordinates: { lat: 11.7450, lng: 79.7600 }
  },
  {
    id: 'wh_002',
    name: 'Red Cross Regional Humanitarian Depot',
    location: 'NH-45 Bypass Junction',
    district: 'Cuddalore',
    managerName: 'S. Subhashini',
    managerPhone: '+91 97890 33211',
    totalCapacityTons: 300,
    usedCapacityTons: 190,
    coordinates: { lat: 11.7610, lng: 79.7420 }
  }
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv_001',
    warehouseId: 'wh_001',
    warehouseName: 'Central Civil Supplies Storage Facility #1',
    category: 'Food',
    name: 'Essential Dry Ration Pack (10kg Rice, Pulses, Oil, Spices)',
    quantityAvailable: 4200,
    quantityReserved: 800,
    quantityDistributed: 12500,
    unit: 'Kits',
    supplier: 'TN Civil Supplies Corporation',
    expiryDate: '2027-01-15'
  },
  {
    id: 'inv_002',
    warehouseId: 'wh_001',
    warehouseName: 'Central Civil Supplies Storage Facility #1',
    category: 'Water',
    name: 'Purified Mineral Water Bottles (5 Liters)',
    quantityAvailable: 14500,
    quantityReserved: 3000,
    quantityDistributed: 48000,
    unit: 'Liters',
    supplier: 'WaterAid Foundation India'
  },
  {
    id: 'inv_003',
    warehouseId: 'wh_002',
    warehouseName: 'Red Cross Regional Humanitarian Depot',
    category: 'Medicines',
    name: 'First Aid & Cholera Prevention Kits',
    quantityAvailable: 1850,
    quantityReserved: 400,
    quantityDistributed: 3200,
    unit: 'Kits',
    supplier: 'WHO Emergency Medical Supply',
    expiryDate: '2027-06-30'
  },
  {
    id: 'inv_004',
    warehouseId: 'wh_002',
    warehouseName: 'Red Cross Regional Humanitarian Depot',
    category: 'Blankets',
    name: 'All-Weather Thermal Woolen Blankets',
    quantityAvailable: 3100,
    quantityReserved: 500,
    quantityDistributed: 8400,
    unit: 'Units',
    supplier: 'National Relief Cadre'
  },
  {
    id: 'inv_005',
    warehouseId: 'wh_001',
    warehouseName: 'Central Civil Supplies Storage Facility #1',
    category: 'Sanitary Kits',
    name: 'Dignity Hygiene & Sanitation Pack',
    quantityAvailable: 2900,
    quantityReserved: 600,
    quantityDistributed: 6100,
    unit: 'Kits',
    supplier: 'UNICEF India'
  },
  {
    id: 'inv_006',
    warehouseId: 'wh_002',
    warehouseName: 'Red Cross Regional Humanitarian Depot',
    category: 'Baby Food',
    name: 'Infant Fortified Milk & Porridge Kit',
    quantityAvailable: 1200,
    quantityReserved: 300,
    quantityDistributed: 2900,
    unit: 'Kits',
    supplier: 'Child Relief Foundation'
  }
];

export const mockDistributions: DistributionRecord[] = [
  {
    id: 'dist_901',
    receiptId: 'RCP-20260728-091',
    beneficiaryId: 'ben_001',
    beneficiaryName: 'Lakshmi Narayanan',
    beneficiaryQrId: 'QR-RES-2026-8891-TN',
    disasterId: 'dis_2026_01',
    campId: 'camp_001',
    volunteerId: 'usr_004',
    volunteerName: 'Priya Sundaram',
    itemsDistributed: [
      { item: 'Essential Dry Ration Pack', quantity: 1, unit: 'Kits' },
      { item: 'Purified Mineral Water', quantity: 10, unit: 'Liters' },
      { item: 'Thermal Blankets', quantity: 2, unit: 'Units' }
    ],
    gpsLocation: { lat: 11.7525, lng: 79.7645 },
    liveSelfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    digitalSignatureUrl: 'https://placehold.co/300x100/0b3d91/ffffff?text=Verified+Lakshmi',
    timestamp: '2026-07-28 10:14 AM',
    blockchainHash: '0x8f2a11b938c4491a0293e887e1a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1'
  },
  {
    id: 'dist_902',
    receiptId: 'RCP-20260728-114',
    beneficiaryId: 'ben_003',
    beneficiaryName: 'Suresh Kumar M',
    beneficiaryQrId: 'QR-RES-2026-9901-TN',
    disasterId: 'dis_2026_01',
    campId: 'camp_002',
    volunteerId: 'usr_004',
    volunteerName: 'Priya Sundaram',
    itemsDistributed: [
      { item: 'Purified Mineral Water', quantity: 5, unit: 'Liters' },
      { item: 'Dignity Hygiene Pack', quantity: 1, unit: 'Kits' }
    ],
    gpsLocation: { lat: 11.7410, lng: 79.7720 },
    timestamp: '2026-07-28 03:22 PM',
    blockchainHash: '0x7e1b99a44012c88d123e456f789a012b345c678d901e234f567a890b123c456d'
  }
];

export const mockFraudAlerts: FraudAlert[] = [
  {
    id: 'frd_001',
    beneficiaryId: 'ben_004',
    beneficiaryName: 'Anand Sharma (Duplicate Claim)',
    type: 'GPS Mismatch',
    severity: 'High',
    description: 'Registration GPS coordinates located 180 km away from declared affected disaster zone.',
    flaggedByAi: true,
    riskScore: 96,
    status: 'Open',
    detectedAt: '2026-07-28 08:10 PM',
    details: {
      registeredLat: 13.0827,
      registeredLng: 80.2707,
      declaredDistrict: 'Cuddalore',
      disasterZoneDistanceKm: 182,
      ipCountry: 'India',
      deviceRiskIndex: 'High Spoof Risk'
    }
  },
  {
    id: 'frd_002',
    type: 'Duplicate Face',
    severity: 'High',
    description: 'AI Face Verification algorithm matched photo with existing registered beneficiary in Nagapattinam camp.',
    flaggedByAi: true,
    riskScore: 91,
    status: 'Investigating',
    detectedAt: '2026-07-27 11:05 AM',
    details: {
      similarityConfidence: 94.8,
      existingId: 'ben_882',
      existingDistrict: 'Nagapattinam'
    }
  },
  {
    id: 'frd_003',
    type: 'Fake Document',
    severity: 'Medium',
    description: 'Aadhaar OCR document scanner flagged digitally altered text font alignment on photo ID upload.',
    flaggedByAi: true,
    riskScore: 78,
    status: 'Open',
    detectedAt: '2026-07-26 04:45 PM',
    details: {
      ocrConfidence: 34.2,
      fontTamperMetric: 'High anomaly detected in name block'
    }
  }
];

export const mockBlockchainBlocks: BlockchainBlock[] = [
  {
    index: 104,
    timestamp: '2026-07-28 10:14 AM',
    transactionsCount: 14,
    previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    hash: '0x8f2a11b938c4491a0293e887e1a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    receiptIds: ['RCP-20260728-091', 'RCP-20260728-092', 'RCP-20260728-093'],
    verifiedBy: 'Node-Gov-TN-HQ-01'
  },
  {
    index: 105,
    timestamp: '2026-07-28 03:22 PM',
    transactionsCount: 22,
    previousHash: '0x8f2a11b938c4491a0293e887e1a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    hash: '0x7e1b99a44012c88d123e456f789a012b345c678d901e234f567a890b123c456d',
    receiptIds: ['RCP-20260728-114', 'RCP-20260728-115'],
    verifiedBy: 'Node-NDMA-National-Core'
  }
];

export const mockHospitals: Hospital[] = [
  {
    id: 'hosp_001',
    name: 'Government Head Quarters Hospital',
    district: 'Cuddalore',
    availableBeds: 85,
    totalICUBeds: 18,
    doctorsOnDuty: 24,
    ambulancesAvailable: 8,
    contactNumber: '04142-230101',
    coordinates: { lat: 11.7489, lng: 79.7712 },
    emergencyLevel: 'High Demand'
  },
  {
    id: 'hosp_002',
    name: 'Rajah Muthiah Medical College & Hospital',
    district: 'Cuddalore',
    availableBeds: 210,
    totalICUBeds: 45,
    doctorsOnDuty: 58,
    ambulancesAvailable: 15,
    contactNumber: '04144-238210',
    coordinates: { lat: 11.3950, lng: 79.7120 },
    emergencyLevel: 'Normal'
  }
];

export const mockWeatherTelemetry: WeatherTelemetry = {
  temperature: 28.4,
  humidity: 89,
  rainfallMm: 142.5,
  windSpeedKmh: 68.2,
  cycloneRisk: 'Warning',
  floodRiskLevel: 'Severe Flood Alert',
  waterSensorLevelMeters: 4.85,
  sensorThresholdMeters: 4.00,
  lastUpdated: 'Just now (Live IoT Stream)'
};

export const mockEmergencySos: EmergencySos[] = [
  {
    id: 'sos_001',
    callerName: 'Murugan V',
    phone: '+91 98402 11928',
    gpsLocation: { lat: 11.7580, lng: 79.7690 },
    emergencyType: 'Trapped',
    message: 'Water entered 1st floor roof in South Street. 4 elderly family members stranded.',
    timestamp: '12 mins ago',
    status: 'Active'
  },
  {
    id: 'sos_002',
    callerName: 'Devi Saravanan',
    phone: '+91 97910 88219',
    gpsLocation: { lat: 11.7410, lng: 79.7750 },
    emergencyType: 'Medical',
    message: 'Pregnant mother in active labor needs immediate ambulance evacuation to HQ hospital.',
    timestamp: '28 mins ago',
    status: 'Dispatched'
  }
];

export const mockComplaints: Complaint[] = [
  {
    id: 'cmp_101',
    beneficiaryId: 'ben_001',
    beneficiaryName: 'Lakshmi Narayanan',
    category: 'Missing Aid',
    description: 'Requested insulin & BP medicine kit, but only ration pack delivered yesterday.',
    aiPriority: 'High',
    status: 'In Progress',
    filedAt: '2026-07-28 06:00 PM',
    assignedOfficer: 'Dr. V. Arulmani'
  },
  {
    id: 'cmp_102',
    beneficiaryId: 'ben_002',
    beneficiaryName: 'Ramanathan K',
    category: 'Wrong Verification',
    description: 'Voter card uploaded shows partial blur on pincode column.',
    aiPriority: 'Medium',
    status: 'Pending',
    filedAt: '2026-07-28 07:30 PM'
  }
];
