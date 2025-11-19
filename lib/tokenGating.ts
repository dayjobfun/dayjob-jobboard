import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_ADDRESS, REQUIRED_TOKEN_AMOUNT, SOLANA_RPC_URL } from "./constants";

export async function checkTokenBalance(
  walletAddress: string
): Promise<{ hasAccess: boolean; balance: number }> {
  try {
    // Validate token address
    if (TOKEN_ADDRESS === "YOUR_TOKEN_ADDRESS_HERE") {
      console.warn("Token address not configured");
      return { hasAccess: false, balance: 0 };
    }

    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
    const tokenMint = new PublicKey(TOKEN_ADDRESS);
    const walletPubkey = new PublicKey(walletAddress);

    // Get all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { mint: tokenMint }
    );

    let totalBalance = 0;

    for (const accountInfo of tokenAccounts.value) {
      const parsedInfo = accountInfo.account.data.parsed.info;
      // uiAmount is already in human-readable format (accounts for decimals)
      const balance = parsedInfo.tokenAmount.uiAmount || 0;
      totalBalance += balance;
    }

    return {
      hasAccess: totalBalance >= REQUIRED_TOKEN_AMOUNT,
      balance: totalBalance,
    };
  } catch (error) {
    console.error("Error checking token balance:", error);
    // If token doesn't exist or wallet doesn't have the token, return false
    return { hasAccess: false, balance: 0 };
  }
}

