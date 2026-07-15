"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDB = readDB;
exports.writeDB = writeDB;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, "../db.json");
const DEFAULT_STATE = {
    submissions: [
        {
            id: 1,
            proposer: "0x3A216e255375A224f2b189E677EEaB0833C6693D",
            actionType: "Tree Planting",
            proofHash: "QmTree129841",
            geoHash: "sf-presidio-37.80",
            timestamp: new Date().toISOString(),
            vouchStake: 0.15,
            disputeStake: 0.0,
            vouchersCount: 3,
            disputersCount: 0,
            claimWeight: 120,
            resolved: true,
            approved: true,
            claimed: false,
            imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80",
        },
        {
            id: 2,
            proposer: "0x89C189E677EEaB0833C6693DFeaa979e37447eee",
            actionType: "E-waste Drop-off",
            proofHash: "QmEwaste88490",
            geoHash: "nyc-manhattan-40.71",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            vouchStake: 0.05,
            disputeStake: 0.1,
            vouchersCount: 1,
            disputersCount: 2,
            claimWeight: 100,
            resolved: false,
            approved: false,
            claimed: false,
            imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80",
        }
    ],
    leaderboard: [
        { rank: 1, name: "EcoSamurai.celo", stamps: 42, totalEarned: "142.50 cUSD", address: "0x3A216e255375A224f2b189E677EEaB0833C6693D" },
        { rank: 2, name: "GreenQueen.celo", stamps: 38, totalEarned: "128.20 cUSD" },
        { rank: 3, name: "SolarPioneer.celo", stamps: 31, totalEarned: "94.00 cUSD" },
        { rank: 4, name: "LeafWatcher.celo", stamps: 25, totalEarned: "75.50 cUSD" },
        { rank: 5, name: "RecycleHero.celo", stamps: 19, totalEarned: "54.10 cUSD" }
    ]
};
function readDB() {
    if (!fs_1.default.existsSync(DB_PATH)) {
        writeDB(DEFAULT_STATE);
        return DEFAULT_STATE;
    }
    try {
        const data = fs_1.default.readFileSync(DB_PATH, "utf-8");
        return JSON.parse(data);
    }
    catch (e) {
        return DEFAULT_STATE;
    }
}
function writeDB(state) {
    fs_1.default.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf-8");
}
