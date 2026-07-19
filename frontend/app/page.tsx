"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  connectPassport,
  submitEcoProof,
  stakePeerReview,
  resolveSubmissionOnChain,
  claimRewardOnChain
} from "./platform";
import PassportView from "./components/PassportView";
import MissionsView from "./components/MissionsView";
import RewardsView from "./components/RewardsView";

// The contract address can be set here if deployed. We default to empty string for simulated fallback.
const DEPLOYED_CONTRACT_ADDRESS = "0xd5F67a37c8388BD9bCcaFE3aDa692CF2f8C48904";

/* ─── Types ─────────────────────────────────────────────────── */
export interface Submission {
  id: number;
  proposer: string;
  actionType: string;
  proofHash: string;
  geoHash: string;
  timestamp: string;
  hoursAgo: number;
  vouchStake: number;
  disputeStake: number;
  vouchersCount: number;
  disputersCount: number;
  claimWeight: number;
  resolved: boolean;
  approved: boolean;
  claimed: boolean;
  imageUrl?: string;
}

interface LeaderEntry {
  rank: number;
  name: string;
  stamps: number;
  totalEarned: string;
  isCurrentUser?: boolean;
  address?: string;
}

/* ─── Icons (inline SVG) ─────────────────────────────────────── */
const Icon = {
  dashboard: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  missions: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/>
      <line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/>
    </svg>
  ),
  journal: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/>
    </svg>
  ),
  ranks: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  passport: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="12" cy="12" r="3"/>
      <line x1="16" y1="8" x2="19" y2="8"/><line x1="16" y1="11" x2="19" y2="11"/>
      <line x1="5" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="19" y2="15"/>
    </svg>
  ),
  rewards: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5" rx="2"/>
      <path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  settings: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  compass: () => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  leaf: () => (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M11 20A7 7 0 014 13C4 6.92 8.51 3.48 12 2c0 0 5.96 2.55 7.64 7.73C21.3 15.63 18 21 11 20z"/>
      <path d="M4 13l8-4"/>
    </svg>
  ),
  camera: () => (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  location: () => (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  check: () => (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  clock: () => (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  reward: () => (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
};

/* ─── Seed data ──────────────────────────────────────────────── */
const SEED_SUBMISSIONS: Submission[] = [
  {
    id: 1, proposer: "0x8Ba21...b42C", actionType: "Tree Planting",
    proofHash: "QmTree129841", geoHash: "sf-presidio-37.80",
    timestamp: "2026-07-10 11:15", hoursAgo: 1,
    vouchStake: 0.15, disputeStake: 0, vouchersCount: 3, disputersCount: 0,
    claimWeight: 120, resolved: true, approved: true, claimed: false,
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: 2, proposer: "0x89C1...F9e2", actionType: "E-waste Drop-off",
    proofHash: "QmEwaste88490", geoHash: "nyc-manhattan-40.71",
    timestamp: "2026-07-10 10:45", hoursAgo: 2,
    vouchStake: 0.05, disputeStake: 0.1, vouchersCount: 1, disputersCount: 2,
    claimWeight: 100, resolved: false, approved: false, claimed: false,
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=420&q=80",
  },
];

const SEED_TIMELINE = [
  { time: "08:40", label: "Tree planted", icon: "leaf", done: true },
  { time: "09:10", label: "Photo evidence uploaded", icon: "camera", done: true },
  { time: "09:22", label: "Under peer review", icon: "clock", done: false, warning: true },
  { time: "09:35", label: "Verified", icon: "check", done: true },
  { time: "09:42", label: "Reward claimed", icon: "reward", done: true },
];

/* ─── Sidebar nav items ──────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Icon.dashboard },
  { id: "missions",  label: "Missions",  icon: Icon.missions },
  { id: "journal",   label: "Journal",   icon: Icon.journal },
  { id: "ranks",     label: "Ranks",     icon: Icon.ranks },
  { id: "passport",  label: "Passport",  icon: Icon.passport },
  { id: "rewards",   label: "Rewards",   icon: Icon.rewards },
  { id: "settings",  label: "Settings",  icon: Icon.settings },
];

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        const MAX_SIZE = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for compression."));
      };
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };
  });
}

/* ═══════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  /* Wallet */
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress]         = useState("");
  const [balance, setBalance]                 = useState("15.50");
  const [isGoodID, setIsGoodID]               = useState(true);
  const [isManual, setIsManual]               = useState(true);

  /* UI */
  const [activeNav, setActiveNav]       = useState("dashboard");
  const [simMessage, setSimMessage]     = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* Game state */
  const [streakCount, setStreakCount]             = useState(5);
  const [poolRemaining, setPoolRemaining]         = useState(8240);
  const [verifiedCount, setVerifiedCount]         = useState(312);
  const [submissions, setSubmissions]             = useState<Submission[]>(SEED_SUBMISSIONS);
  const [leaderboard, setLeaderboard]             = useState<LeaderEntry[]>([]);
  const [expeditionLevel]                         = useState(14);
  const [xp]                                      = useState(2420);
  const [maxXP]                                   = useState(3000);

  /* Form */
  const [subAction, setSubAction]     = useState("Tree Planting");
  const [subGeo, setSubGeo]           = useState("sf-mission-37.75");
  const [subPhoto, setSubPhoto]       = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitOk, setSubmitOk]       = useState(false);

  /* Peer review */
  const [stakeAmt, setStakeAmt]       = useState("0.05");

  /* Stamp animation trigger key */
  const [stampKey, setStampKey]       = useState(0);

  useEffect(() => { fetchLeaderboard(); }, [userAddress]);

  const fetchLeaderboard = async () => {
    try {
      const r = await fetch(`/api/leaderboard?address=${userAddress}`);
      const d = await r.json();
      if (d.success) setLeaderboard(d.leaderboard);
    } catch { /* dev fallback */ }
  };

  /* ─ Wallet helpers ─ */
  const connectWallet = async () => {
    setSimMessage("Accessing expedition passport...");
    const conn = await connectPassport();
    if (conn.connected) {
      setUserAddress(conn.address);
      setBalance(conn.balance);
      setWalletConnected(true);
      setSimMessage(conn.error ? conn.error : "Connected via Celo Provider.");
    } else if (conn.error) {
      setSimMessage(conn.error);
    }
  };

  const disconnect = () => {
    setWalletConnected(false);
    setUserAddress("");
    setSimMessage("");
  };

  /* ─ Submit action ─ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) { setSimMessage("Connect your expedition passport first."); return; }
    if (!isGoodID && !isManual) { setSimMessage("Address not in any whitelist — submission blocked."); return; }

    setSubmitting(true);
    setSimMessage("Uploading proof to IPFS...");

    const res = await submitEcoProof(
      subAction,
      subGeo,
      subPhoto,
      userAddress,
      DEPLOYED_CONTRACT_ADDRESS
    );

    if (res.success) {
      setSimMessage(res.message);
      const weight = 100 + Math.min((streakCount > 0 ? (streakCount - 1) * 10 : 0), 100);
      
      // Update UI state
      const newSub: Submission = {
        id: submissions.length + 1,
        proposer: `${userAddress.substring(0, 6)}...${userAddress.slice(-4)}`,
        actionType: subAction,
        proofHash: res.cid,
        geoHash: subGeo,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        hoursAgo: 0,
        vouchStake: 0,
        disputeStake: 0,
        vouchersCount: 0,
        disputersCount: 0,
        claimWeight: weight,
        resolved: false,
        approved: false,
        claimed: false,
        imageUrl: subPhoto || undefined,
      };
      
      setSubmissions(p => [newSub, ...p]);
      setStreakCount(p => Math.min(p + 1, 7));
      setVerifiedCount(p => p + 1);
      setPoolRemaining(p => Math.max(p - 20, 0));
      setSubmitting(false);
      setSubmitOk(true);
    } else if (res.error) {
      setSimMessage(res.error);
      setSubmitting(false);
    }
  };

  const handleVouch    = (id: number) => mutateStake(id, "vouch");
  const handleDispute  = (id: number) => mutateStake(id, "dispute");
  const mutateStake    = async (id: number, side: "vouch" | "dispute") => {
    const amt = parseFloat(stakeAmt) || 0;
    if (!walletConnected || amt <= 0) return;

    setSimMessage(`Signing stake allocation for ${side}...`);
    const res = await stakePeerReview(id, side, stakeAmt, DEPLOYED_CONTRACT_ADDRESS);

    if (res.success) {
      setSubmissions(p => p.map(s => s.id !== id ? s : {
        ...s,
        vouchStake:    side === "vouch"   ? +(s.vouchStake   + amt).toFixed(3) : s.vouchStake,
        disputeStake:  side === "dispute" ? +(s.disputeStake + amt).toFixed(3) : s.disputeStake,
        vouchersCount: side === "vouch"   ? s.vouchersCount + 1 : s.vouchersCount,
        disputersCount:side === "dispute" ? s.disputersCount + 1 : s.disputersCount,
      }));
      setBalance(p => (parseFloat(p) - amt).toFixed(2));
      setSimMessage(res.message);
    } else if (res.error) {
      setSimMessage(res.error);
    }
  };

  const handleResolve = async (id: number) => {
    setSimMessage("Signing resolution request...");
    const res = await resolveSubmissionOnChain(id, DEPLOYED_CONTRACT_ADDRESS);

    if (res.success) {
      setSubmissions(p => p.map(s => {
        if (s.id !== id) return s;
        const approved = s.vouchStake >= s.disputeStake;
        setSimMessage(`Submission #${id} resolved. ${approved ? "APPROVED." : "REJECTED."}`);
        if (approved) setStampKey(k => k + 1);
        return { ...s, resolved: true, approved };
      }));
    } else if (res.error) {
      setSimMessage(res.error);
    }
  };

  const handleClaim = async (id: number) => {
    setSimMessage("Signing reward withdrawal request...");
    const res = await claimRewardOnChain(id, DEPLOYED_CONTRACT_ADDRESS);

    if (res.success) {
      setSubmissions(p => p.map(s => {
        if (s.id !== id || s.claimed) return s;
        const reward = +((s.claimWeight / 100) * 1.5).toFixed(2);
        setBalance(b => (parseFloat(b) + reward).toFixed(2));
        setSimMessage(res.message);
        return { ...s, claimed: true };
      }));
    } else if (res.error) {
      setSimMessage(res.error);
    }
  };

  const latestSub = submissions[0];

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden relative" style={{ fontFamily: "var(--font-display)", backgroundColor: "#F4F0E4" }}>
      {/* Mobile Sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-ink/40 z-40 md:hidden cursor-pointer"
        />
      )}

      {/* ═══ LEFT SIDEBAR ════════════════════════════════════ */}
      <aside
        className={`flex-none flex flex-col expedition-sidebar z-45 ${isMobileMenuOpen ? "mobile-sidebar-open" : ""}`}
        style={{
          width: 210,
          backgroundColor: "#1D3427",
          overflowY: "auto",
        }}
      >
        {/* Logo and Explorer Title */}
        <div className="flex flex-col items-center justify-center py-6 border-b" style={{ borderColor: "rgba(244,240,228,0.08)" }}>
          <div className="flex items-center justify-center rounded-full mb-3"
            style={{
              width: 56,
              height: 56,
              background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%23B88B4A' stroke-width='3' stroke-dasharray='4,4'/%3E%3Cpath d='M50,15 L75,45 L60,45 L75,70 L25,70 L40,45 L25,45 Z' fill='%23B88B4A'/%3E%3Ccircle cx='50' cy='50' r='38' fill='none' stroke='%23B88B4A' stroke-width='1.5'/%3E%3C/svg%3E\") no-repeat center",
              backgroundSize: "contain"
            }}>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#F4F0E4", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            CARBON QUEST
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "rgba(244,240,228,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
            EXPEDITION CONTROL CENTER
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-md text-left transition-all cursor-pointer"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: activeNav === item.id ? "#1D3427" : "rgba(244,240,228,0.45)",
                backgroundColor: activeNav === item.id ? "#EFE8D5" : "transparent",
              }}
            >
              <span style={{ opacity: activeNav === item.id ? 1 : 0.5 }}>
                <item.icon />
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Expedition Level & Stats */}
        <div className="px-4 py-5 border-t" style={{ borderColor: "rgba(244,240,228,0.08)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "rgba(244,240,228,0.35)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>
            EXPEDITION LEVEL
          </div>
          
          <div className="flex flex-col items-center mb-3">
            {/* Custom Shield Emblem */}
            <div className="flex items-center justify-center mb-2"
              style={{
                width: 64, height: 64,
                background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50,5 C75,5 90,20 90,50 C90,80 50,95 50,95 C50,95 10,80 10,50 C10,20 25,5 50,5 Z' fill='none' stroke='%23B88B4A' stroke-width='4'/%3E%3Cpath d='M50,15 L70,30 L60,30 L75,50 L60,50 L80,75 L20,75 L40,50 L25,50 L40,30 L30,30 Z' fill='%23B88B4A'/%3E%3C/svg%3E\") no-repeat center",
                backgroundSize: "contain"
              }}>
            </div>
            
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 24, color: "#F4F0E4", lineHeight: 1 }}>
              {expeditionLevel}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "#B88B4A", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
              FOREST GUARDIAN
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "rgba(244,240,228,0.4)", marginTop: 2 }}>
              {xp.toLocaleString()} / {maxXP.toLocaleString()} XP
            </div>
          </div>

          {/* XP progress bar */}
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: "rgba(244,240,228,0.08)", border: "1px solid rgba(244,240,228,0.15)" }}>
            <div
              className="h-full rounded-full animate-xp-fill"
              style={{ width: `${(xp/maxXP)*100}%`, background: "#B88B4A" }}
            />
          </div>

          {/* User Profile Footer */}
          <div className="flex items-center gap-3.5 mt-5 pt-4" style={{ borderTop: "1px solid rgba(244,240,228,0.08)" }}>
            <div className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{ width: 28, height: 28, background: "#355E3B", border: "1px solid #B88B4A", fontSize: 10, color: "#F4F0E4", fontWeight: 700 }}>
              E
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#F4F0E4", fontWeight: 600 }}>
                {walletConnected ? "EcoExplorer" : "Guest Recruit"}
              </div>
              <div className="truncate" style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "rgba(244,240,228,0.35)", letterSpacing: "0.05em" }}>
                RANGER ID: {walletConnected ? `${userAddress.substring(0,6)}...${userAddress.slice(-4)}` : "Unverified"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Spiral Notebook Binding Wire Effect between Sidebar and Main Content ── */}
      <div className="absolute top-0 bottom-0 z-20 pointer-events-none notebook-wire" style={{ left: 202, width: 16 }}>
        <div className="h-full w-full" style={{
          background: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 16px,
            #C4B89A 16px,
            #C4B89A 22px,
            #8B8065 22px,
            #8B8065 24px,
            transparent 24px,
            transparent 40px
          )`
        }} />
      </div>

      {/* ═══ MAIN CONTENT AREA ═══════════════════════════════ */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── TOP HEADER BAR (Parchment Paper Styling) ────────────────── */}
        <header
          className="flex-none flex items-center justify-between px-8 border-b"
          style={{
            height: 64,
            backgroundColor: "#EFE8D5",
            borderColor: "rgba(29, 52, 39, 0.15)",
          }}
        >
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-card text-forest cursor-pointer"
              style={{ border: "1px solid rgba(29,52,39,0.15)" }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%231D3427' stroke-width='4'/%3E%3Cpath d='M50,15 L75,45 L60,45 L75,70 L25,70 L40,45 L25,45 Z' fill='%231D3427'/%3E%3C/svg%3E\") no-repeat center",
                  backgroundSize: "contain"
                }}>
              </div>
              <div className="flex flex-col">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#1D3427", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  CARBON QUEST
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#4A4A38", letterSpacing: "0.05em" }}>
                  EXPEDITION CONTROL CENTER
                </span>
              </div>
            </div>

            <div style={{ width: 1, height: 24, background: "rgba(29, 52, 39, 0.15)" }} />

            <div className="flex flex-col">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700, color: "#4A4A38", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                FIELD JOURNAL PROTOCOL
              </span>
              <div className="flex items-center gap-1.5" style={{ marginTop: 2 }}>
                <span style={{ width: 12, height: 1, background: "#C4B89A" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#355E3B", letterSpacing: "0.05em", fontWeight: 700 }}>
                  SESSION ID: CQ-87A1-222
                </span>
                <span style={{ width: 12, height: 1, background: "#C4B89A" }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {walletConnected ? (
              <button onClick={disconnect} className="btn-ghost" style={{ fontSize: 9, padding: "6px 14px" }}>
                Disconnect
              </button>
            ) : (
              <button onClick={connectWallet} className="btn-expedition" style={{ fontSize: 9, padding: "8px 18px" }}>
                † CONNECT EXPEDITION PASSPORT
              </button>
            )}
          </div>
        </header>

        {/* ── SCROLLABLE BODY ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 py-6" style={{ background: "#F4F0E4" }}>

          {/* Sim message banner */}
          {simMessage && (
            <div className="mb-5 px-5 py-3 rounded-lg animate-paper-slide"
              style={{ background: "#EFE8D5", border: "1px solid rgba(29,52,39,0.2)", fontFamily: "var(--font-mono)", fontSize: 11, color: "#355E3B", borderLeft: "4px solid #355E3B" }}>
              {simMessage}
            </div>
          )}

          {/* Title and Date Stamp Row */}
          <div className="flex items-end justify-between mb-6 pb-5" style={{ borderBottom: "1px solid rgba(29,52,39,0.15)" }}>
            <div>
              <div className="section-label mb-1" style={{ fontSize: 9 }}>Field Journal Protocol</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "#1D3427", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                CARBON QUEST — SEASON 01
              </h1>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg"
              style={{ border: "2px double #1D3427", background: "#EFE8D5", minWidth: 100 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14, color: "#1D3427", letterSpacing: "0.08em" }}>
                DAY 14
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#4A4A38", letterSpacing: "0.1em", marginTop: 2, textTransform: "uppercase" }}>
                JUL 10, 2026
              </div>
            </div>
          </div>

          {activeNav === "dashboard" && (
            <div className="dashboard-grid">

            {/* ══ LEFT COLUMN: Metrics + Streak + Timeline ═════ */}
            <div className="flex flex-col gap-5">

              {/* I. Season Pool Metrics */}
              <div className="paper-card p-6">
                <div className="section-label mb-4">I. SEASON POOL METRICS</div>

                <div className="flex items-center gap-5">
                  {/* Topo rings */}
                  <div className="relative flex-shrink-0" style={{ width: 84, height: 84 }}>
                    <svg width="84" height="84" className="transform -rotate-90">
                      <circle cx="42" cy="42" r="38" stroke="#C4B89A" strokeWidth="2" fill="none" />
                      <circle cx="42" cy="42" r="38" stroke="#355E3B" strokeWidth="2.5" fill="none"
                        strokeDasharray="238" strokeDashoffset={238 - (238 * poolRemaining) / 10000} strokeLinecap="round" />
                      <circle cx="42" cy="42" r="28" stroke="#C4B89A" strokeWidth="1.5" fill="none" />
                      <circle cx="42" cy="42" r="28" stroke="#355E3B" strokeWidth="2" fill="none"
                        strokeDasharray="175" strokeDashoffset={175 - (175 * poolRemaining) / 10000} strokeLinecap="round" />
                      <circle cx="42" cy="42" r="18" stroke="#C4B89A" strokeWidth="1" fill="none" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#355E3B" }}>
                        {Math.round((poolRemaining / 10000) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="section-label mb-1" style={{ fontSize: 8 }}>Season Pool Remaining</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 800, color: "#1D3427", lineHeight: 1 }}>
                      {poolRemaining.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600 }}>CUSD</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38", marginTop: 5 }}>
                      {verifiedCount} stamps logged
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38", marginTop: 2 }}>
                      ◷ 16 days remaining
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak punch card */}
              <div className="paper-card p-6">
                <div className="section-label mb-4">5-DAY EXPEDITION STREAK</div>
                <div className="flex gap-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const active = i < streakCount;
                    const dayNum = 10 + i - streakCount + 1;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                        <div
                          className="flex flex-col items-center justify-center rounded-md transition-all relative overflow-hidden"
                          style={{
                            width: "100%", aspectRatio: "1",
                            border: active ? "1.5px solid #8B3A2A" : "1px dashed #C4B89A",
                            background: active ? "rgba(139,58,42,0.04)" : "transparent",
                          }}
                        >
                          {active ? (
                            <>
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#8B3A2A" strokeWidth={3} className="mt-1">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 6, color: "#8B3A2A", fontWeight: 700, transform: "scale(0.85)", position: "absolute", bottom: 2 }}>
                                DAY {dayNum}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 6, color: "#C4B89A", position: "absolute", bottom: 2 }}>
                              -
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Field Journal Timeline */}
              <div className="paper-card p-6" style={{ flex: 1 }}>
                <div className="section-label mb-1">FIELD JOURNAL TIMELINE</div>
                <div className="section-label mb-5" style={{ color: "#4A4A38", fontSize: 9 }}>TODAY — DAY 14</div>

                <div className="flex flex-col gap-4">
                  {SEED_TIMELINE.map((entry, i) => (
                    <div key={i} className="flex items-start gap-4 animate-paper-slide" style={{ animationDelay: `${i * 80}ms` }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38", whiteSpace: "nowrap", paddingTop: 2, width: 36, flexShrink: 0 }}>
                        {entry.time}
                      </span>
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="flex-shrink-0 flex items-center justify-center rounded-full"
                          style={{
                            width: 22, height: 22,
                            background: entry.warning ? "rgba(184,139,74,0.1)" : entry.done ? "rgba(53,94,59,0.08)" : "rgba(196,184,154,0.15)",
                            border: entry.warning ? "1px solid #B88B4A" : entry.done ? "1px solid #355E3B" : "1px solid #C4B89A",
                            color: entry.warning ? "#B88B4A" : entry.done ? "#355E3B" : "#C4B89A",
                          }}>
                          {entry.done && !entry.warning && (
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                          {entry.warning && <span style={{ fontSize: 10, fontWeight: 700 }}>!</span>}
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: entry.done ? "#1D3427" : "#4A4A38", fontWeight: entry.done ? 500 : 400 }}>
                          {entry.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ CENTRE COLUMN: Log Evidence + Reviews ════════ */}
            <div className="flex flex-col gap-5">

              {/* II. Log Eco Evidence */}
              <div className="paper-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="section-label">II. Log Eco Evidence</div>
                  <span style={{ fontSize: 16 }}>🌿</span>
                </div>

                {submitOk ? (
                  <div className="flex flex-col items-center gap-3 py-6 animate-paper-slide">
                    <div className="flex items-center justify-center rounded-full"
                      style={{ width: 52, height: 52, background: "rgba(53,94,59,0.08)", border: "1.5px solid #355E3B", color: "#355E3B" }}>
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "#1D3427" }}>Evidence Dispatched</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4A4A38", textAlign: "center" }}>
                      Proof pinned. Staking review window is active.
                    </div>
                    <button onClick={() => setSubmitOk(false)} className="btn-ghost" style={{ marginTop: 6 }}>
                      New entry log
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="field-label">Eco Action Class</label>
                      <div className="relative">
                        <select value={subAction} onChange={e => setSubAction(e.target.value)} className="field-input pr-8 appearance-none">
                          <option value="Tree Planting">Tree Planting (Weight: 120)</option>
                          <option value="E-waste Drop-off">E-waste Drop-off (Weight: 100)</option>
                          <option value="Waste Sorting">Waste Sorting (Weight: 80)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4A4A38" }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Coordinates / Geohash</label>
                      <div className="relative">
                        <input type="text" value={subGeo} onChange={e => setSubGeo(e.target.value)}
                          placeholder="sf-mission-37.75" required className="field-input pr-8" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#C4B89A" }}>
                          <Icon.location />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Evidence Image (Camera/Upload)</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSimMessage("Compressing proof image...");
                              try {
                                const base64 = await compressImage(file);
                                setSubPhoto(base64);
                                setSimMessage("Image compressed successfully (<250KB).");
                              } catch (err: any) {
                                setSimMessage(`Compression failed: ${err.message}`);
                              }
                            }
                          }}
                          className="hidden"
                          id="proof-image-file"
                        />
                        {subPhoto ? (
                          <div className="flex flex-col gap-2 p-3 rounded-lg border border-dashed border-forest bg-parchment">
                            <div className="relative rounded-md overflow-hidden animate-paper-slide" style={{ height: 120 }}>
                              <img src={subPhoto} alt="Proof preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setSubPhoto("")}
                                className="absolute top-2 right-2 rounded-full p-1 bg-rust text-paper text-xs font-bold shadow-md hover:bg-forest transition-colors flex items-center justify-center cursor-pointer"
                                style={{ width: 22, height: 22 }}
                              >
                                &times;
                              </button>
                            </div>
                            <span className="text-[10px] text-ink-muted text-center font-mono">
                              Compressed Base64 JPEG ready for IPFS dispatch
                            </span>
                          </div>
                        ) : (
                          <label
                            htmlFor="proof-image-file"
                            className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-tan bg-parchment hover:border-forest cursor-pointer transition-all"
                          >
                            <span className="text-xl mb-1">📸</span>
                            <span className="text-xs font-mono text-ink font-bold">CAPTURE / CHOOSE IMAGE</span>
                            <span className="text-[9px] font-mono text-ink-muted mt-1">Automatic client-side compression enabled</span>
                          </label>
                        )}
                      </div>
                    </div>

                    <button type="submit" className="btn-expedition w-full justify-center gap-2" disabled={submitting || !walletConnected}
                      style={{
                        backgroundColor: "#1D3427",
                        borderColor: "#1D3427",
                        opacity: (!walletConnected || submitting) ? 0.5 : 1,
                        cursor: !walletConnected ? "not-allowed" : "pointer"
                      }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M11 20A7 7 0 014 13C4 6.92 8.51 3.48 12 2c0 0 5.96 2.55 7.64 7.73C21.3 15.63 18 21 11 20z"/>
                        <path d="M4 13l8-4"/>
                      </svg>
                      {submitting ? "Signing Proof…" : "SUBMIT ECO-PROOF"}
                    </button>
                  </form>
                )}
              </div>

              {/* III. Active Peer Reviews */}
              <div className="paper-card p-6 flex flex-col gap-4" style={{ flex: 1, minHeight: 0 }}>
                <div className="flex items-center justify-between">
                  <div className="section-label">III. Active Peer Reviews</div>
                  <select value={stakeAmt} onChange={e => setStakeAmt(e.target.value)}
                    className="field-input" style={{ width: "auto", padding: "4px 8px", fontSize: 10 }}>
                    <option value="0.05">0.05 CELO</option>
                    <option value="0.10">0.10 CELO</option>
                    <option value="0.25">0.25 CELO</option>
                  </select>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 360 }}>
                  {submissions.map(sub => (
                    <div key={sub.id} className="paper-inset p-4 flex flex-col gap-3 relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 items-start">
                          {sub.imageUrl && (
                            <div className="flex-shrink-0 rounded-md overflow-hidden" style={{ width: 56, height: 56, border: "1px solid rgba(29,52,39,0.15)" }}>
                              <img src={sub.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38", marginBottom: 3 }}>
                              ID: {sub.id} · Proposer: {sub.proposer}
                            </div>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#1D3427" }}>
                              {sub.actionType}
                            </div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38" }}>
                              Location: {sub.geoHash}
                            </div>
                          </div>
                        </div>

                        {sub.resolved && sub.approved && (
                          <div className="rubber-stamp stamp-approved animate-stamp" key={`stamp-${sub.id}-${stampKey}`}
                            style={{ position: "static", width: 68, height: 68, flexShrink: 0, fontSize: 8, transform: "rotate(-12deg)", mixBlendMode: "multiply", border: "3px double #355E3B" }}>
                            APPROVED
                          </div>
                        )}
                        {!sub.resolved && (
                          <div className="rubber-stamp stamp-reviewing"
                            style={{ position: "static", width: 68, height: 68, flexShrink: 0, fontSize: 7, transform: "rotate(-6deg)", mixBlendMode: "multiply" }}>
                            IN<br/>REVIEW
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 paper-inset p-3">
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#4A4A38", marginBottom: 2 }}>Vouch Pool:</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#355E3B" }}>
                            {sub.vouchStake} CELO <span style={{ fontSize: 10, fontWeight: 400 }}>({sub.vouchersCount})</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#4A4A38", marginBottom: 2 }}>Dispute Pool:</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#8B3A2A" }}>
                            {sub.disputeStake} CELO <span style={{ fontSize: 10, fontWeight: 400 }}>({sub.disputersCount})</span>
                          </div>
                        </div>
                      </div>

                      {!sub.resolved ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleVouch(sub.id)} className="btn-vouch" disabled={!walletConnected}>VOUCH</button>
                          <button onClick={() => handleDispute(sub.id)} className="btn-dispute" disabled={!walletConnected}>DISPUTE</button>
                          <button onClick={() => handleResolve(sub.id)} className="btn-ghost" style={{ flexShrink: 0, padding: "6px 12px" }}>
                            RESOLVE
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38", textAlign: "center", padding: "2px 0" }}>
                          Staking window closed · Stakes distributed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ RIGHT COLUMN: Stamp + Leaderboard ════════════ */}
            <div className="flex flex-col gap-5">

              {/* IV. Verification Stamp */}
              <div className="paper-card p-6">
                <div className="section-label mb-4">IV. Verification Stamp</div>

                {latestSub ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-5 rounded-lg flex flex-col gap-3 relative"
                      style={{ background: "#1D3427", border: "1px solid rgba(53,94,59,0.3)", minHeight: 140, overflow: "hidden" }}>
                      
                      <div className="absolute bottom-2 right-3 opacity-10" style={{ fontSize: 48, transform: "rotate(-10deg)" }}>
                        🌿
                      </div>

                      {latestSub.resolved && latestSub.approved && (
                        <div key={stampKey} className="absolute top-4 right-4 animate-stamp"
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em",
                            textTransform: "uppercase", color: "#8B3A2A", border: "3px solid #8B3A2A",
                            borderRadius: 0, padding: "4px 8px", transform: "rotate(-8deg)",
                            background: "rgba(244,240,228,0.95)",
                          }}>
                          VERIFIED
                        </div>
                      )}

                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(244,240,228,0.45)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                        Latest Entry
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#F4F0E4", lineHeight: 1.2 }}>
                        {latestSub.actionType}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(244,240,228,0.55)" }}>
                        Location: {latestSub.geoHash}
                      </div>

                      <div className="flex items-center gap-2 mt-2 pt-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: "#355E3B", fontSize: 8, color: "#F4F0E4", fontWeight: 700, flexShrink: 0 }}>G</div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(244,240,228,0.5)" }}>
                          Verified by GreenGuardian
                        </span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(244,240,228,0.35)", marginTop: 2 }}>
                        Time: Today, 09:42 AM
                      </div>
                    </div>

                    {latestSub.resolved && latestSub.approved && !latestSub.claimed ? (
                      <button onClick={() => handleClaim(latestSub.id)} className="btn-expedition w-full justify-center">
                        Claim cUSD Reward
                      </button>
                    ) : latestSub.claimed ? (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-lg"
                        style={{ background: "rgba(53,94,59,0.08)", border: "1px solid rgba(53,94,59,0.3)", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "#355E3B", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        <Icon.check /> Reward Claimed
                      </div>
                    ) : (
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#4A4A38", textAlign: "center", padding: "6px 0" }}>
                        Awaiting peer resolution…
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4A4A38", textAlign: "center", padding: "20px 0" }}>
                    No submissions yet.
                  </div>
                )}
              </div>

              {/* V. Ranks & Stamps */}
              <div className="paper-card p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="section-label">V. Ranks &amp; Stamps</div>
                  <button className="btn-ghost" style={{ fontSize: 8, padding: "3px 8px" }}>View all →</button>
                </div>

                <div className="flex flex-col gap-2">
                  {leaderboard.slice(0, 5).map((entry, i) => (
                    <div key={i} className="flex items-center gap-3.5 py-2.5 px-3 rounded-lg transition-all"
                      style={{
                        border: entry.isCurrentUser ? "1px solid rgba(53,94,59,0.3)" : "1px solid transparent",
                        background: entry.isCurrentUser ? "rgba(53,94,59,0.04)" : "transparent",
                        fontWeight: entry.isCurrentUser ? 700 : 400,
                      }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4A4A38", width: 16, textAlign: "right", flexShrink: 0 }}>
                        #{entry.rank}
                      </span>
                      <div className="flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ width: 24, height: 24, background: i === 0 ? "#B88B4A" : i === 1 ? "#C4B89A" : i === 2 ? "#B87A5A" : "rgba(29,52,39,0.08)", color: i < 3 ? "#1D3427" : "#4A4A38", fontSize: 9, fontWeight: 700 }}>
                        {i < 3 ? ["🥇","🥈","🥉"][i] : <Icon.leaf />}
                      </div>
                      <span className="flex-1 truncate" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#1D3427" }}>
                        {entry.name}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#355E3B", flexShrink: 0 }}>
                        {entry.stamps} stamps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            </div>
          )}

          {activeNav === "passport" && (
            <PassportView
              walletConnected={walletConnected}
              userAddress={userAddress}
              streakCount={streakCount}
              expeditionLevel={expeditionLevel}
              balance={balance}
              submissions={submissions}
              setActiveNav={setActiveNav}
            />
          )}

          {activeNav === "missions" && (
            <MissionsView
              submissions={submissions}
              setSimMessage={setSimMessage}
            />
          )}

          {activeNav === "rewards" && (
            <RewardsView
              walletConnected={walletConnected}
              userAddress={userAddress}
              expeditionLevel={expeditionLevel}
              setSimMessage={setSimMessage}
            />
          )}
        </div>{/* /scrollable body */}
      </div>{/* /main content */}
    </div>/* /root */
  );
}
