import React, { useEffect, useRef } from 'react';
import { Beneficiary } from '../../types';
import { drawQrCodeToCanvas } from '../../utils/qrCode';
import { ShieldCheck, Download, Printer, CheckCircle2, User, Phone, MapPin, HeartPulse } from 'lucide-react';

interface SmartQrCardProps {
  beneficiary: Beneficiary;
  onClose?: () => void;
}

export const SmartQrCard: React.FC<SmartQrCardProps> = ({ beneficiary, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawQrCodeToCanvas(canvasRef.current, beneficiary.uniqueQrId, 200);
    }
  }, [beneficiary]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-white">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm tracking-wide uppercase text-cyan-300">
              GOVERNMENT DISASTER PASS
            </h4>
            <p className="text-[10px] text-slate-400">RescuAid Cryptographic Beneficiary ID</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>VERIFIED</span>
        </span>
      </div>

      {/* Profile & Priority Info */}
      <div className="flex items-start gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <img
          src={beneficiary.photoUrl}
          alt={beneficiary.fullName}
          className="w-16 h-16 rounded-xl object-cover ring-2 ring-cyan-400 shadow-md"
        />
        <div className="space-y-1 text-xs">
          <h5 className="font-extrabold text-sm text-white">{beneficiary.fullName}</h5>
          <p className="text-slate-400 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Aadhaar: {beneficiary.aadhaarNumber}</span>
          </p>
          <p className="text-slate-400 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>{beneficiary.phone}</span>
          </p>
          <p className="text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{beneficiary.district}, {beneficiary.state}</span>
          </p>
        </div>
      </div>

      {/* Priority Score & Family */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">AI Priority Index</span>
          <span className="font-extrabold text-amber-400 text-sm">{beneficiary.priorityScore}% ({beneficiary.priorityLevel})</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Family Dependents</span>
          <span className="font-extrabold text-white text-sm">{beneficiary.familyCount} Members</span>
        </div>
      </div>

      {/* QR Canvas Display */}
      <div className="flex flex-col items-center justify-center bg-slate-950 p-4 rounded-2xl border border-cyan-500/20 space-y-2">
        <canvas ref={canvasRef} className="rounded-xl shadow-lg"></canvas>
        <span className="font-mono text-cyan-300 font-bold text-xs tracking-wider">
          {beneficiary.uniqueQrId}
        </span>
        <span className="text-[10px] text-slate-500">Scan via Field Volunteer App for Aid Dispatch</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handlePrint}
          className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Pass</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
          >
            Close
          </button>
        )}
      </div>

    </div>
  );
};
