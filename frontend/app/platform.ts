import { ethers } from "ethers";

// ABI wrapper for CarbonQuestPool
export const CARBON_QUEST_ABI = [
  "function submitAction(string actionType, string proofHash, string geoHash) external returns (uint256)",
  "function stakeVouch(uint256 submissionId) external payable",
  "function stakeDispute(uint256 submissionId) external payable",
  "function resolveSubmission(uint256 submissionId) external",
  "function claimReward(uint256 submissionId) external",
  "function currentSeasonId() external view returns (uint256)",
  "function seasons(uint256 id) external view returns (uint256 id, uint256 startTime, uint256 endTime, uint256 totalRewardPool, uint256 totalClaimWeight, bool ended)"
];

// Helper to translate raw errors to journal-native language
export function translateError(error: any): string {
  const errMsg = error?.message || String(error);
  if (errMsg.includes("Not GoodID or manual whitelisted")) {
    return "Verification Failed: Your address is not whitelisted on your Expedition Passport (GoodID check failed).";
  }
  if (errMsg.includes("Proposer cannot vouch") || errMsg.includes("Proposer cannot dispute")) {
    return "Action Blocked: An expedition leader cannot vouch or dispute their own entry.";
  }
  if (errMsg.includes("Already resolved")) {
    return "Action Void: This log entry has already been sealed and resolved.";
  }
  if (errMsg.includes("Dispute window closed")) {
    return "Action Expired: The peer verification window has already closed.";
  }
  if (errMsg.includes("Stake too low")) {
    return "Insufficient Collateral: Minimum stake for peer verification is 0.05 CELO.";
  }
  if (errMsg.includes("user rejected action") || errMsg.includes("ACTION_REJECTED")) {
    return "Signing Cancelled: Passport signature request was rejected.";
  }
  return `Protocol Error: ${errMsg.substring(0, 80)}`;
}

export interface WalletConnection {
  connected: boolean;
  address: string;
  balance: string;
  error?: string;
}

// Experience-isolated Platform functions
export async function connectPassport(): Promise<WalletConnection> {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const bal = await provider.getBalance(address);
      return {
        connected: true,
        address,
        balance: Number(ethers.formatEther(bal)).toFixed(2)
      };
    } catch (err: any) {
      return {
        connected: false,
        address: "",
        balance: "0.00",
        error: translateError(err)
      };
    }
  }
  // Generate random demo address
  const mockAddr = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return {
    connected: true,
    address: mockAddr,
    balance: "15.50"
  };
}

export async function submitEcoProof(
  actionType: string,
  geoHash: string,
  photoUrl: string,
  userAddress: string,
  contractAddress?: string
): Promise<{ success: boolean; cid: string; message: string; error?: string }> {
  try {
    // 1. Upload to IPFS Pinning backend route
    const ipfsRes = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType, geoHash, photo: photoUrl, proposer: userAddress })
    });
    
    const ipfsData = await ipfsRes.json();
    if (!ipfsRes.ok || !ipfsData.success) {
      return {
        success: false,
        cid: "",
        message: "",
        error: ipfsData.error || "IPFS pinning failed."
      };
    }

    const cid = ipfsData.cid;

    // 2. Onchain submission if contract address is present
    if (contractAddress && typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CARBON_QUEST_ABI, signer);
      
      console.log(`[Platform] Signing action onchain: ${actionType} with CID: ${cid}`);
      const tx = await contract.submitAction(actionType, cid, geoHash);
      await tx.wait();
      return {
        success: true,
        cid,
        message: "Your submission has been signed and recorded on Celo."
      };
    }

    // Demo/Simulated success
    return {
      success: true,
      cid,
      message: "Proof submitted. Your stamp is drying (awaiting peer verification)."
    };
  } catch (err: any) {
    return {
      success: false,
      cid: "",
      message: "",
      error: translateError(err)
    };
  }
}

export async function stakePeerReview(
  submissionId: number,
  side: "vouch" | "dispute",
  amount: string,
  contractAddress?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const value = ethers.parseEther(amount);

    if (contractAddress && typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CARBON_QUEST_ABI, signer);

      console.log(`[Platform] Submitting peer stake onchain: ${side} for ID: ${submissionId}`);
      const tx = side === "vouch" 
        ? await contract.stakeVouch(submissionId, { value }) 
        : await contract.stakeDispute(submissionId, { value });
      
      await tx.wait();
      return {
        success: true,
        message: `Staked ${amount} CELO successfully for ${side}.`
      };
    }

    return {
      success: true,
      message: `Simulated stake of ${amount} CELO on ${side} recorded.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: "",
      error: translateError(err)
    };
  }
}

export async function resolveSubmissionOnChain(
  submissionId: number,
  contractAddress?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    if (contractAddress && typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CARBON_QUEST_ABI, signer);

      console.log(`[Platform] Resolving submission onchain ID: ${submissionId}`);
      const tx = await contract.resolveSubmission(submissionId);
      await tx.wait();
      return {
        success: true,
        message: `Submission #${submissionId} successfully resolved onchain.`
      };
    }

    return {
      success: true,
      message: `Simulated resolution computed locally.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: "",
      error: translateError(err)
    };
  }
}

export async function claimRewardOnChain(
  submissionId: number,
  contractAddress?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    if (contractAddress && typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CARBON_QUEST_ABI, signer);

      console.log(`[Platform] Claiming seasonal reward onchain ID: ${submissionId}`);
      const tx = await contract.claimReward(submissionId);
      await tx.wait();
      return {
        success: true,
        message: "Reward claimed successfully from the season pool."
      };
    }

    return {
      success: true,
      message: "Reward claim simulated. Funds allocated."
    };
  } catch (err: any) {
    return {
      success: false,
      message: "",
      error: translateError(err)
    };
  }
}
