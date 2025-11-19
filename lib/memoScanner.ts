/**
 * Direct memo scanning - reads memos from Solana chain
 * This bypasses the registry and reads directly from on-chain memos
 */

import { Connection, PublicKey } from "@solana/web3.js";
import {
  DAYJOB_INDEX_ADDRESS,
  SOLANA_RPC_URL,
} from "./constants";
import {
  fetchFromIPFS,
  JobPost,
  JobRecord,
  PostType,
  TalentProfile,
  TalentRecord,
} from "./storage";
import { parseMemoString } from "./solanaMemoStorage";

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

/**
 * Scan memos directly from the index address
 * This reads all transactions that mention the index address and extracts DAYJOB memos
 */
export async function scanMemosFromChain<T extends PostType>(
  type: T,
  limit = 50
): Promise<T extends "JOB" ? JobRecord[] : TalentRecord[]> {
  if (!DAYJOB_INDEX_ADDRESS) {
    console.warn("DAYJOB_INDEX_ADDRESS not configured");
    return [] as any;
  }

  const indexAddress = new PublicKey(DAYJOB_INDEX_ADDRESS);

  // Get all transaction signatures that mention the index address
  const signatures = await connection.getSignaturesForAddress(indexAddress, {
    limit,
  });

  if (!signatures.length) {
    return [] as any;
  }

  // Parse all transactions
  const parsedTxs = await connection.getParsedTransactions(
    signatures.map((s) => s.signature),
    {
      maxSupportedTransactionVersion: 0,
    }
  );

  // Extract memos and fetch IPFS data
  const records = await Promise.all(
    parsedTxs.map(async (tx, idx) => {
      if (!tx) return null;

      // Find memo instruction
      const instructions = tx.transaction.message.instructions;
      const memoIx = instructions.find(
        (ix: any) => "program" in ix && ix.program === "spl-memo"
      );

      if (!memoIx || !("parsed" in memoIx)) return null;

      // Extract memo string
      const memoData =
        typeof memoIx.parsed === "string"
          ? memoIx.parsed
          : memoIx.parsed?.memo ?? "";

      // Parse DAYJOB memo
      const parsed = parseMemoString(memoData);
      if (!parsed || parsed.type !== type) return null;

      try {
        // Fetch data from IPFS
        const data = (await fetchFromIPFS(
          parsed.cid
        )) as T extends "JOB" ? JobPost : TalentProfile;

        // Get wallet address from transaction
        const accountKey = tx.transaction.message.accountKeys[0];
        const wallet =
          typeof accountKey === "string"
            ? accountKey
            : accountKey?.pubkey?.toString() ?? "";

        return {
          ...(data as any),
          cid: parsed.cid,
          signature: signatures[idx]?.signature,
          wallet,
          timestamp: (tx.blockTime ?? Date.now() / 1000) * 1000,
          slot: tx.slot,
        };
      } catch (error) {
        console.error("Failed to fetch IPFS content for CID", parsed.cid, error);
        return null;
      }
    })
  );

  // Filter out nulls and sort by timestamp
  return records
    .filter(Boolean)
    .sort((a: any, b: any) => b.timestamp - a.timestamp) as any;
}

export function scanJobMemos(limit = 50) {
  return scanMemosFromChain("JOB", limit) as Promise<JobRecord[]>;
}

export function scanTalentMemos(limit = 50) {
  return scanMemosFromChain("TALENT", limit) as Promise<TalentRecord[]>;
}

