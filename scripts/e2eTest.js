import hre from "hardhat";
import { expect } from "chai";

async function main() {
  console.log("=== STARTING CARBON QUEST CONTRACT LIFECYCLE E2E TEST ===");

  const [owner, proposer, voucher, disputer] = await hre.ethers.getSigners();
  console.log(`Owner: ${owner.address}`);
  console.log(`Proposer: ${proposer.address}`);
  console.log(`Voucher: ${voucher.address}`);
  console.log(`Disputer: ${disputer.address}\n`);

  // 1. Deploy Contract
  console.log("1. Deploying CarbonQuestPool...");
  const CarbonQuestPool = await hre.ethers.getContractFactory("CarbonQuestPool");
  // Deploy with dummy GoodID contract address (address(0))
  const pool = await CarbonQuestPool.deploy(hre.ethers.ZeroAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log(`CarbonQuestPool deployed to: ${poolAddress}\n`);

  // 2. Set Up Whitelist
  console.log("2. Configuring whitelist settings...");
  // Disable GoodID for local simulation, fallback to manual whitelist
  await pool.setUseGoodID(false);
  await pool.setManualWhitelist(proposer.address, true);
  console.log(`Whitelisted proposer: ${proposer.address}\n`);

  // 3. Fund Season Pool
  console.log("3. Funding seasonal reward pool...");
  const fundAmount = hre.ethers.parseEther("10.0"); // 10 CELO
  await pool.fundPool({ value: fundAmount });
  const season = await pool.seasons(1);
  console.log(`Season 1 reward pool funded with: ${hre.ethers.formatEther(season.totalRewardPool)} CELO\n`);

  // 4. Submit Eco Action
  console.log("4. Submitting eco action proof...");
  const actionType = "Tree Planting";
  const proofHash = "QmTreeQuestProofHash123456789";
  const geoHash = "sf-presidio-37.80";

  const submitTx = await pool.connect(proposer).submitAction(actionType, proofHash, geoHash);
  const receipt = await submitTx.wait();
  console.log("Action submitted successfully! Tx Hash:", submitTx.hash);

  const sub = await pool.submissions(1);
  console.log(`Submission ID #1 Proposer: ${sub.proposer}`);
  console.log(`Submission ID #1 Claim Weight: ${sub.claimWeight} points`);
  console.log(`Submission ID #1 Dispute Deadline: ${new Date(Number(sub.disputeDeadline) * 1000).toISOString()}\n`);

  // 5. Peer Review Staking
  console.log("5. Placing peer review stakes...");
  const vouchAmt = hre.ethers.parseEther("0.2"); // 0.2 CELO vouch
  const disputeAmt = hre.ethers.parseEther("0.1"); // 0.1 CELO dispute

  console.log(`Voucher staking ${hre.ethers.formatEther(vouchAmt)} CELO...`);
  const vouchTx = await pool.connect(voucher).stakeVouch(1, { value: vouchAmt });
  await vouchTx.wait();

  console.log(`Disputer staking ${hre.ethers.formatEther(disputeAmt)} CELO...`);
  const disputeTx = await pool.connect(disputer).stakeDispute(1, { value: disputeAmt });
  await disputeTx.wait();

  const subStaked = await pool.submissions(1);
  console.log(`Submission #1 Vouch Pool: ${hre.ethers.formatEther(subStaked.vouchStake)} CELO`);
  console.log(`Submission #1 Dispute Pool: ${hre.ethers.formatEther(subStaked.disputeStake)} CELO\n`);

  // 6. Fast Forward Dispute Window
  console.log("6. Fast-forwarding time past dispute window (5 minutes)...");
  await hre.network.provider.send("evm_increaseTime", [301]); // 301 seconds
  await hre.network.provider.send("evm_mine");
  console.log("Time advanced successfully.\n");

  // 7. Resolve Submission
  console.log("7. Resolving submission...");
  const balanceVoucherBefore = await hre.ethers.provider.getBalance(voucher.address);
  
  const resolveTx = await pool.resolveSubmission(1);
  await resolveTx.wait();
  
  const subResolved = await pool.submissions(1);
  console.log(`Submission Resolved Status: ${subResolved.resolved ? "RESOLVED" : "PENDING"}`);
  console.log(`Submission Approval Status: ${subResolved.approved ? "APPROVED" : "REJECTED"}`);

  // Verify voucher reward distribution (got stake + split of dispute slash)
  const balanceVoucherAfter = await hre.ethers.provider.getBalance(voucher.address);
  console.log(`Voucher starting balance: ${hre.ethers.formatEther(balanceVoucherBefore)} CELO`);
  console.log(`Voucher ending balance:   ${hre.ethers.formatEther(balanceVoucherAfter)} CELO`);
  console.log(`Voucher net yield:        +${hre.ethers.formatEther(balanceVoucherAfter - balanceVoucherBefore)} CELO\n`);

  // 8. Claim Seasonal Pool Payout
  console.log("8. Claiming proportional reward payout...");
  const balanceProposerBefore = await hre.ethers.provider.getBalance(proposer.address);

  const claimTx = await pool.connect(proposer).claimReward(1);
  await claimTx.wait();

  const balanceProposerAfter = await hre.ethers.provider.getBalance(proposer.address);
  const rewardClaimed = balanceProposerAfter - balanceProposerBefore;
  console.log(`Proposer starting balance: ${hre.ethers.formatEther(balanceProposerBefore)} CELO`);
  console.log(`Proposer ending balance:   ${hre.ethers.formatEther(balanceProposerAfter)} CELO`);
  console.log(`Proposer payout reward:    +${hre.ethers.formatEther(rewardClaimed)} CELO`);
  console.log("=========================================================");
  console.log("=== E2E CONTRACT LIFECYCLE COMPLETED SUCCESSFULLY ====");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
