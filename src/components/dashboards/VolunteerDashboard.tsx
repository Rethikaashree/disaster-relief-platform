import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { Beneficiary, DistributionRecord } from '../../types';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  UserCheck, 
  ShieldCheck, 
  PackageCheck, 
  MapPin, 
  Sparkles,
  WifiOff,
  Search,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const VolunteerDashboard: React.FC = () => {
  const { beneficiaries, recordDistribution, distributions } = useDisaster();
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(beneficiaries[0] || null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  // Aid items to distribute
  const [rationQty, setRationQty] = useState(1);
  const [waterQty, setWaterQty] = useState(10);
  const [blanketQty, setBlanketQty] = useState(2);
  const [receiptRecord, setReceiptRecord] = useState<DistributionRecord | null>(null);

  const handleSimulateQrScan = (ben: Beneficiary) => {
    setIsScanning(true);
    setScanSuccess(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      setSelectedBeneficiary(ben);
    }, 1200);
  };

  const handleDispatchAid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeneficiary) return;

    const items = [
      { item: 'Essential Dry Ration Pack', quantity: rationQty, unit: 'Kits' },
      { item: 'Purified Mineral Water', quantity: waterQty, unit: 'Liters' },
      { item: 'Thermal Woolen Blankets', quantity: blanketQty, unit: 'Units' }
    ];

    const record = recordDistribution(
      selectedBeneficiary.id,
      'usr_004',
      'Priya Sundaram (Vol)',
      items
    );

    setReceiptRecord(record);

    // Trigger success confetti animation!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-xl">Field Volunteer Smart QR Scanner App</h2>
            <p className="text-xs text-amber-400">Offline-First Beneficiary Verification & Digital Receipt Delivery</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Offline Sync Ready</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: QR Scanner & Victim List */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 text-center">
            <h4 className="font-bold text-white text-sm">Camera QR Scanner Feed</h4>

            <div className="w-full h-52 bg-slate-950 rounded-2xl border-2 border-dashed border-cyan-500/40 flex flex-col items-center justify-center relative overflow-hidden">
              {isScanning ? (
                <div className="space-y-2 text-cyan-400">
                  <div className="w-16 h-16 rounded-2xl border-2 border-cyan-400 border-t-transparent animate-spin mx-auto"></div>
                  <span className="text-xs font-bold block">Scanning Cryptographic QR Pass...</span>
                </div>
              ) : scanSuccess ? (
                <div className="space-y-2 text-emerald-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
                  <span className="text-xs font-bold block">QR Pass Verified Clean!</span>
                </div>
              ) : (
                <div className="space-y-2 text-slate-400">
                  <Camera className="w-10 h-10 mx-auto text-slate-500" />
                  <span className="text-xs block">Position Beneficiary QR Code inside scanner camera</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">Select victim from queue below to simulate live camera scan:</p>

            <div className="space-y-2 max-h-48 overflow-y-auto text-left">
              {beneficiaries.map(ben => (
                <button
                  key={ben.id}
                  onClick={() => handleSimulateQrScan(ben)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    selectedBeneficiary?.id === ben.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={ben.photoUrl} alt={ben.fullName} className="w-7 h-7 rounded-lg object-cover" />
                    <span>{ben.fullName}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{ben.uniqueQrId}</span>
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* Right Column: Beneficiary Details & Digital Receipt Generator */}
        <div className="lg:col-span-7">
          {selectedBeneficiary ? (
            <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 space-y-6">
              
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBeneficiary.photoUrl}
                    alt={selectedBeneficiary.fullName}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-400"
                  />
                  <div>
                    <h3 className="font-extrabold text-white text-base">{selectedBeneficiary.fullName}</h3>
                    <p className="text-xs text-slate-400">Aadhaar: {selectedBeneficiary.aadhaarNumber}</p>
                    <p className="text-xs text-cyan-400 font-bold">Priority: {selectedBeneficiary.priorityScore}% ({selectedBeneficiary.priorityLevel})</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  {selectedBeneficiary.verificationStatus}
                </span>
              </div>

              {/* Form to issue relief kit */}
              {!receiptRecord ? (
                <form onSubmit={handleDispatchAid} className="space-y-4 text-xs">
                  <h4 className="font-bold text-white text-sm">Issue Digital Aid Distribution Receipt</h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Ration Kit (Kits)</label>
                      <input
                        type="number"
                        min={1}
                        value={rationQty}
                        onChange={e => setRationQty(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Water Supply (Liters)</label>
                      <input
                        type="number"
                        min={1}
                        value={waterQty}
                        onChange={e => setWaterQty(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Woolen Blankets</label>
                      <input
                        type="number"
                        min={0}
                        value={blanketQty}
                        onChange={e => setBlanketQty(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Volunteer Live Selfie Capture & Signature Attached</span>
                    <span className="text-emerald-400 font-bold">Verified ✅</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110"
                  >
                    Confirm Delivery & Mint Blockchain Hash 🚀
                  </button>
                </form>
              ) : (
                /* Generated Receipt */
                <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/40 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-400" />
                      <span className="font-extrabold text-white text-sm">DIGITAL RECEIPT #{receiptRecord.receiptId}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">CONFIRMED</span>
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <div>Beneficiary: <strong className="text-white">{receiptRecord.beneficiaryName}</strong></div>
                    <div>Volunteer: <strong className="text-slate-200">{receiptRecord.volunteerName}</strong></div>
                    <div>Timestamp: {receiptRecord.timestamp}</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Cryptographic Blockchain Hash</span>
                    <span className="font-mono text-cyan-300 text-[11px] font-bold break-all">{receiptRecord.blockchainHash}</span>
                  </div>

                  <button
                    onClick={() => setReceiptRecord(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
                  >
                    Issue Next Delivery
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl text-center text-slate-400 text-xs">
              Select a beneficiary to open field distribution receipt generator.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
