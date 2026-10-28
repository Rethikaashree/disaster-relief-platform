import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Tent, 
  Warehouse as WarehouseIcon, 
  AlertTriangle, 
  Sparkles,
  FileCheck,
  Search
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { beneficiaries, camps, warehouses, inventory, updateBeneficiaryStatus } = useDisaster();
  const [officerTab, setOfficerTab] = useState<'queue' | 'camps' | 'inventory'>('queue');
  const [search, setSearch] = useState('');

  const filteredBeneficiaries = beneficiaries.filter(b => 
    b.fullName.toLowerCase().includes(search.toLowerCase()) || 
    b.aadhaarNumber.includes(search) ||
    b.uniqueQrId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Officer Top Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-xl">District Collectorate Officer Portal</h2>
            <p className="text-xs text-cyan-400">Cuddalore Relief Administration • Beneficiary Approvals & Camp Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
            {beneficiaries.filter(b => b.verificationStatus === 'Approved').length} Approved Victims
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
            {beneficiaries.filter(b => b.verificationStatus === 'Under Audit').length} Audit Queue
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setOfficerTab('queue')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            officerTab === 'queue' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Beneficiary Approval Queue ({beneficiaries.length})</span>
        </button>
        <button
          onClick={() => setOfficerTab('camps')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            officerTab === 'camps' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tent className="w-4 h-4" />
          <span>Relief Camp Operations ({camps.length})</span>
        </button>
        <button
          onClick={() => setOfficerTab('inventory')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            officerTab === 'inventory' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <WarehouseIcon className="w-4 h-4" />
          <span>Warehouse Stock Management</span>
        </button>
      </div>

      {/* TAB 1: Beneficiary Approval Queue */}
      {officerTab === 'queue' && (
        <div className="space-y-4">
          
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search by Name, Aadhaar, or QR Pass Token..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-white w-full focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredBeneficiaries.map(ben => (
              <div
                key={ben.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={ben.photoUrl}
                    alt={ben.fullName}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-cyan-400"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{ben.fullName}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        ben.verificationStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' :
                        ben.verificationStatus === 'Rejected' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {ben.verificationStatus}
                      </span>
                    </div>
                    <p className="text-slate-400">Aadhaar: {ben.aadhaarNumber} • Phone: {ben.phone}</p>
                    <p className="text-slate-400">Address: {ben.address}, {ben.district}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded font-bold text-[10px]">
                        AI Priority: {ben.priorityScore}% ({ben.priorityLevel})
                      </span>
                      <span className="bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded font-bold text-[10px]">
                        Face Match: {ben.faceMatchScore}%
                      </span>
                      {ben.duplicateFlag && (
                        <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold text-[10px] animate-pulse">
                          ⚠️ Duplicate Risk Flag
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateBeneficiaryStatus(ben.id, 'Approved')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-1 hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Aid Pass</span>
                  </button>

                  <button
                    onClick={() => updateBeneficiaryStatus(ben.id, 'Rejected')}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs hover:bg-rose-500/30 border border-rose-500/30"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: Camp Operations */}
      {officerTab === 'camps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {camps.map(camp => (
            <div key={camp.id} className="glass-card p-6 rounded-2xl border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-base">{camp.name}</h4>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  {camp.currentOccupancy} / {camp.capacity} Occupied
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Officer In-Charge</span>
                  <span className="font-bold text-white">{camp.inChargeOfficer}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Medical Staff</span>
                  <span className="font-bold text-cyan-300">{camp.facilities.doctorsCount} Doctors On Duty</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Food Kits Buffer</span>
                  <span className="font-bold text-emerald-400">{camp.facilities.foodKitsAvailable} Kits</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Water Reservoir</span>
                  <span className="font-bold text-cyan-400">{camp.facilities.waterLitersAvailable} Liters</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Inventory */}
      {officerTab === 'inventory' && (
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h4 className="font-bold text-white text-sm">District Humanitarian Warehouse Stock</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Available Stock</th>
                  <th className="p-3">Distributed</th>
                  <th className="p-3">Warehouse Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {inventory.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-cyan-400">{inv.category}</td>
                    <td className="p-3 font-semibold text-white">{inv.name}</td>
                    <td className="p-3 text-emerald-400 font-extrabold">{inv.quantityAvailable} {inv.unit}</td>
                    <td className="p-3 text-slate-400">{inv.quantityDistributed} {inv.unit}</td>
                    <td className="p-3 text-slate-400">{inv.warehouseName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
