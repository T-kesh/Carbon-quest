"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const resolver_1 = require("./cron/resolver");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Vision Pre-check helper
function visionPrecheck(photoUrl, actionType) {
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
    const db = (0, db_1.readDB)();
    res.json({ success: true, submissions: db.submissions });
});
// 2. Submit / Pin Proof to IPFS with Vision Pre-check
app.post("/api/pin", async (req, res) => {
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
    let finalCID = `QmQuestSim${Math.floor(Math.random() * 1000000000)}`;
    let isPinnedReal = false;
    // Real IPFS Pinata Integration if credentials are set
    const pinataKey = process.env.PINATA_API_KEY;
    const pinataSecret = process.env.PINATA_SECRET_API_KEY;
    if (pinataKey && pinataSecret) {
        try {
            console.log("[Backend] Uploading metadata to IPFS via Pinata...");
            const pinPayload = {
                pinataContent: {
                    actionType,
                    geoHash,
                    photoUrl: photo || "",
                    proposer: proposer || "0xAnonymous",
                    timestamp: new Date().toISOString()
                },
                pinataMetadata: {
                    name: `CarbonQuest_${actionType}_${geoHash}.json`
                }
            };
            const pinResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "pinata_api_key": pinataKey,
                    "pinata_secret_api_key": pinataSecret
                },
                body: JSON.stringify(pinPayload)
            });
            if (pinResponse.ok) {
                const pinData = await pinResponse.json();
                finalCID = pinData.IpfsHash;
                isPinnedReal = true;
                console.log(`[Backend] IPFS Pin Successful: ${finalCID}`);
            }
            else {
                const errText = await pinResponse.text();
                console.error(`[Backend] Pinata failed with status ${pinResponse.status}: ${errText}`);
            }
        }
        catch (pinErr) {
            console.error("[Backend] Pinata upload error:", pinErr.message);
        }
    }
    const db = (0, db_1.readDB)();
    const newSub = {
        id: db.submissions.length + 1,
        proposer: proposer || "0xAnonymousProposer",
        actionType,
        proofHash: finalCID,
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
    (0, db_1.writeDB)(db);
    res.json({
        success: true,
        cid: finalCID,
        precheckMessage: precheck.reason,
        isPinnedReal,
        submission: newSub
    });
});
// 3. Staking (Vouch / Dispute) Index update
app.post("/api/review", (req, res) => {
    const { id, type, amount } = req.body; // type: 'vouch' | 'dispute'
    const db = (0, db_1.readDB)();
    const subIdx = db.submissions.findIndex(s => s.id === Number(id));
    if (subIdx === -1) {
        return res.status(404).json({ success: false, error: "Submission not found" });
    }
    const sub = db.submissions[subIdx];
    const value = parseFloat(amount) || 0.05;
    if (type === "vouch") {
        sub.vouchStake = Number((sub.vouchStake + value).toFixed(4));
        sub.vouchersCount++;
    }
    else if (type === "dispute") {
        sub.disputeStake = Number((sub.disputeStake + value).toFixed(4));
        sub.disputersCount++;
    }
    (0, db_1.writeDB)(db);
    res.json({ success: true, submission: sub });
});
// 4. Resolve Submission
app.post("/api/resolve", (req, res) => {
    const { id } = req.body;
    const db = (0, db_1.readDB)();
    const subIdx = db.submissions.findIndex(s => s.id === Number(id));
    if (subIdx === -1) {
        return res.status(404).json({ success: false, error: "Submission not found" });
    }
    const sub = db.submissions[subIdx];
    sub.resolved = true;
    sub.approved = sub.vouchStake >= sub.disputeStake;
    (0, db_1.writeDB)(db);
    res.json({ success: true, submission: sub });
});
// 5. Get Leaderboard
app.get("/api/leaderboard", (req, res) => {
    const { address } = req.query;
    const db = (0, db_1.readDB)();
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
    (0, resolver_1.startResolutionWorker)();
});
