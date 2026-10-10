import type { Beneficiary, PriorityLevel } from '../types';

export interface OcrResult {
  extractedName: string;
  extractedAadhaar: string;
  extractedAddress: string;
  extractedDob: string;
  ocrConfidence: number; // 0 - 100
  fontAuthenticityScore: number; // 0 - 100
  isAuthentic: boolean;
}

export interface FaceMatchResult {
  matchScore: number; // 0 - 100
  facialLandmarksFound: number;
  livenessDetected: boolean;
  confidenceText: string;
}

export interface PriorityScoreResult {
  score: number; // 0 - 100
  level: PriorityLevel;
  breakdown: { label: string; points: number }[];
}

export interface FraudAnalysisResult {
  riskScore: number; // 0 - 100
  isFraudulent: boolean;
  flags: string[];
  recommendation: 'Auto-Approve' | 'Manual Inspection Needed' | 'High Risk - Flag & Block';
}

/**
 * Simulates AI Document OCR Extraction for Aadhaar / Govt IDs
 */
export async function simulateOcrExtraction(fileNameOrUrl: string): Promise<OcrResult> {
  await new Promise(res => setTimeout(res, 1200));

  const isTestSuspicious = fileNameOrUrl.toLowerCase().includes('fake') || fileNameOrUrl.toLowerCase().includes('tampered');

  if (isTestSuspicious) {
    return {
      extractedName: 'ANAND SHARMA (TAMPERED)',
      extractedAadhaar: '9982-1029-3381',
      extractedAddress: 'T. Nagar, Chennai - 600017',
      extractedDob: '1985-05-12',
      ocrConfidence: 42,
      fontAuthenticityScore: 38,
      isAuthentic: false
    };
  }

  return {
    extractedName: 'LAKSHMI NARAYANAN',
    extractedAadhaar: '7721-8891-9921',
    extractedAddress: '42, River Bank Colony, Kullanchavadi, Cuddalore - 608001',
    extractedDob: '1976-11-24',
    ocrConfidence: 97.4,
    fontAuthenticityScore: 99.1,
    isAuthentic: true
  };
}

/**
 * Simulates Face Matching between live selfie and government ID photo
 */
export async function simulateFaceMatch(): Promise<FaceMatchResult> {
  await new Promise(res => setTimeout(res, 1000));
  
  const matchScore = Math.floor(Math.random() * 12) + 87; // 87 - 99%
  return {
    matchScore,
    facialLandmarksFound: 68,
    livenessDetected: true,
    confidenceText: matchScore > 90 ? 'High Confidence Identity Match' : 'Moderate Match - Verified'
  };
}

/**
 * Computes AI Priority Score based on vulnerable parameters
 */
export function calculatePriorityScore(data: Partial<Beneficiary>): PriorityScoreResult {
  let score = 20; // Base score
  const breakdown: { label: string; points: number }[] = [];

  if (data.isSeniorCitizen) {
    score += 18;
    breakdown.push({ label: 'Senior Citizen in household (>60 yrs)', points: 18 });
  }

  if (data.isPregnant) {
    score += 20;
    breakdown.push({ label: 'Pregnant woman / Nursing mother', points: 20 });
  }

  if (data.isDisbled) {
    score += 20;
    breakdown.push({ label: 'Person with Disability (PwD)', points: 20 });
  }

  if (data.hasMedicalCondition) {
    score += 15;
    breakdown.push({ label: 'Critical medical condition / Chronic illness', points: 15 });
  }

  if (data.housingDamage === 'Total Collapse') {
    score += 22;
    breakdown.push({ label: 'Housing Total Collapse (Homeless)', points: 22 });
  } else if (data.housingDamage === 'Severe Damage') {
    score += 14;
    breakdown.push({ label: 'Housing Severe Structural Damage', points: 14 });
  } else if (data.housingDamage === 'Partial Damage') {
    score += 8;
    breakdown.push({ label: 'Partial Housing Damage', points: 8 });
  }

  if ((data.childrenCount || 0) > 0) {
    const pts = Math.min((data.childrenCount || 0) * 5, 12);
    score += pts;
    breakdown.push({ label: `Young children count (${data.childrenCount})`, points: pts });
  }

  if ((data.monthlyIncome || 0) < 8000) {
    score += 10;
    breakdown.push({ label: 'Below Poverty Line (Income < ₹8,000/mo)', points: 10 });
  }

  const finalScore = Math.min(Math.max(score, 5), 100);
  let level: PriorityLevel = 'Low';
  if (finalScore >= 75) level = 'High';
  else if (finalScore >= 45) level = 'Medium';

  return { score: finalScore, level, breakdown };
}

/**
 * AI Fraud Detection & Anomaly Evaluator
 */
export function analyzeFraudRisk(data: Partial<Beneficiary>, existingList: Beneficiary[]): FraudAnalysisResult {
  const flags: string[] = [];
  let riskScore = 5;

  const dupAadhaar = existingList.find(b => b.aadhaarNumber === data.aadhaarNumber && b.id !== data.id);
  if (dupAadhaar) {
    riskScore += 45;
    flags.push(`Duplicate Aadhaar detected (Already registered under ID: ${dupAadhaar.id})`);
  }

  if (data.gpsLocation) {
    const centerLat = 11.748;
    const centerLng = 79.7714;
    const distKm = Math.sqrt(
      Math.pow(data.gpsLocation.lat - centerLat, 2) + Math.pow(data.gpsLocation.lng - centerLng, 2)
    ) * 111;

    if (distKm > 100) {
      riskScore += 35;
      flags.push(`GPS Spoofing Suspected: Registration coordinates are ${distKm.toFixed(1)} km outside disaster impact boundary`);
    }
  }

  if (data.ocrVerified === false) {
    riskScore += 25;
    flags.push('OCR Document Extraction failed font authenticity check');
  }

  if (data.faceMatchScore && data.faceMatchScore < 50) {
    riskScore += 30;
    flags.push('Live Selfie photo does not match Government ID photo');
  }

  const finalRisk = Math.min(riskScore, 100);
  let recommendation: FraudAnalysisResult['recommendation'] = 'Auto-Approve';
  if (finalRisk > 70) recommendation = 'High Risk - Flag & Block';
  else if (finalRisk > 30) recommendation = 'Manual Inspection Needed';

  return {
    riskScore: finalRisk,
    isFraudulent: finalRisk > 50,
    flags,
    recommendation
  };
}

export function generateDemandForecast() {
  return [
    { category: 'Food Kits', currentStock: 4200, dailyBurnRate: 850, daysRemaining: 4.9, status: 'Critical Refill Needed in 4 Days' },
    { category: 'Drinking Water (L)', currentStock: 14500, dailyBurnRate: 3800, daysRemaining: 3.8, status: 'Urgent Tanker Dispatch Required' },
    { category: 'Medical Kits', currentStock: 1850, dailyBurnRate: 210, daysRemaining: 8.8, status: 'Adequate Stock' },
    { category: 'Blankets', currentStock: 3100, dailyBurnRate: 600, daysRemaining: 5.1, status: 'Moderate Buffer' },
    { category: 'Baby Supplies', currentStock: 1200, dailyBurnRate: 310, daysRemaining: 3.8, status: 'High Vulnerability Shortage Warning' }
  ];
}
