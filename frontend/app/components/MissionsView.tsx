import React, { useState } from "react";
import { Submission } from "../page";
import * as Icon from "../components/Icons"; // Wait, page.tsx has icons, let's export them or use custom icons. Let's make inline SVGs to avoid import issues!

interface MissionsViewProps {
  submissions: Submission[];
  setSimMessage: (msg: string) => void;
}

export default function MissionsView({ submissions, setSimMessage }: MissionsViewProps) {
  const [heatmapActive, setHeatmapActive] = useState(false);

  return (
    <div className="paper-card p-6 flex flex-col gap-6 animate-paper-slide">
      <div className="flex items-center justify-between pb-3 border-b border-tan">
        <div>
          <div className="section-label">MISSION CONTROL INTERACTIVE CHART</div>
          <div className="text-[10px] font-mono text-ink-muted mt-1">Real-time geohash markers of ecological logs</div>
        </div>
        {/* Heatmap Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-ink-muted uppercase">Eco Heatmap:</span>
          <button
            onClick={() => {
              const nextState = !heatmapActive;
              setHeatmapActive(nextState);
              setSimMessage(nextState ? "Eco-density Heatmap overlay active." : "Heatmap overlay deactivated.");
            }}
            className="btn-ghost font-mono text-[9px] cursor-pointer"
            style={{ padding: "4px 10px" }}
          >
            {heatmapActive ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Vector SVG Map Container */}
      <div className="relative border border-tan rounded-lg bg-parchment overflow-hidden flex items-center justify-center p-4" style={{ height: 420 }}>
        {/* Heatmap overlay */}
        {heatmapActive && (
          <div className="absolute inset-0 pointer-events-none z-10 mix-blend-color-burn opacity-70">
            <div className="absolute rounded-full filter blur-xl animate-pulse" style={{ top: "25%", left: "40%", width: 140, height: 140, background: "radial-gradient(circle, rgba(53,94,59,0.45) 0%, transparent 70%)" }} />
            <div className="absolute rounded-full filter blur-xl animate-pulse" style={{ top: "60%", left: "70%", width: 180, height: 180, background: "radial-gradient(circle, rgba(53,94,59,0.35) 0%, transparent 70%)" }} />
            <div className="absolute rounded-full filter blur-xl animate-pulse" style={{ top: "45%", left: "20%", width: 120, height: 120, background: "radial-gradient(circle, rgba(53,94,59,0.4) 0%, transparent 70%)" }} />
          </div>
        )}

        <svg width="100%" height="100%" viewBox="0 0 800 400" className="opacity-95">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="none" />
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(29,52,39,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#grid)" />

          {/* Topographic Contour lines */}
          <path d="M100 150 Q180 80 300 120 T500 90 T700 140" fill="none" stroke="rgba(29,52,39,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />
          <path d="M150 200 Q250 140 380 180 T600 160 T750 220" fill="none" stroke="rgba(29,52,39,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />
          <path d="M80 250 Q200 180 350 240 T550 220 T680 280" fill="none" stroke="rgba(29,52,39,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />
          <path d="M220 300 Q320 220 450 280 T680 260" fill="none" stroke="rgba(29,52,39,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />

          {/* Topo Peaks */}
          <circle cx="280" cy="110" r="40" fill="none" stroke="rgba(29,52,39,0.04)" strokeWidth="1" />
          <circle cx="280" cy="110" r="25" fill="none" stroke="rgba(29,52,39,0.04)" strokeWidth="1" />
          <circle cx="580" cy="240" r="50" fill="none" stroke="rgba(29,52,39,0.04)" strokeWidth="1" />
          <circle cx="580" cy="240" r="30" fill="none" stroke="rgba(29,52,39,0.04)" strokeWidth="1" />

          {/* User Submissions Geohash plotted markers */}
          {submissions.map((sub, i) => {
            const x = 120 + ((sub.id * 149) % 550);
            const y = 80 + ((sub.id * 83) % 250);
            const color = sub.resolved ? (sub.approved ? "#355E3B" : "#8B3A2A") : "#B88B4A";

            return (
              <g key={sub.id} className="cursor-pointer" onClick={() => {
                setSimMessage(`Selected Eco-Proof #${sub.id}: ${sub.actionType} at ${sub.geoHash} by ${sub.proposer.slice(0, 10)}...`);
              }}>
                <circle cx={x} cy={y} r="10" fill="none" stroke={color} strokeWidth="1" opacity="0.3" className="animate-ping" style={{ animationDuration: "3s" }} />
                <circle cx={x} cy={y} r="5" fill={color} stroke="#F4F0E4" strokeWidth="1.5" />
                <text x={x + 8} y={y + 3} fill="#1D3427" style={{ fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700 }}>
                  #{sub.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Map Floating Legend overlay */}
        <div className="absolute bottom-4 left-4 p-3 rounded-lg border border-tan bg-parchment/90 z-20 flex flex-col gap-1.5 font-mono text-[9px] text-ink-muted">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green inline-block border border-paper" style={{ backgroundColor: "#355E3B" }} />
            <span>Verified Actions (Vouched)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block border border-paper" style={{ backgroundColor: "#B88B4A" }} />
            <span>Active Review Window</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rust inline-block border border-paper" style={{ backgroundColor: "#8B3A2A" }} />
            <span>Disputed / Slashed Logs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
