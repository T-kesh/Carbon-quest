import React, { useState } from "react";

interface RewardsViewProps {
  walletConnected: boolean;
  userAddress: string;
  expeditionLevel: number;
  setSimMessage: (msg: string) => void;
}

interface Milestone {
  key: string;
  name: string;
  desc: string;
  minLevel: number;
  unlocked: boolean;
}

export default function RewardsView({
  walletConnected,
  userAddress,
  expeditionLevel,
  setSimMessage,
}: RewardsViewProps) {
  const milestones: Milestone[] = [
    { key: "recruit", name: "Recruit Ranger", desc: "First successfully verified stamp", minLevel: 1, unlocked: true },
    { key: "guardian", name: "Forest Guardian", desc: "Reached Ranger Level 10+", minLevel: 10, unlocked: expeditionLevel >= 10 },
    { key: "sentinel", name: "Eco Sentinel", desc: "Reached Ranger Level 20+", minLevel: 20, unlocked: expeditionLevel >= 20 },
  ];

  const [selectedMilestone, setSelectedMilestone] = useState<Milestone>(milestones[0]);

  const handleDownload = () => {
    const addr = walletConnected ? userAddress : "0x0000000000000000000000000000000000000000";
    
    // HTML5 Canvas Draw & Download
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#F4F0E4";
    ctx.fillRect(0, 0, 800, 600);

    // Border double frame
    ctx.strokeStyle = "#1D3427";
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 760, 560);
    ctx.strokeStyle = "#B88B4A";
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 730, 530);

    // Header
    ctx.fillStyle = "#1D3427";
    ctx.font = "italic 20px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Official Conservation Certificate", 400, 100);

    ctx.fillStyle = "#B88B4A";
    ctx.font = "bold 34px Times New Roman";
    ctx.fillText("CARBON QUEST EXPEDITION FORCE", 400, 165);

    ctx.fillStyle = "#1A1A14";
    ctx.font = "16px Courier New";
    ctx.fillText("This is to certify that the EcoExplorer", 400, 240);

    ctx.fillStyle = "#355E3B";
    ctx.font = "bold 20px Courier New";
    ctx.fillText(addr, 400, 300);

    ctx.fillStyle = "#1A1A14";
    ctx.font = "16px Courier New";
    ctx.fillText("has achieved the rank of", 400, 360);
    ctx.fillStyle = "#1D3427";
    ctx.font = "bold 24px Georgia";
    ctx.fillText(selectedMilestone.name.toUpperCase(), 400, 400);

    ctx.fillStyle = "#1A1A14";
    ctx.font = "14px Courier New";
    ctx.fillText(`at Level ${selectedMilestone.minLevel} through verified ecological action.`, 400, 445);

    // Signatures
    ctx.strokeStyle = "rgba(29,52,39,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 520); ctx.lineTo(280, 520);
    ctx.moveTo(520, 520); ctx.lineTo(700, 520);
    ctx.stroke();

    ctx.fillStyle = "#4A4A38";
    ctx.font = "italic 13px Georgia";
    ctx.fillText("Commander Kesh", 190, 540);
    ctx.fillText("CarbonQuest Validator", 610, 540);

    // Wax Seal Badge
    ctx.fillStyle = "#B88B4A";
    ctx.beginPath();
    ctx.arc(400, 515, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F4F0E4";
    ctx.font = "bold 9px Courier New";
    ctx.fillText("SEAL OF", 400, 510);
    ctx.fillText("TRUST", 400, 524);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `CarbonQuest_Certificate_${selectedMilestone.key}.png`;
    link.href = dataUrl;
    link.click();
    setSimMessage(`Certificate downloaded for milestone: ${selectedMilestone.name}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-paper-slide">
      {/* Left Panel: Achievements listing */}
      <div className="paper-card p-6 flex-1 flex flex-col gap-4">
        <div className="pb-3 border-b border-tan">
          <div className="section-label">CONSERVATION ACHIEVEMENT CERTIFICATES</div>
        </div>

        <div className="flex flex-col gap-3">
          {milestones.map((m) => (
            <button
              key={m.key}
              disabled={!m.unlocked}
              onClick={() => {
                setSelectedMilestone(m);
                setSimMessage(`Selected milestone: ${m.name}`);
              }}
              className="w-full flex items-start gap-4 p-4 rounded-lg border border-tan hover:border-forest text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedMilestone.key === m.key ? "rgba(53,94,59,0.05)" : "transparent",
                borderColor: selectedMilestone.key === m.key ? "#355E3B" : "rgba(29,52,39,0.15)"
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-center rounded-full bg-parchment" style={{ width: 32, height: 32, border: m.unlocked ? "2px solid #B88B4A" : "1.5px dashed #C4B89A" }}>
                {m.unlocked ? "🎖️" : "🔒"}
              </div>
              <div className="min-w-0 flex-1">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#1D3427" }}>
                  {m.name}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38", marginTop: 2 }}>
                  {m.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel: Certificate details & Export */}
      <div className="paper-card p-6 flex-[1.5] flex flex-col gap-6 items-center justify-center text-center">
        <div className="w-full flex flex-col items-center gap-6">
          {/* Certificate paper container */}
          <div className="w-full max-w-lg p-8 bg-[#F4F0E4] border-8 border-forest relative shadow-md" style={{ borderStyle: "double" }}>
            {/* Gold accents */}
            <div className="absolute inset-2 border border-gold" />
            
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 12, color: "#1D3427" }}>
              Official Conservation Certificate
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: "#B88B4A", textTransform: "uppercase", marginTop: 6, letterSpacing: "0.1em" }}>
              CARBON QUEST EXPEDITION FORCE
            </div>

            <div style={{ width: 40, height: 1, background: "#C4B89A", margin: "16px auto" }} />

            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4A4A38" }}>
              This is to certify that the EcoExplorer
            </div>
            <div className="my-3 truncate px-4 py-1.5 border border-dashed border-tan bg-parchment inline-block max-w-full" style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#355E3B" }}>
              {walletConnected ? userAddress : "0x0000...0000"}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4A4A38" }}>
              has achieved the rank of
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, color: "#1D3427", textTransform: "uppercase", marginTop: 4 }}>
              {selectedMilestone.name}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38", marginTop: 4 }}>
              at Level {selectedMilestone.minLevel} through verified ecological action.
            </div>

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-tan/30">
              <div className="flex flex-col items-center font-mono text-[8px] text-ink-muted">
                <span className="italic">Commander Kesh</span>
                <span className="border-t border-ink-muted w-24 pt-1 mt-1">Expedition Leader</span>
              </div>
              {/* Gold wax seal */}
              <div className="flex items-center justify-center rounded-full bg-gold shadow-md" style={{ width: 44, height: 44 }}>
                <span style={{ fontSize: 16 }}>🎖️</span>
              </div>
              <div className="flex flex-col items-center font-mono text-[8px] text-ink-muted">
                <span className="italic">CarbonQuest Validator</span>
                <span className="border-t border-ink-muted w-24 pt-1 mt-1">Onchain Protocol</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="btn-expedition flex items-center justify-center gap-2 cursor-pointer"
            style={{ padding: "10px 24px" }}
          >
            📥 DOWNLOAD OFFICIAL PNG CERTIFICATE
          </button>
        </div>
      </div>
    </div>
  );
}
