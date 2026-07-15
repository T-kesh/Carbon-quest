# Carbon Quest

> **Expedition Field Journal Protocol** — A gamified ReFi application built for the Celo/MiniPay MiniApp ecosystem that incentivizes real-world ecological actions through peer-vouched staking pools and proportional seasonal reward distributions.

Carbon Quest is intentionally designed as a premium expedition journal rather than a crypto wallet or generic SaaS dashboard. The user interface evokes exploration, scientific documentation, ranger equipment, and official conservation passport logs, turning environmental action verification into a satisfying tactile experience.

---

## 📂 Workspace Architecture

The workspace is organized into a modular three-layer structure to separate visual presentations, automation protocols, and blockchain logic:

```
carbon-quest/
├── frontend/               <-- Next.js Frontend MiniApp (Experience Layer)
│   ├── app/
│   │   ├── platform.ts     <-- Web3 & Wallet abstraction wrapper (Platform Layer)
│   │   ├── page.tsx        <-- Premium 3-column dashboard UI (Experience Layer)
│   │   └── globals.css     <-- Papermorphic design system & custom animations
├── backend/                <-- Standalone Express Node/TS indexing service
│   ├── src/
│   │   ├── cron/resolver.ts <-- Dispute window auto-resolution worker
│   │   └── server.ts       <-- IPFS Pinata integration & API endpoints
└── contracts/              <-- Celo smart contracts
    ├── CarbonQuestPool.sol <-- Core pool, staking, whitelists, and math formulas
    └── scripts/deploy.js   <-- Hardhat deployment configuration
```

---

## ✅ Completed Implementations

### 1. Smart Contracts & Testing Suite (`/contracts`)
*   **`CarbonQuestPool.sol`**: Implements GoodDollar `Identity` contract whitelist integrations (`0x38612c2084e7ec274b5952f3993bcc3321528659` on Celo Alfajores) with manual whitelist testing toggles.
*   **Staking Mechanics**: Programmed `stakeVouch` and `stakeDispute` locking contracts.
*   **Season Payout Math**: Implements proportional seasonal pool reward payouts based on claim weights ($Reward = \frac{Weight}{TotalWeight} \times Pool$).
*   **Hardhat Configuration**: Solidity optimizer and `viaIR` settings compiled under stable Hardhat `2.22.15`.
*   **Contract Unit Coverage**: Complete suite containing unit tests covering whitelist checks, ties, and proportional allocations.
*   **E2E Integration Test**: End-to-end local test script (`scripts/e2eTest.js`) verifying the entire contract lifecycle (Deploy → Fund Pool → Submit Action → Peer Stake → Resolve Slashes → Claim Seasonal Payouts).

### 2. Standalone Indexer & Automation Service (`/backend`)
*   **Express REST Server**: Implements endpoints for fetching user stats, active peer reviews, and leaderboard rankings.
*   **Real IPFS Pinning**: Integrates metadata JSON pinning via the Pinata REST API, with fallback simulation mock CIDs if variables are missing.
*   **Dispute Auto-Resolution Worker**: Background cron checking database states every 30 seconds to automatically trigger contract `resolveSubmission` transactions once dispute windows expire.
*   **Pre-seeded Database State**: Configured default data arrays with rich historical and active reviews for demonstration.

### 3. Frontend MiniApp & Design System (`/frontend`)
*   **Three-Layer Isolation Abstraction (`platform.ts`)**: Completely isolates all `ethers.js` wallet setups, contract initializations, and transaction executions from visual views, transforming raw Web3 errors into readable journal-native events.
*   **Premium Visual Redesign (`page.tsx`)**: Reconstructed a premium 3-column dashboard layout (Metrics & Streaks | Submit Clipboard & Peer Review Feed | Stamp Verification Card & Leaderboard Notice Board).
*   **Tactile Papermorphic Theme**: Custom fonts (Sora, IBM Plex Mono), warm recycled paper color tokens, 3.5% opacity SVG paper grain overlay, and micro-interactions (rubber stamp impacts, paper slides, ink writing).

---

## 📋 Outstanding Roadmap Tasks (To Be Done)

### Phase 4: Live Integration & Testnet Deployments
- [ ] Deploy `CarbonQuestPool.sol` to the Celo Alfajores Testnet and update address in `platform.ts`.
- [ ] Connect the Express automated cron worker to the deployed Alfajores testnet instance.
- [ ] Conduct live multi-user testnet dry runs.

### Phase 5: Mobile Compatibility & Showcase Polish
- [ ] Perform a mobile responsiveness pass and test specifically inside MiniPay's embedded mobile viewport.
- [ ] Add image compression on proof photo upload for patchy mobile connections.
- [ ] Add rate limiting to submission endpoints.

### Phase 6: Extended Post-MVP Feature Modules
- [ ] **Expedition Passport**: A detailed personal profile tab showcasing rank history and certificates.
- [ ] **Mission Map**: An interactive map view displaying geohashes of verified actions globally.
- [ ] **Eco Heatmap**: Regional density visualizer highlighting community-wide restoration hotspots.
- [ ] **Milestone Certificate Generator**: Utility to export downloadable conservation certificates for achievements.

---

## 🚀 Local Installation & Execution

### 1. Hardhat Contracts & Testing
```bash
# Install root contract dependencies
npm install

# Compile contracts and run tests
npx hardhat compile
npx hardhat test

# Run E2E contract lifecycle integration test
npx hardhat run scripts/e2eTest.js --network hardhat
```

### 2. Run Backend Service
Create `/backend/.env` with your variables:
```env
PORT=4000
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
PRIVATE_KEY=your_celo_operator_private_key
CONTRACT_ADDRESS=deployed_pool_address
```
```bash
cd backend
npm install
npm run build
npm start
```

### 3. Run Frontend App
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.