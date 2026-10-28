import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { SmartQrCard } from '../registration/SmartQrCard';
import { 
  User, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  HelpCircle,
  Plus
} from 'lucide-react';

export const BeneficiaryDashboard: React.FC = () => {
  const { beneficiaries, complaints, addComplaint } = useDisaster();
  const beneficiary = beneficiaries[0]; // Active victim (Lakshmi Narayanan)

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [category, setCategory] = useState<any>('Missing Aid');
  const [description, setDescription] = useState('');
  const [filedSuccess, setFiledSuccess] = useState(false);

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addComplaint({
      beneficiaryId: beneficiary?.id || 'ben_001',
      beneficiaryName: beneficiary?.fullName || 'Lakshmi Narayanan',
      category,
      description: description || 'Missing insulin medicine delivery.'
    });
    setFiledSuccess(true);
    setTimeout(() => {
      setFiledSuccess(false);
      setShowComplaintModal(false);
    }, 1500);
  };

  if (!beneficiary) return null;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-purple-500/30">
        <div className="flex items-center gap-3">
          <img
            src={beneficiary.photoUrl}
            alt={beneficiary.fullName}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-400"
          />
          <div>
            <h2 className="font-extrabold text-white text-xl">{beneficiary.fullName}</h2>
            <p className="text-xs text-purple-300">
              Aadhaar: {beneficiary.aadhaarNumber} • Status: {beneficiary.verificationStatus}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowComplaintModal(true)}
          className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-700 flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Raise Complaint / Request Help</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Smart QR Pass */}
        <div className="lg:col-span-5 flex justify-center">
          <SmartQrCard beneficiary={beneficiary} />
        </div>

        {/* Right Column: Status Timeline & Aid History */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Status Timeline */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-white text-sm">Disaster Application Status Tracker</h4>
            
            <div className="space-y-4 text-xs">
              
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h5 className="font-bold text-white">1. Registration Submitted</h5>
                  <p className="text-slate-400">Registered at {beneficiary.registeredAt}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h5 className="font-bold text-white">2. AI OCR & Face Verification Passed</h5>
                  <p className="text-emerald-400">Identity Confidence: {beneficiary.identityConfidenceScore}% • Face Match: {beneficiary.faceMatchScore}%</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h5 className="font-bold text-white">3. Collectorate Officer Verification</h5>
                  <p className="text-emerald-400">Status: Approved by District Officer</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  ⏳
                </div>
                <div>
                  <h5 className="font-bold text-white">4. Relief Ration Kit Distribution</h5>
                  <p className="text-cyan-300">Status: Partially Distributed (First ration pack received at St. Joseph Camp)</p>
                </div>
              </div>

            </div>
          </div>

          {/* Filed Complaints */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-white text-sm">Your Filed Complaints & Help Requests</h4>
            <div className="space-y-2">
              {complaints.map(cmp => (
                <div key={cmp.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">{cmp.category}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">{cmp.status}</span>
                  </div>
                  <p className="text-slate-300">{cmp.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-white text-base">File Complaint or Request Special Assistance</h3>
            
            {!filedSuccess ? (
              <form onSubmit={handleComplaintSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Missing Aid">Missing Aid / Incomplete Ration</option>
                    <option value="Medical Emergency">Urgent Medical Kit Request</option>
                    <option value="Volunteer Misconduct">Volunteer Misconduct / Delay</option>
                    <option value="Wrong Verification">Identity Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Describe Issue</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about your complaint..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400"
                  >
                    Submit Complaint
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-bold text-white text-sm">Complaint Filed Successfully!</h4>
                <p className="text-slate-400">Assigned to Special Relief Officer for priority review.</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
