import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { readDB, writeDB } from "./db";
import { startResolutionWorker } from "./cron/resolver";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Vision Pre-check helper
function visionPrecheck(photoUrl: string, actionType: string): { passed: boolean; reason: string } {
  if (!photoUrl) {
    return { passed: true, reason: "No evidence image supplied. Continuing to manual peer review." };
  }

  // Simple heuristic checks for mock vision verification
  const lowerUrl = photoUrl.toLowerCase();
  
  if (lowerUrl.includes("spam") || lowerUrl.includes("duplicate") || lowerUrl.includes("fake")) {
    return { passed: false, reason: "Vision agent flagged evidence photo as high-probability duplicate/fake." };
  }
  
  if (actionType === "Tree Planting" && !lowerUrl.includes("tree") && !lowerUrl.includes("plant") && !lowerUrl.includes("nature") && !lowerUrl.includes("photo")) {
    return { passed: false, reason: "Vision pre-check failed: Image does not appear to contain vegetation or planting activity." };
  }

  if (actionType === "E-waste Drop-off" && !lowerUrl.includes("waste") && !lowerUrl.includes("device") && !lowerUrl.includes("recycle") && !lowerUrl.includes("photo")) {
    return { passed: false, reason: "Vision pre-check failed: Image does not appear to contain electronic components or collection points." };
  }

  return { passed: true, reason: "Vision precheck cleared. Safe for peer staking." };
}

// 1. Get Submissions
app.get("/api/submissions", (req, res) => {
  const db = readDB();
  res.json({ success: true, submissions: db.submissions });
});

// 2. Submit / Pin Proof to IPFS with Vision Pre-check
app.post("/api/pin", (req, res) => {
  const { actionType, geoHash, photo, proposer } = req.body;

  if (!actionType || !geoHash) {
    return res.status(400).json({ success: false, error: "Missing actionType or geoHash" });
  }

  // Perform Vision pre-check
  const precheck = visionPrecheck(photo, actionType);
  if (!precheck.passed) {
    return res.status(422).json({
      success: false,
      error: precheck.reason,
      visionCheckFailed: true
    });
  }

  // Simulate IPFS CID calculation
  const mockCID = `QmQuestSim${Math.floor(Math.random() * 1000000000)}`;

  const db = readDB();
  const newSub = {
    id: db.submissions.length + 1,
    proposer: proposer || "0xAnonymousProposer",
    actionType,
    proofHash: mockCID,
    geoHash,
    timestamp: new Date().toISOString(),
    vouchStake: 0,
    disputeStake: 0,
    vouchersCount: 0,
    disputersCount: 0,
    claimWeight: 100,
    resolved: false,
    approved: false,
    claimed: false,
    imageUrl: photo || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80"
  };

  db.submissions.unshift(newSub);
  writeDB(db);

  res.json({
    success: true,
    cid: mockCID,
    precheckMessage: precheck.reason,
    submission: newSub
  });
});

// 3. Staking (Vouch / Dispute) Index update
app.post("/api/review", (req, res) => {
  const { id, type, amount } = req.body; // type: 'vouch' | 'dispute'
  const db = readDB();
  const subIdx = db.submissions.findIndex(s => s.id === Number(id));

  if (subIdx === -1) {
    return res.status(404).json({ success: false, error: "Submission not found" });
  }

  const sub = db.submissions[subIdx];
  const value = parseFloat(amount) || 0.05;

  if (type === "vouch") {
    sub.vouchStake = Number((sub.vouchStake + value).toFixed(4));
    sub.vouchersCount++;
  } else if (type === "dispute") {
    sub.disputeStake = Number((sub.disputeStake + value).toFixed(4));
    sub.disputersCount++;
  }

  writeDB(db);
  res.json({ success: true, submission: sub });
});

// 4. Resolve Submission
app.post("/api/resolve", (req, res) => {
  const { id } = req.body;
  const db = readDB();
  const subIdx = db.submissions.findIndex(s => s.id === Number(id));

  if (subIdx === -1) {
    return res.status(404).json({ success: false, error: "Submission not found" });
  }

  const sub = db.submissions[subIdx];
  sub.resolved = true;
  sub.approved = sub.vouchStake >= sub.disputeStake;

  writeDB(db);
  res.json({ success: true, submission: sub });
});

// 5. Get Leaderboard
app.get("/api/leaderboard", (req, res) => {
  const { address } = req.query;
  const db = readDB();

  let board = [...db.leaderboard];

  if (address) {
    const userAddr = String(address);
    const existing = board.find(item => item.address?.toLowerCase() === userAddr.toLowerCase());
    if (!existing) {
      board.push({
        rank: board.length + 1,
        name: `${userAddr.substring(0, 6)}...${userAddr.substring(userAddr.length - 4)} (You)`,
        stamps: 7,
        totalEarned: "21.00 cUSD",
        address: userAddr
      });
    }
  }

  res.json({ success: true, leaderboard: board });
});

app.listen(PORT, () => {
  console.log(`Carbon Quest backend active at http://localhost:${PORT}`);
  startResolutionWorker();
});
