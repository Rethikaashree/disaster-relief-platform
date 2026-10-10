import React from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { ShieldCheck, Link2, CheckCircle2, Lock, Cpu, Clock, FileCode } from 'lucide-react';

export const BlockchainLedgerView: React.FC = () => {
  const { blockchainBlocks, distributions } = useDisaster();

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Immutable Blockchain Aid Distribution Ledger</h3>
            <p className="text-xs text-slate-400">Cryptographic Proof-of-Relief Delivery • Zero Corruption Guarantee</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            Node-Gov-TN Active
          </span>
        </div>
      </div>

      {/* Block Stream Visualizer */}
      <div className="space-y-4">
        {blockchainBlocks.map(block => (
          <div key={block.index} className="glass-card p-6 rounded-2xl border border-cyan-500/20 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">Block #{block.index}</span>
                <span className="text-xs text-slate-400">({block.transactionsCount} Verified Transactions)</span>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{block.timestamp}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 break-all">
                <span className="text-slate-500 text-[10px] block font-sans">Block Hash</span>
                <span className="text-cyan-300 font-bold">{block.hash}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 break-all">
                <span className="text-slate-500 text-[10px] block font-sans">Previous Hash</span>
                <span className="text-slate-400">{block.previousHash}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-slate-400 font-semibold text-[11px]">Included Digital Receipt IDs:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {block.receiptIds.map(rcp => (
                  <span key={rcp} className="px-2.5 py-1 rounded bg-slate-800 text-cyan-400 font-mono text-[10px] border border-slate-700">
                    {rcp}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span>Verified By Node: <strong className="text-slate-200">{block.verifiedBy}</strong></span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hash Validated</span>
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
