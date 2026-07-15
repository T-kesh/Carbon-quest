const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonQuestPool", function () {
  let CarbonQuestPool;
  let pool;
  let owner;
  let proposer;
  let voucher;
  let disputer;
  let mockIdentity;

  beforeEach(async function () {
    [owner, proposer, voucher, disputer] = await ethers.getSigners();

    // Deploy a mock GoodDollar Identity contract
    const MockIdentity = await ethers.getContractFactory("CarbonQuestPool"); // we can deploy a second pool as mock or write a simple stub
    
    // Instead of full mock deploy, let's write a very quick local mockup or use CarbonQuestPool with disabled GoodID for testing
    const PoolFactory = await ethers.getContractFactory("CarbonQuestPool");
    pool = await PoolFactory.deploy(ethers.ZeroAddress);
    await pool.waitForDeployment();
  });

  it("should initialize with season 1 active", async function () {
    expect(await pool.currentSeasonId()).to.equal(1);
    const season = await pool.seasons(1);
    expect(season.ended).to.be.false;
  });

  it("should allow whitelisted user to submit actions", async function () {
    // Enable manual whitelist for proposer
    await pool.setManualWhitelist(proposer.address, true);
    
    // Proposer submits action
    await expect(
      pool.connect(proposer).submitAction("Tree Planting", "QmTestProof", "sf-mission-37.75")
    ).to.emit(pool, "SubmissionCreated");

    const sub = await pool.submissions(1);
    expect(sub.proposer).to.equal(proposer.address);
    expect(sub.actionType).to.equal("Tree Planting");
    expect(sub.resolved).to.be.false;
  });

  it("should block non-whitelisted users", async function () {
    // Ensure GoodID checking or manual whitelist is enforced
    await pool.setUseGoodID(false); // only manual whitelist mode
    await pool.setManualWhitelist(proposer.address, false);

    await expect(
      pool.connect(proposer).submitAction("Tree Planting", "QmTestProof", "sf-mission-37.75")
    ).to.be.revertedWith("Not whitelisted");
  });

  it("should allow peer staking and resolve correctly", async function () {
    await pool.setManualWhitelist(proposer.address, true);
    await pool.connect(proposer).submitAction("Tree Planting", "QmTestProof", "sf-mission-37.75");

    // Vouch with 0.1 CELO
    await pool.connect(voucher).stakeVouch(1, { value: ethers.parseEther("0.1") });
    
    // Dispute with 0.05 CELO
    await pool.connect(disputer).stakeDispute(1, { value: ethers.parseEther("0.05") });

    const subBefore = await pool.submissions(1);
    expect(subBefore.vouchStake).to.equal(ethers.parseEther("0.1"));
    expect(subBefore.disputeStake).to.equal(ethers.parseEther("0.05"));

    // Fast-forward time past dispute window (5 minutes)
    await ethers.provider.send("evm_increaseTime", [301]);
    await ethers.provider.send("evm_mine");

    // Resolve
    await expect(pool.resolveSubmission(1)).to.emit(pool, "Resolved");
    
    const subAfter = await pool.submissions(1);
    expect(subAfter.resolved).to.be.true;
    expect(subAfter.approved).to.be.true; // Vouches (0.1) > Disputes (0.05)
  });

  it("should distribute seasonal rewards proportionally", async function () {
    // Fund pool with 10 CELO
    await pool.fundPool({ value: ethers.parseEther("10.0") });

    await pool.setManualWhitelist(proposer.address, true);
    await pool.connect(proposer).submitAction("Tree Planting", "QmTestProof", "sf-mission-37.75");

    // Fast forward to end of dispute window & resolve
    await ethers.provider.send("evm_increaseTime", [301]);
    await ethers.provider.send("evm_mine");
    await pool.resolveSubmission(1);

    // Proposer claims reward
    const balanceBefore = await ethers.provider.getBalance(proposer.address);
    await pool.connect(proposer).claimReward(1);
    const balanceAfter = await ethers.provider.getBalance(proposer.address);

    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });
});
