import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { Beneficiary, FamilyMember } from '../../types';
import { SmartQrCard } from './SmartQrCard';
import { 
  X, 
  User, 
  FileText, 
  MapPin, 
  Heart, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Scan,
  Cpu
} from 'lucide-react';
import { simulateOcrExtraction, simulateFaceMatch, OcrResult, FaceMatchResult } from '../../utils/aiSimulation';

interface BeneficiaryRegistrationWizardProps {
  onClose: () => void;
}

export const BeneficiaryRegistrationWizard: React.FC<BeneficiaryRegistrationWizardProps> = ({ onClose }) => {
  const { addBeneficiary } = useDisaster();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [govtId, setGovtId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Cuddalore');
  const [taluk, setTaluk] = useState('Chidambaram');
  const [village, setVillage] = useState('Kullanchavadi');
  const [pincode, setPincode] = useState('608001');
  const [gpsLocation, setGpsLocation] = useState({ lat: 11.7512, lng: 79.7688 });

  // Vulnerability Metrics
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isDisbled, setIsDisabled] = useState(false);
  const [hasMedicalCondition, setHasMedicalCondition] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(6500);
  const [occupation, setOccupation] = useState('Daily Wage Laborer');
  const [childrenCount, setChildrenCount] = useState(1);
  const [livestockCount, setLivestockCount] = useState(0);
  const [housingDamage, setHousingDamage] = useState<Beneficiary['housingDamage']>('Total Collapse');
  const [currentShelter, setCurrentShelter] = useState('St. Joseph Higher Secondary Camp #2');

  // Aid & Bank
  const [requiredAid, setRequiredAid] = useState<string[]>(['Ration Kit', 'Drinking Water', 'Blankets']);
  const [bankAccount, setBankAccount] = useState('9921001298812');
  const [ifscCode, setIfscCode] = useState('SBIN0001290');
  const [upiId, setUpiId] = useState('beneficiary@okaxis');
  const [emergencyContact, setEmergencyContact] = useState('+91 94441 99201');

  // AI Verification State
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [faceResult, setFaceResult] = useState<FaceMatchResult | null>(null);
  const [createdBeneficiary, setCreatedBeneficiary] = useState<Beneficiary | null>(null);

  const aidOptions = [
    'Ration Kit',
    'Drinking Water',
    'Medical Supplies',
    'Blankets & Clothing',
    'Tents & Tarpaulins',
    'Hygiene & Sanitary Kit',
    'Baby Food',
    'Livestock Feed'
  ];

  const handleAidToggle = (aid: string) => {
    setRequiredAid(prev => 
      prev.includes(aid) ? prev.filter(a => a !== aid) : [...prev, aid]
    );
  };

  const handleAutoGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsLocation({ lat: 11.7512, lng: 79.7688 })
      );
    }
  };

  const handleRunAiVerification = async () => {
    setIsOcrProcessing(true);
    const ocr = await simulateOcrExtraction(fullName || 'aadhaar_scan.jpg');
    const face = await simulateFaceMatch();

    setOcrResult(ocr);
    setFaceResult(face);
    setIsOcrProcessing(false);

    if (ocr.extractedName && !fullName) {
      setFullName(ocr.extractedName);
    }
  };

  const handleSubmitRegistration = () => {
    const beneficiaryData: Partial<Beneficiary> = {
      fullName: fullName || 'Lakshmi Narayanan',
      aadhaarNumber: aadhaarNumber || '7721-8891-9921',
      govtId: govtId || 'TN-RATION-882910',
      phone: phone || '+91 96001 55443',
      email: email || 'beneficiary@rescuaid.gov.in',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      address: address || 'Door 42, River Bank Colony',
      gpsLocation,
      state,
      district,
      taluk,
      village,
      pincode,
      familyMembers: [],
      monthlyIncome,
      occupation,
      isSeniorCitizen,
      isPregnant,
      isDisbled,
      hasMedicalCondition,
      medicalDetails,
      childrenCount,
      livestockCount,
      housingDamage,
      currentShelter,
      requiredAid,
      bankAccount,
      ifscCode,
      upiId,
      emergencyContact,
      ocrVerified: ocrResult?.isAuthentic !== false,
      faceMatchScore: faceResult?.matchScore || 95
    };

    const created = addBeneficiary(beneficiaryData);
    setCreatedBeneficiary(created);
    setStep(5); // Show QR Card
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Disaster Victim Registration Wizard
              </h3>
              <p className="text-xs text-slate-400">Step {step} of 5 • AI Verified Identity Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className={step >= 1 ? 'text-cyan-400 font-bold' : ''}>1. Personal & ID</span>
          <span>→</span>
          <span className={step >= 2 ? 'text-cyan-400 font-bold' : ''}>2. Vulnerability</span>
          <span>→</span>
          <span className={step >= 3 ? 'text-cyan-400 font-bold' : ''}>3. Required Aid</span>
          <span>→</span>
          <span className={step >= 4 ? 'text-cyan-400 font-bold' : ''}>4. AI OCR & Selfie</span>
          <span>→</span>
          <span className={step >= 5 ? 'text-cyan-400 font-bold' : ''}>5. Smart QR Pass</span>
        </div>

        {/* Step Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Lakshmi Narayanan"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Aadhaar Number (12 Digits) *</label>
                  <input
                    type="text"
                    placeholder="7721-8891-9921"
                    value={aadhaarNumber}
                    onChange={e => setAadhaarNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 96001 55443"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ration Card / Govt ID *</label>
                  <input
                    type="text"
                    placeholder="TN-RATION-882910"
                    value={govtId}
                    onChange={e => setGovtId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Residential Address *</label>
                <input
                  type="text"
                  placeholder="Door number, street name, locality"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Taluk</label>
                  <input
                    type="text"
                    value={taluk}
                    onChange={e => setTaluk(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Village</label>
                  <input
                    type="text"
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* GPS Auto Detect */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>GPS Coordinates: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGps}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30 hover:bg-cyan-500/30"
                >
                  Auto-Detect GPS
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: Vulnerability Metrics */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Vulnerability & Damage Assessment</h4>
              <p className="text-xs text-slate-400">Select applicable conditions to compute AI Priority Score</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={isSeniorCitizen}
                    onChange={e => setIsSeniorCitizen(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <span className="text-xs text-slate-200 font-semibold">Senior Citizen Household (&gt;60 yrs)</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={e => setIsPregnant(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <span className="text-xs text-slate-200 font-semibold">Pregnant Woman / Nursing Mother</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={isDisbled}
                    onChange={e => setIsDisabled(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <span className="text-xs text-slate-200 font-semibold">Person with Disability (PwD)</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={hasMedicalCondition}
                    onChange={e => setHasMedicalCondition(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <span className="text-xs text-slate-200 font-semibold">Critical Chronic Medical Condition</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Housing Damage Level</label>
                  <select
                    value={housingDamage}
                    onChange={e => setHousingDamage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Total Collapse">Total Collapse (Homeless)</option>
                    <option value="Severe Damage">Severe Structural Damage</option>
                    <option value="Partial Damage">Partial Flooding Damage</option>
                    <option value="Minor Damage">Minor Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monthly Family Income (₹)</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Required Relief Aid */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Select Required Relief Resources</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {aidOptions.map(aid => (
                  <button
                    key={aid}
                    type="button"
                    onClick={() => handleAidToggle(aid)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      requiredAid.includes(aid)
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {aid}
                  </button>
                ))}
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={e => setIfscCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI OCR & Selfie Match */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-left space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Automated Verification Engine</span>
                </div>
                <p className="text-xs text-slate-300">
                  Run simulated document OCR and facial biometrics comparison to generate fraud risk index.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAiVerification}
                disabled={isOcrProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 font-extrabold text-sm shadow-xl hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
              >
                <Cpu className="w-5 h-5" />
                <span>{isOcrProcessing ? 'Extracting OCR & Matching Face...' : 'Trigger AI OCR & Face Match Scan'}</span>
              </button>

              {ocrResult && faceResult && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span>OCR Document Scan</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-white">Extracted: {ocrResult.extractedName}</p>
                    <p className="text-[11px] text-slate-400">Confidence: {ocrResult.ocrConfidence}%</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                      <span>Biometric Face Match</span>
                      <Scan className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-white">Similarity Score: {faceResult.matchScore}%</p>
                    <p className="text-[11px] text-emerald-400">Liveness Passed</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 5: Generated QR Pass */}
          {step === 5 && createdBeneficiary && (
            <div className="flex justify-center py-4">
              <SmartQrCard beneficiary={createdBeneficiary} onClose={onClose} />
            </div>
          )}

        </div>

        {/* Footer Navigation Controls */}
        {step < 5 && (
          <div className="p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev + 1)}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 hover:bg-cyan-400"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitRegistration}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:brightness-110"
              >
                <span>Finalize & Generate QR Pass</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
