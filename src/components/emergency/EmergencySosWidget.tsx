import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { AlertTriangle, MapPin, PhoneCall, Mic, Camera, X, CheckCircle2 } from 'lucide-react';

interface EmergencySosWidgetProps {
  onClose: () => void;
}

export const EmergencySosWidget: React.FC<EmergencySosWidgetProps> = ({ onClose }) => {
  const { triggerEmergencySos } = useDisaster();
  const [emergencyType, setEmergencyType] = useState<'Medical' | 'Trapped' | 'Food Supply' | 'Child / Senior Emergency'>('Trapped');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sosSent, setSosSent] = useState(false);

  const handleSubmitSos = (e: React.FormEvent) => {
    e.preventDefault();
    triggerEmergencySos({
      callerName: name || 'Distressed Citizen',
      phone: phone || '+91 98402 11928',
      emergencyType,
      message: message || 'Urgent rescue needed at location.'
    });
    setSosSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-rose-500/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-rose-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 fill-rose-400 text-slate-900" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider">1-Click Emergency SOS Trigger</h4>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!sosSent ? (
          <form onSubmit={handleSubmitSos} className="p-6 space-y-4 text-xs">
            
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300">
              🚨 Dispatching alert directly to State Rescue Command & Nearest Disaster Cadre Volunteers.
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Emergency Nature</label>
              <select
                value={emergencyType}
                onChange={e => setEmergencyType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              >
                <option value="Trapped">Rising Flood Water / Trapped on Roof</option>
                <option value="Medical">Medical Critical / Labor / Injury</option>
                <option value="Food Supply">Severe Food & Drinking Water Shortage</option>
                <option value="Child / Senior Emergency">Infant or Elderly Distress</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Caller Name</label>
              <input
                type="text"
                placeholder="Murugan V"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Contact Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98402 11928"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Emergency Message / Details</label>
              <textarea
                rows={3}
                placeholder="Water level reached 1st floor window..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white font-extrabold text-sm shadow-xl shadow-red-600/40 hover:brightness-110"
            >
              TRANSMIT SOS DISPATCH ALERT NOW 🚨
            </button>

          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-white text-base">SOS Alert Transmitted!</h4>
            <p className="text-xs text-slate-300">
              Rescue team dispatched to your GPS location (Lat: 11.748, Lng: 79.7714). Control room contact: 1077.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
            >
              Close Window
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
