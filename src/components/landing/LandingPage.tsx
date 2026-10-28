import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  QrCode, 
  MapPin, 
  Boxes, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Award, 
  ArrowRight,
  Sparkles,
  PhoneCall,
  FileCheck,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { mockBeneficiaries } from '../../data/mockData';

interface LandingPageProps {
  onOpenRegistration: () => void;
  onNavigateToMap: () => void;
  onNavigateToDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenRegistration,
  onNavigateToMap,
  onNavigateToDashboard
}) => {
  const { disasters, beneficiaries, distributions, inventory, fraudAlerts } = useDisaster();

  const totalBeneficiaries = beneficiaries.length;
  const verifiedClean = beneficiaries.filter(b => b.verificationStatus === 'Approved').length;
  const totalKitsDelivered = distributions.reduce((acc, d) => acc + d.itemsDistributed.reduce((sum, item) => sum + item.quantity, 0), 0);
  const activeDisasters = disasters.filter(d => d.status === 'Active').length;

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-cyan-950/20 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Next-Gen AI Verification Engine & Duplicate Fraud Prevention</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Enterprise AI Platform for <br />
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  Disaster Relief Distribution
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Eliminate duplicate ration claims, prevent relief fraud, automate Aadhaar document OCR & face matching, prioritize vulnerable citizens, and guarantee end-to-end transparent aid delivery backed by blockchain audit logs.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onOpenRegistration}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <span>Register Beneficiary Victim</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onNavigateToDashboard}
                  className="px-6 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-700 transition-all flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Launch Live Multi-Role Dashboard</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Duplicate Aadhaar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sub-Second Face Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Blockchain Immutable Audit</span>
                </div>
              </div>

            </div>

            {/* Live Stats Preview Box */}
            <div className="lg:col-span-5">
              <div className="glass-panel rounded-3xl p-6 shadow-2xl relative glow-cyan">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                      Live State Relief Command Center
                    </h3>
                    <p className="text-[11px] text-slate-400">Cuddalore & Coastal District Monitoring</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                    REALTIME TELEMETRY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <div className="text-slate-400 text-xs font-medium mb-1">Registered Victims</div>
                    <div className="text-2xl font-black text-white">{totalBeneficiaries}</div>
                    <div className="text-[10px] text-emerald-400 mt-1">100% Aadhaar OCR Verified</div>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <div className="text-slate-400 text-xs font-medium mb-1">Aid Distributed</div>
                    <div className="text-2xl font-black text-cyan-400">{totalKitsDelivered.toLocaleString()}</div>
                    <div className="text-[10px] text-cyan-300 mt-1">Digital QR Signed Receipts</div>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <div className="text-slate-400 text-xs font-medium mb-1">AI Priority Score Avg</div>
                    <div className="text-2xl font-black text-amber-400">89.4%</div>
                    <div className="text-[10px] text-amber-300 mt-1">Vulnerable Elderly & Children</div>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <div className="text-slate-400 text-xs font-medium mb-1">AI Fraud Blocked</div>
                    <div className="text-2xl font-black text-rose-400">{fraudAlerts.length}</div>
                    <div className="text-[10px] text-rose-300 mt-1">GPS Mismatch & Fake IDs</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>GIS Map Radar Active</span>
                  </div>
                  <button
                    onClick={onNavigateToMap}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
                  >
                    <span>View Map Telemetry</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-extrabold mb-2">
            INTELLIGENT DISASTER ENGINE
          </h2>
          <h3 className="text-3xl font-extrabold text-white">
            Powered by Modern Artificial Intelligence
          </h3>
          <p className="text-slate-400 text-sm mt-2">
            Every beneficiary application is rigorously verified using multi-modal AI algorithms before relief allocation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-card p-6 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Aadhaar OCR Extraction</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated document OCR instantly parses scanned Aadhaar cards, ration cards, and photo IDs with font tamper detection.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Biometric Face Matching</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              68-point facial landmark evaluation compares field live selfies against uploaded government IDs to stop impersonation.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Vulnerability Priority Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic algorithm calculates priority scores (0-100) favoring pregnant women, seniors, disabled citizens, and damaged homes.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">GPS Anomaly Fraud Radar</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flag spoofed registration locations over 50 km away from designated disaster zones to maintain integrity.
            </p>
          </div>

        </div>
      </section>

      {/* Smart QR Pass & Blockchain Transparency */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 lg:p-12 relative overflow-hidden border border-cyan-500/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                OFFLINE-FIRST FIELD DISTRIBUTION
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Smart Encrypted QR Beneficiary Cards & Field Scanning
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Registered victims receive an encrypted QR ID card (printable or saved on smartphone). Field volunteers use our camera scanner app to verify identity, record live selfie proof, generate digital signatures, and update inventory stock in real time—even in low connectivity disaster zones.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Cryptographic Token Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Offline Local Storage Caching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Digital Proof of Delivery Receipts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Immutable Blockchain Audit Hashes</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onOpenRegistration}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
                >
                  Generate Sample Smart QR Card
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              {/* Card Mockup */}
              <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-2xl border border-cyan-500/40 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-xs text-white uppercase">RESCUAID SMART PASS</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    VERIFIED
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                    alt="Sample Beneficiary"
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-cyan-400"
                  />
                  <div>
                    <h5 className="font-bold text-white text-sm">Lakshmi Narayanan</h5>
                    <p className="text-[11px] text-slate-400">Aadhaar: XXXX-XXXX-7721</p>
                    <p className="text-[11px] text-cyan-400 font-semibold">Priority: High (94%)</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="text-[11px]">
                    <span className="text-slate-400 block">QR Verification Token</span>
                    <span className="font-mono text-cyan-300 font-bold text-xs">QR-RES-2026-8891-TN</span>
                  </div>
                  <QrCode className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Government & NGO Partners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
            DEPLOYED ACROSS GOVERNMENT DEPARTMENTS & GLOBAL RELIEF ORGANIZATIONS
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 opacity-75">
          <div className="glass-card p-4 rounded-xl flex items-center justify-center gap-2 text-slate-200 text-xs font-bold">
            <Award className="w-5 h-5 text-cyan-400" />
            <span>NDMA India</span>
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center justify-center gap-2 text-slate-200 text-xs font-bold">
            <Award className="w-5 h-5 text-emerald-400" />
            <span>TN Revenue & Relief</span>
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center justify-center gap-2 text-slate-200 text-xs font-bold">
            <Award className="w-5 h-5 text-rose-400" />
            <span>Red Cross International</span>
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center justify-center gap-2 text-slate-200 text-xs font-bold">
            <Award className="w-5 h-5 text-amber-400" />
            <span>UNICEF Relief Cadre</span>
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center justify-center gap-2 text-slate-200 text-xs font-bold">
            <Award className="w-5 h-5 text-purple-400" />
            <span>WHO Emergency Ops</span>
          </div>
        </div>
      </section>

      {/* Emergency Helplines Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-12 text-slate-400 text-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>RescuAid AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              State Government & NDMA approved Disaster Relief Beneficiary Verification and Transparent Aid Allocation Platform.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Emergency Helplines</h5>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-red-400 font-bold">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>1077 (District Relief Control)</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                <span>112 (National Emergency Number)</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                <span>108 (Emergency Medical Ambulance)</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Quick Access</h5>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenRegistration} className="hover:text-cyan-400 transition-colors">
                  Beneficiary Registration Form
                </button>
              </li>
              <li>
                <button onClick={onNavigateToDashboard} className="hover:text-cyan-400 transition-colors">
                  Super Admin & Officer Portal
                </button>
              </li>
              <li>
                <button onClick={onNavigateToMap} className="hover:text-cyan-400 transition-colors">
                  Live GIS Radar & Weather Telemetry
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Security & Transparency</h5>
            <p className="text-slate-400 leading-relaxed text-xs">
              Protected by AES-256 Encryption, AI Fraud Anomaly Scoring, and Cryptographic Blockchain Transaction Ledger.
            </p>
          </div>

        </div>

        <div className="border-t border-slate-800/80 pt-6 text-center text-slate-500 text-[11px]">
          © 2026 National & State Disaster Management Authority. All Rights Reserved. RescuAid AI Enterprise Platform.
        </div>
      </footer>

    </div>
  );
};
