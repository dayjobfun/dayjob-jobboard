// Token address for gating job postings
// Replace with your actual SPL token address
export const TOKEN_ADDRESS = "YOUR_TOKEN_ADDRESS_HERE";
export const REQUIRED_TOKEN_AMOUNT = 1_000_000; // 10 million tokens

// RPC endpoint - using public Solana RPC
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  process.env.SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

export const MEMO_PROGRAM_ADDRESS =
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

export const DAYJOB_MEMO_TAG = "DAYJOB";

export const DAYJOB_INDEX_ADDRESS =
  process.env.NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS ||
  process.env.DAYJOB_INDEX_ADDRESS ||
  "";

// For development, you might want to use devnet
// export const SOLANA_RPC_URL = "https://api.devnet.solana.com";

