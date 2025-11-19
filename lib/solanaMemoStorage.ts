import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  DAYJOB_INDEX_ADDRESS,
  DAYJOB_MEMO_TAG,
  MEMO_PROGRAM_ADDRESS,
} from "./constants";
import { PostType } from "./storage";

const MEMO_PROGRAM_ID = new PublicKey(MEMO_PROGRAM_ADDRESS);

function getIndexerPublicKey(): PublicKey | null {
  if (!DAYJOB_INDEX_ADDRESS) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "DAYJOB_INDEX_ADDRESS not set. Configure NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS."
      );
    }
    return null;
  }
  return new PublicKey(DAYJOB_INDEX_ADDRESS);
}

export function buildMemoString(type: PostType, cid: string, postId: string) {
  return `${DAYJOB_MEMO_TAG}:${type}:${cid}:${postId}`;
}

export function parseMemoString(memo?: string | null) {
  if (!memo || !memo.startsWith(`${DAYJOB_MEMO_TAG}:`)) {
    return null;
  }

  const [, type, cid, postId] = memo.split(":");
  if (!type || !cid || !postId) return null;

  if (type !== "JOB" && type !== "TALENT") return null;

  return { type: type as PostType, cid, postId };
}

export function createMemoInstruction(
  type: PostType,
  cid: string,
  postId: string,
  wallet: PublicKey
) {
  const indexer = getIndexerPublicKey();
  if (!indexer) {
    throw new Error(
      "Memo indexer address not configured. Set NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS."
    );
  }
  const memo = buildMemoString(type, cid, postId);

  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [
      { pubkey: wallet, isSigner: true, isWritable: false },
      { pubkey: indexer, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(memo, "utf-8"),
  });
}

export async function buildMemoTransaction(
  type: PostType,
  cid: string,
  postId: string,
  wallet: PublicKey
) {
  const tx = new Transaction();
  tx.add(createMemoInstruction(type, cid, postId, wallet));
  return tx;
}

export async function sendPostMemo(
  type: PostType,
  cid: string,
  postId: string,
  wallet: PublicKey,
  connection: Connection,
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
    options?: { skipPreflight?: boolean }
  ) => Promise<string>
) {
  const tx = await buildMemoTransaction(type, cid, postId, wallet);
  return sendTransaction(tx, connection, { skipPreflight: false });
}


