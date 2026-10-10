import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  AlertTriangle, 
  Boxes, 
  Plus, 
  CheckCircle2, 
  Radio, 
  FileText, 
  Lock, 
  BarChart3,
  Cpu
} from 'lucide-react';
import { AiFraudDetector } from '../ai/AiFraudDetector';
import { BlockchainLedgerView } from '../ledger/BlockchainLedgerView';

export const SuperAdminDashboard: React.FC = () => {
  const { disasters, beneficiaries, camps, warehouses, inventory, fraudAlerts, addDisaster } = useDisaster();
  const [adminTab, setAdminTab] = useState<'overview' | 'disasters' | 'fraud' | 'ledger' | 'ai_config'>('overview');
  const [showAddDisasterModal, setShowAddDisasterModal] = useState(false);

  // Form State for new disaster
  const [title, setTitle] = useState('');
  const [type, setType] = useState<any>('Flood');
  const [severity, setSeverity] = useState<any>('Critical');
  const [districts, setDistricts] = useState('Cuddalore, Nagapattinam');
  const [budget, setBudget] = useState('₹ 50 Crores');

  const handleCreateDisaster = (e: React.FormEvent) => {
    e.preventDefault();
    addDisaster({
      title: title || 'Coastal Flood Emergency 2026',
      type,
      severity,
      affectedDistricts: districts.split(',').map(s => s.trim()),
      expectedReliefBudget: budget
    });
    setShowAddDisasterModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Super Admin Top Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-xl">National Disaster Management Authority (NDMA)</h2>
            <p className="text-xs text-cyan-400">Super Admin State Operations & AI Governance Portal</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddDisasterModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg hover:brightness-110 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Declare Disaster Emergency Event</span>
        </button>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setAdminTab('overview')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            adminTab === 'overview' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Metrics</span>
        </button>
        <button
          onClick={() => setAdminTab('disasters')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            adminTab === 'disasters' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Disaster Events ({disasters.length})</span>
        </button>
        <button
          onClick={() => setAdminTab('fraud')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            adminTab === 'fraud' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>AI Fraud Radar ({fraudAlerts.length})</span>
        </button>
        <button
          onClick={() => setAdminTab('ledger')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            adminTab === 'ledger' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Blockchain Audit Ledger</span>
        </button>
      </div>

      {/* TAB 1: System Metrics */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-cyan-500/20">
              <span className="text-slate-400 text-xs font-semibold">Active Disaster Incidents</span>
              <div className="text-3xl font-black text-white mt-1">{disasters.length}</div>
              <span className="text-[10px] text-cyan-400 mt-1 block">Critical Status</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-emerald-500/20">
              <span className="text-slate-400 text-xs font-semibold">Total Verified Beneficiaries</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">{beneficiaries.length}</div>
              <span className="text-[10px] text-emerald-300 mt-1 block">Aadhaar OCR Clear</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-amber-500/20">
              <span className="text-slate-400 text-xs font-semibold">Relief Camps Active</span>
              <div className="text-3xl font-black text-amber-400 mt-1">{camps.length}</div>
              <span className="text-[10px] text-amber-300 mt-1 block">3,410 Capacity</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-rose-500/20">
              <span className="text-slate-400 text-xs font-semibold">AI Risk Anomalies</span>
              <div className="text-3xl font-black text-rose-400 mt-1">{fraudAlerts.length}</div>
              <span className="text-[10px] text-rose-300 mt-1 block">Blocked Duplicate Claims</span>
            </div>
          </div>

          {/* Quick Disaster Status Table */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-white text-sm">Active State Disaster Management Operations</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Districts</th>
                    <th className="p-3">Relief Budget</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {disasters.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{d.title}</td>
                      <td className="p-3">{d.type}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">{d.severity}</span>
                      </td>
                      <td className="p-3">{d.affectedDistricts.join(', ')}</td>
                      <td className="p-3 font-semibold text-cyan-300">{d.expectedReliefBudget}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Disasters Management */}
      {adminTab === 'disasters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disasters.map(d => (
            <div key={d.id} className="glass-card p-6 rounded-2xl border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-base">{d.title}</h4>
                <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 text-xs font-bold">{d.severity}</span>
              </div>
              <p className="text-xs text-slate-300">{d.description}</p>
              <div className="text-xs text-slate-400 space-y-1">
                <div>Affected Districts: <strong className="text-slate-200">{d.affectedDistricts.join(', ')}</strong></div>
                <div>Relief Budget: <strong className="text-cyan-300">{d.expectedReliefBudget}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Fraud Radar */}
      {adminTab === 'fraud' && <AiFraudDetector />}

      {/* TAB 4: Blockchain Ledger */}
      {adminTab === 'ledger' && <BlockchainLedgerView />}

      {/* Modal to add new disaster */}
      {showAddDisasterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-white text-base">Declare New Disaster Event</h3>
            <form onSubmit={handleCreateDisaster} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Disaster Title</label>
                <input
                  type="text"
                  placeholder="e.g. Cyclone Michaung Coastal Surge"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Disaster Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Flood">Flood</option>
                  <option value="Cyclone">Cyclone</option>
                  <option value="Landslide">Landslide</option>
                  <option value="Earthquake">Earthquake</option>
                  <option value="Tsunami">Tsunami</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Affected Districts (Comma Separated)</label>
                <input
                  type="text"
                  value={districts}
                  onChange={e => setDistricts(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sanctioned Relief Budget</label>
                <input
                  type="text"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400"
                >
                  Publish Disaster Alert
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDisasterModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
