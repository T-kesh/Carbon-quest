import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // GoodDollar Identity contract on Celo Alfajores
  // Address: 0x38612c2084e7ec274b5952f3993bcc3321528659
  const goodIdAddress = hre.ethers.getAddress("0x38612c2084e7ec274b5952f3993bcc3321528659");

  console.log("Using Checksummed GoodID Contract Address:", goodIdAddress);

  const CarbonQuestPool = await hre.ethers.getContractFactory("CarbonQuestPool");
  const pool = await CarbonQuestPool.deploy(goodIdAddress);

  await pool.waitForDeployment();
  const address = await pool.getAddress();

  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("Local network detected. Disabling GoodID on-chain whitelist checks...");
    const tx = await pool.setUseGoodID(false);
    await tx.wait();
  }

  console.log("CarbonQuestPool contract successfully deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
