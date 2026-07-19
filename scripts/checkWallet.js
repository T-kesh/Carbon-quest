import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const address = deployer.address;
  const balance = await hre.ethers.provider.getBalance(address);
  const balanceEth = hre.ethers.formatEther(balance);

  console.log("─────────────────────────────────────────");
  console.log("  Wallet address :", address);
  console.log("  CELO balance   :", balanceEth, "CELO");
  console.log("─────────────────────────────────────────");

  if (parseFloat(balanceEth) < 0.05) {
    console.warn("⚠️  Balance is very low. Get testnet CELO from:");
    console.warn("   https://faucet.celo.org/alfajores");
    console.warn("   You need at least ~0.05 CELO for deployment gas.");
  } else {
    console.log("✅  Balance looks sufficient for deployment.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
