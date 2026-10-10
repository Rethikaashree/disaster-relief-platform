import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { HeartHandshake, PackagePlus, Boxes, CheckCircle2, Award, Heart } from 'lucide-react';

export const NgoDashboard: React.FC = () => {
  const { inventory, beneficiaries } = useDisaster();
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donatedItem, setDonatedItem] = useState('Food');
  const [quantity, setQuantity] = useState(500);
  const [donatedSuccess, setDonatedSuccess] = useState(false);

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDonatedSuccess(true);
    setTimeout(() => {
      setDonatedSuccess(false);
      setShowDonateModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-xl">Red Cross International & NGO Partner Portal</h2>
            <p className="text-xs text-emerald-400">Humanitarian Resource Allocation & Direct Aid Sponsorship</p>
          </div>
        </div>

        <button
          onClick={() => setShowDonateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg hover:brightness-110 flex items-center gap-2"
        >
          <PackagePlus className="w-4 h-4" />
          <span>+ Donate Relief Supplies</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20">
          <span className="text-slate-400 text-xs font-semibold">Total NGO Inventory Pledged</span>
          <div className="text-3xl font-black text-emerald-400 mt-1">18,500 Kits</div>
          <span className="text-[10px] text-emerald-300 mt-1 block">WHO & Red Cross Standard</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-slate-400 text-xs font-semibold">Victim Families Reached</span>
          <div className="text-3xl font-black text-cyan-400 mt-1">{beneficiaries.length * 4} Citizens</div>
          <span className="text-[10px] text-cyan-300 mt-1 block">In Cuddalore Relief Zone</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-purple-500/20">
          <span className="text-slate-400 text-xs font-semibold">Active NGO Cadre Volunteers</span>
          <div className="text-3xl font-black text-purple-400 mt-1">142 Volunteers</div>
          <span className="text-[10px] text-purple-300 mt-1 block">Deployed with Smart QR App</span>
        </div>
      </div>

      {/* Available Stock Inventory List */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h4 className="font-bold text-white text-sm">Humanitarian Relief Supplies Tracker</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inventory.map(item => (
            <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400">{item.category}</span>
                <span className="text-emerald-400 font-extrabold">{item.quantityAvailable} {item.unit} Available</span>
              </div>
              <h5 className="font-bold text-white text-sm">{item.name}</h5>
              <p className="text-[11px] text-slate-400">Supplier: {item.supplier}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Donate Supplies Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-white text-base">Donate Relief Supplies to Disaster Camps</h3>
            
            {!donatedSuccess ? (
              <form onSubmit={handleDonateSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Resource Category</label>
                  <select
                    value={donatedItem}
                    onChange={e => setDonatedItem(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Food">Essential Dry Ration Packs</option>
                    <option value="Water">Purified Drinking Water Bottles</option>
                    <option value="Medicines">First Aid & Cholera Prevention Kits</option>
                    <option value="Blankets">Thermal Woolen Blankets</option>
                    <option value="Sanitary Kits">Dignity Hygiene Kits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Pledged Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
                  >
                    Confirm Donation Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDonateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-bold text-white text-sm">Donation Recorded Successfully!</h4>
                <p className="text-xs text-slate-400">Stock updated in Central Civil Storage Facility.</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
