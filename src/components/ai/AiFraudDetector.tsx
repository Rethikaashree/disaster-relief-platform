import React from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Eye, MapPin, Scan, Cpu } from 'lucide-react';

export const AiFraudDetector: React.FC = () => {
  const { fraudAlerts, resolveFraudAlert } = useDisaster();

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-rose-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">AI Fraud Detection & Anomaly Radar</h3>
            <p className="text-xs text-slate-400">Automated Identification of Duplicate Aadhaar, Face Match Anomalies & GPS Spoofing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-extrabold border border-rose-500/30 animate-pulse">
            {fraudAlerts.filter(a => a.status === 'Open').length} Open Risk Alerts
          </span>
        </div>
      </div>

      {/* Fraud Alert Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fraudAlerts.map(alert => (
          <div
            key={alert.id}
            className={`glass-card p-5 rounded-2xl border space-y-4 transition-all ${
              alert.severity === 'High' 
                ? 'border-rose-500/40 glow-red' 
                : 'border-amber-500/40'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${alert.severity === 'High' ? 'text-rose-400' : 'text-amber-400'}`} />
                <span className="font-bold text-xs text-white uppercase tracking-wider">{alert.type}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                alert.status === 'Open' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {alert.status}
              </span>
            </div>

            <div>
              <h5 className="font-bold text-white text-sm">{alert.beneficiaryName || 'Flagged Applicant'}</h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">AI Risk Index</span>
                <span className="font-extrabold text-rose-400 text-xs">{alert.riskScore}% Probability</span>
              </div>
              <div>
                <span className="text-slate-500 block">Detected Timestamp</span>
                <span className="text-slate-300">{alert.detectedAt}</span>
              </div>
            </div>

            {/* Actions */}
            {alert.status === 'Open' && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => resolveFraudAlert(alert.id, 'Resolved')}
                  className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Dismiss Alert</span>
                </button>

                <button
                  onClick={() => resolveFraudAlert(alert.id, 'Dismissed')}
                  className="flex-1 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Block User Identity</span>
                </button>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
};
