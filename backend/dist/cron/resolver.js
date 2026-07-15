"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startResolutionWorker = startResolutionWorker;
const db_1 = require("../db");
const ethers_1 = require("ethers");
// Dispute window duration in milliseconds (5 minutes = 300,000 ms)
const DISPUTE_WINDOW_MS = 5 * 60 * 1000;
// Optional: Set up connection to Celo testnet contract if configured
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PROVIDER_URL = process.env.PROVIDER_URL || "https://alfajores-forno.celo-testnet.org";
const CONTRACT_ABI = [
    "function resolveSubmission(uint256 submissionId) external"
];
async function tryOnChainResolve(submissionId) {
    if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
        // Fail silently or log that it's database-only mode
        return;
    }
    try {
        const provider = new ethers_1.ethers.JsonRpcProvider(PROVIDER_URL);
        const wallet = new ethers_1.ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers_1.ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
        console.log(`[Cron] Firing on-chain resolveSubmission for ID #${submissionId}...`);
        const tx = await contract.resolveSubmission(submissionId);
        await tx.wait();
        console.log(`[Cron] On-chain transaction resolved successfully: ${tx.hash}`);
    }
    catch (err) {
        console.error(`[Cron] Failed to resolve ID #${submissionId} on-chain:`, err.message);
    }
}
function startResolutionWorker() {
    console.log("[Cron] Auto-resolution worker initialized. Checking database every 30 seconds...");
    setInterval(async () => {
        try {
            const db = (0, db_1.readDB)();
            let updated = false;
            const now = Date.now();
            for (let i = 0; i < db.submissions.length; i++) {
                const sub = db.submissions[i];
                if (!sub.resolved) {
                    const elapsed = now - new Date(sub.timestamp).getTime();
                    if (elapsed >= DISPUTE_WINDOW_MS) {
                        console.log(`[Cron] Dispute window elapsed for Submission #${sub.id}. Resolving...`);
                        sub.resolved = true;
                        sub.approved = sub.vouchStake >= sub.disputeStake;
                        updated = true;
                        // Trigger actual contract interaction in parallel
                        await tryOnChainResolve(sub.id);
                    }
                }
            }
            if (updated) {
                (0, db_1.writeDB)(db);
                console.log("[Cron] Database state updated with resolved items.");
            }
        }
        catch (e) {
            console.error("[Cron] Error running resolver loop:", e.message);
        }
    }, 30000); // Check every 30 seconds
}
