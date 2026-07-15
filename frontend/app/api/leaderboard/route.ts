import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get("address");

  const mockLeaderboard = [
    { rank: 1, name: "EcoSamurai.celo", stamps: 42, totalEarned: "142.50 cUSD", isCurrentUser: false },
    { rank: 2, name: "GreenQueen.celo", stamps: 38, totalEarned: "128.20 cUSD", isCurrentUser: false },
    { rank: 3, name: "SolarPioneer.celo", stamps: 31, totalEarned: "94.00 cUSD", isCurrentUser: false },
    { rank: 4, name: "LeafWatcher.celo", stamps: 25, totalEarned: "75.50 cUSD", isCurrentUser: false },
    { rank: 5, name: "RecycleHero.celo", stamps: 19, totalEarned: "54.10 cUSD", isCurrentUser: false },
  ];

  if (userAddress) {
    const formattedAddress = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    const userExists = mockLeaderboard.some(
      (item) => item.name.toLowerCase() === userAddress.toLowerCase()
    );

    if (!userExists) {
      // Add or merge current user's stats
      mockLeaderboard.push({
        rank: 6,
        name: `${formattedAddress} (You)`,
        stamps: 7, // starting with a demo streak
        totalEarned: "21.00 cUSD",
        isCurrentUser: true,
      });
    }
  }

  return NextResponse.json({
    success: true,
    leaderboard: mockLeaderboard,
  });
}
