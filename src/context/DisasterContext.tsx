import React, { createContext, useContext, useState } from 'react';
import { 
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

import { 
  mockDisasters, 
  mockBeneficiaries, 
  mockReliefCamps, 
  mockWarehouses, 
  mockInventory, 
  mockDistributions, 
  mockFraudAlerts, 
  mockBlockchainBlocks, 
  mockHospitals, 
  mockWeatherTelemetry, 
  mockEmergencySos, 
  mockComplaints 
} from '../data/mockData';

import { calculatePriorityScore, analyzeFraudRisk } from '../utils/aiSimulation';
import { createDistributionHash, createNewBlock } from '../utils/cryptoLedger';

interface DisasterContextType {
  disasters: DisasterEvent[];
  beneficiaries: Beneficiary[];
  camps: ReliefCamp[];
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  distributions: DistributionRecord[];
  fraudAlerts: FraudAlert[];
  blockchainBlocks: BlockchainBlock[];
  hospitals: Hospital[];
  weather: WeatherTelemetry;
  emergencySosList: EmergencySos[];
  complaints: Complaint[];

  // Action Handlers
  addBeneficiary: (data: Partial<Beneficiary>) => Beneficiary;
  updateBeneficiaryStatus: (id: string, status: Beneficiary['verificationStatus']) => void;
  recordDistribution: (
    beneficiaryId: string, 
    volunteerId: string, 
    volunteerName: string, 
    items: { item: string; quantity: number; unit: string }[]
  ) => DistributionRecord;
  addDisaster: (disaster: Partial<DisasterEvent>) => void;
  addComplaint: (complaint: Partial<Complaint>) => void;
  triggerEmergencySos: (sos: Partial<EmergencySos>) => void;
  resolveFraudAlert: (alertId: string, action: 'Resolved' | 'Dismissed') => void;
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

export const DisasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [disasters, setDisasters] = useState<DisasterEvent[]>(mockDisasters);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(mockBeneficiaries);
  const [camps] = useState<ReliefCamp[]>(mockReliefCamps);
  const [warehouses] = useState<Warehouse[]>(mockWarehouses);
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [distributions, setDistributions] = useState<DistributionRecord[]>(mockDistributions);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>(mockFraudAlerts);
  const [blockchainBlocks, setBlockchainBlocks] = useState<BlockchainBlock[]>(mockBlockchainBlocks);
  const [hospitals] = useState<Hospital[]>(mockHospitals);
  const [weather] = useState<WeatherTelemetry>(mockWeatherTelemetry);
  const [emergencySosList, setEmergencySosList] = useState<EmergencySos[]>(mockEmergencySos);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);

  // Add Beneficiary with AI Analysis
  const addBeneficiary = (data: Partial<Beneficiary>): Beneficiary => {
    const priority = calculatePriorityScore(data);
    const fraudAnalysis = analyzeFraudRisk(data, beneficiaries);

    const newId = `ben_${Date.now().toString().slice(-4)}`;
    const newQrId = `QR-RES-2026-${Math.floor(1000 + Math.random() * 9000)}-TN`;

    const newBeneficiary: Beneficiary = {
      id: newId,
      uniqueQrId: newQrId,
      fullName: data.fullName || 'Anonymous Beneficiary',
      aadhaarNumber: data.aadhaarNumber || 'XXXX-XXXX-0000',
      govtId: data.govtId || 'TN-GOVT-000000',
      phone: data.phone || '+91 90000 00000',
      email: data.email || 'user@rescuaid.gov.in',
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      address: data.address || 'Relief Camp Temporary Shelter',
      gpsLocation: data.gpsLocation || { lat: 11.748, lng: 79.7714 },
      state: data.state || 'Tamil Nadu',
      district: data.district || 'Cuddalore',
      taluk: data.taluk || 'Chidambaram',
      village: data.village || 'Kullanchavadi',
      pincode: data.pincode || '608001',
      familyMembers: data.familyMembers || [],
      familyCount: (data.familyMembers?.length || 0) + 1,
      monthlyIncome: data.monthlyIncome || 0,
      occupation: data.occupation || 'Daily Wage Worker',
      isDisbled: !!data.isDisbled,
      isPregnant: !!data.isPregnant,
      isSeniorCitizen: !!data.isSeniorCitizen,
      hasMedicalCondition: !!data.hasMedicalCondition,
      medicalDetails: data.medicalDetails || '',
      childrenCount: data.childrenCount || 0,
      livestockCount: data.livestockCount || 0,
      housingDamage: data.housingDamage || 'Severe Damage',
      currentShelter: data.currentShelter || 'St. Joseph Higher Sec. Relief Center',
      requiredAid: data.requiredAid || ['Ration Kit', 'Drinking Water', 'Blankets'],
      bankAccount: data.bankAccount || '000000000000',
      ifscCode: data.ifscCode || 'SBIN0000000',
      upiId: data.upiId || 'beneficiary@upi',
      emergencyContact: data.emergencyContact || '+91 90000 00000',
      liveSelfieUrl: data.liveSelfieUrl || data.photoUrl,

      // AI Fields
      priorityScore: priority.score,
      priorityLevel: priority.level,
      identityConfidenceScore: fraudAnalysis.riskScore > 50 ? 25 : 96,
      riskScore: fraudAnalysis.riskScore,
      ocrVerified: data.ocrVerified !== undefined ? data.ocrVerified : true,
      faceMatchScore: data.faceMatchScore || 94,
      duplicateFlag: fraudAnalysis.riskScore > 50,
      verificationStatus: fraudAnalysis.riskScore > 60 ? 'Under Audit' : 'Approved',
      aidDistributionStatus: 'Not Distributed',
      registeredAt: new Date().toLocaleString(),
      disasterId: data.disasterId || 'dis_2026_01'
    };

    setBeneficiaries(prev => [newBeneficiary, ...prev]);

    // If high fraud risk detected, auto generate Fraud Alert
    if (fraudAnalysis.isFraudulent) {
      const alertId = `frd_${Date.now().toString().slice(-4)}`;
      const newAlert: FraudAlert = {
        id: alertId,
        beneficiaryId: newId,
        beneficiaryName: newBeneficiary.fullName,
        type: fraudAnalysis.flags[0]?.includes('Aadhaar') ? 'Duplicate Aadhaar' : 'GPS Mismatch',
        severity: fraudAnalysis.riskScore > 75 ? 'High' : 'Medium',
        description: fraudAnalysis.flags.join(' | '),
        flaggedByAi: true,
        riskScore: fraudAnalysis.riskScore,
        status: 'Open',
        detectedAt: new Date().toLocaleString(),
        details: { flags: fraudAnalysis.flags.join(', ') }
      };
      setFraudAlerts(prev => [newAlert, ...prev]);
    }

    return newBeneficiary;
  };

  const updateBeneficiaryStatus = (id: string, status: Beneficiary['verificationStatus']) => {
    setBeneficiaries(prev => prev.map(b => b.id === id ? { ...b, verificationStatus: status } : b));
  };

  const recordDistribution = (
    beneficiaryId: string, 
    volunteerId: string, 
    volunteerName: string, 
    items: { item: string; quantity: number; unit: string }[]
  ): DistributionRecord => {
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    const receiptId = `RCP-${new Date().toISOString().replace(/\D/g, '').substring(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: DistributionRecord = {
      id: `dist_${Date.now().toString().slice(-4)}`,
      receiptId,
      beneficiaryId,
      beneficiaryName: beneficiary?.fullName || 'Beneficiary',
      beneficiaryQrId: beneficiary?.uniqueQrId || 'QR-UNKNOWN',
      disasterId: beneficiary?.disasterId || 'dis_2026_01',
      campId: 'camp_001',
      volunteerId,
      volunteerName,
      itemsDistributed: items,
      gpsLocation: { lat: 11.7525, lng: 79.7645 },
      liveSelfieUrl: beneficiary?.photoUrl,
      timestamp: new Date().toLocaleString(),
      blockchainHash: ''
    };

    newRecord.blockchainHash = createDistributionHash(newRecord);

    // Update Distributions list
    setDistributions(prev => [newRecord, ...prev]);

    // Update beneficiary status
    setBeneficiaries(prev => prev.map(b => b.id === beneficiaryId ? { ...b, aidDistributionStatus: 'Fully Distributed' } : b));

    // Update inventory stock
    setInventory(prev => prev.map(inv => {
      const matched = items.find(i => inv.name.toLowerCase().includes(i.item.toLowerCase()) || i.item.toLowerCase().includes(inv.category.toLowerCase()));
      if (matched) {
        return {
          ...inv,
          quantityAvailable: Math.max(0, inv.quantityAvailable - matched.quantity),
          quantityDistributed: inv.quantityDistributed + matched.quantity
        };
      }
      return inv;
    }));

    // Mint new Blockchain Block
    const lastBlock = blockchainBlocks[blockchainBlocks.length - 1];
    const nextBlock = createNewBlock(lastBlock, [receiptId], 'Node-Volunteer-Verified');
    setBlockchainBlocks(prev => [...prev, nextBlock]);

    return newRecord;
  };

  const addDisaster = (disaster: Partial<DisasterEvent>) => {
    const newDisaster: DisasterEvent = {
      id: `dis_${Date.now().toString().slice(-4)}`,
      title: disaster.title || 'New Disaster Relief Incident',
      type: disaster.type || 'Flood',
      severity: disaster.severity || 'Severe',
      affectedDistricts: disaster.affectedDistricts || ['Cuddalore'],
      affectedPopulation: disaster.affectedPopulation || 10000,
      startDate: disaster.startDate || new Date().toISOString().split('T')[0],
      status: 'Active',
      description: disaster.description || 'Disaster relief event.',
      expectedReliefBudget: disaster.expectedReliefBudget || '₹ 10.0 Crores',
      emergencyHelplines: ['1077 (District Control)', '112 (National Emergency)'],
      centerCoordinates: disaster.centerCoordinates || { lat: 11.748, lng: 79.7714 }
    };
    setDisasters(prev => [newDisaster, ...prev]);
  };

  const addComplaint = (data: Partial<Complaint>) => {
    const newCmp: Complaint = {
      id: `cmp_${Date.now().toString().slice(-4)}`,
      beneficiaryId: data.beneficiaryId || 'ben_001',
      beneficiaryName: data.beneficiaryName || 'Lakshmi Narayanan',
      category: data.category || 'Missing Aid',
      description: data.description || 'Aid issue reported.',
      aiPriority: data.category === 'Medical Emergency' || data.category === 'Corruption' ? 'High' : 'Medium',
      status: 'Pending',
      filedAt: new Date().toLocaleString()
    };
    setComplaints(prev => [newCmp, ...prev]);
  };

  const triggerEmergencySos = (sosData: Partial<EmergencySos>) => {
    const newSos: EmergencySos = {
      id: `sos_${Date.now().toString().slice(-4)}`,
      callerName: sosData.callerName || 'Distressed Citizen',
      phone: sosData.phone || '+91 99999 00000',
      gpsLocation: sosData.gpsLocation || { lat: 11.748, lng: 79.7714 },
      emergencyType: sosData.emergencyType || 'Medical',
      message: sosData.message || 'Urgent assistance requested.',
      timestamp: 'Just now',
      status: 'Active'
    };
    setEmergencySosList(prev => [newSos, ...prev]);
  };

  const resolveFraudAlert = (alertId: string, action: 'Resolved' | 'Dismissed') => {
    setFraudAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: action } : a));
  };

  return (
    <DisasterContext.Provider
      value={{
        disasters,
        beneficiaries,
        camps,
        warehouses,
        inventory,
        distributions,
        fraudAlerts,
        blockchainBlocks,
        hospitals,
        weather,
        emergencySosList,
        complaints,

        addBeneficiary,
        updateBeneficiaryStatus,
        recordDistribution,
        addDisaster,
        addComplaint,
        triggerEmergencySos,
        resolveFraudAlert
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
};

export const useDisaster = () => {
  const ctx = useContext(DisasterContext);
  if (!ctx) throw new Error('useDisaster must be used within DisasterProvider');
  return ctx;
};
