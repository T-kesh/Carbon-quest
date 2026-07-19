import React from "react";
import { Submission } from "../page";

interface PassportViewProps {
  walletConnected: boolean;
  userAddress: string;
  streakCount: number;
  expeditionLevel: number;
  balance: string;
  submissions: Submission[];
  setActiveNav: (nav: string) => void;
}

export default function PassportView({
  walletConnected,
  userAddress,
  streakCount,
  expeditionLevel,
  balance,
  submissions,
  setActiveNav,
}: PassportViewProps) {
  const verifiedSubmissions = submissions.filter(s => s.resolved && s.approved);

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-paper-slide">
      {/* Left Page: Profile card */}
      <div className="paper-card p-6 flex-1 flex flex-col gap-6" style={{ minWidth: 280 }}>
        <div className="flex items-center justify-between pb-3 border-b border-tan">
          <div className="section-label">EXPEDITION PASSPORT PAGE 1</div>
          <span className="text-xs font-mono font-bold text-gold">OFFICIAL DOCUMENT</span>
        </div>

        <div className="flex flex-col items-center py-4 bg-parchment rounded-lg border border-tan">
          <div className="flex items-center justify-center rounded-full bg-forest border-2 border-gold mb-3"
            style={{ width: 64, height: 64, color: "#F4F0E4", fontSize: 24, fontWeight: 800 }}>
            E
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "#1D3427" }}>
            {walletConnected ? "EcoExplorer" : "Guest Recruit"}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#4A4A38", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>
            FOREST GUARDIAN · LEVEL {expeditionLevel}
          </div>
        </div>

        <div className="flex flex-col gap-3 font-mono text-xs text-ink-muted">
          <div className="flex justify-between py-1 border-b border-dashed border-tan">
            <span>Explorer ID:</span>
            <span className="font-bold text-ink">
              {walletConnected ? `${userAddress.substring(0, 10)}...${userAddress.slice(-6)}` : "Unverified"}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-tan">
            <span>Expedition Rank:</span>
            <span className="font-bold text-forest">Ranger Tier 3</span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-tan">
            <span>Seasonal Payout weight:</span>
            <span className="font-bold text-ink">{100 + Math.max((streakCount - 1) * 10, 0)} pts</span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-tan">
            <span>Total Earth Stamps:</span>
            <span className="font-bold text-forest">{verifiedSubmissions.length} verified</span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-tan">
            <span>Expedition Balance:</span>
            <span className="font-bold text-ink">{balance} CELO</span>
          </div>
        </div>

        <div className="flex-1 flex items-end justify-center pt-8">
          <div className="flex items-center justify-center border-4 border-double border-gold rounded-full opacity-65"
            style={{ width: 84, height: 84, transform: "rotate(-10deg)" }}>
            <div className="text-[7px] text-center font-mono font-bold text-gold leading-tight">
              SEAL OF THE<br/>GUARD<br/>★ ★ ★
            </div>
          </div>
        </div>
      </div>

      {/* Right Page: Stamp book grid */}
      <div className="paper-card p-6 flex-[1.5] flex flex-col gap-5">
        <div className="pb-3 border-b border-tan">
          <div className="section-label">STAMP RECORD TIMELINE</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 flex-1 align-content-start">
          {verifiedSubmissions.map((sub, index) => (
            <div key={sub.id} className="flex flex-col items-center justify-center p-3 rounded-full border-4 border-double border-forest bg-parchment relative overflow-hidden animate-stamp"
              style={{ aspectRatio: "1", transform: `rotate(${(index % 3 - 1) * 6}deg)` }}>
              <div className="text-[8px] font-mono font-bold text-forest text-center leading-tight">
                {sub.actionType.toUpperCase()}
              </div>
              <div className="text-[6px] font-mono text-ink-muted mt-2">
                {sub.timestamp.split(" ")[0]}
              </div>
              <div className="text-[6px] font-mono text-gold-light mt-1">
                {sub.geoHash.toUpperCase()}
              </div>
            </div>
          ))}

          {verifiedSubmissions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-ink-muted font-mono text-xs border border-dashed border-tan rounded-lg bg-parchment">
              <span className="text-2xl mb-2">📒</span>
              No stamps verified in this passport yet.
              <button onClick={() => setActiveNav("dashboard")} className="btn-ghost mt-4 cursor-pointer">
                Log eco evidence to earn stamps
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
