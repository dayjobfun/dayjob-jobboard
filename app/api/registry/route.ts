import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

import { SOLANA_RPC_URL } from "@/lib/constants";
import { checkTokenBalance } from "@/lib/tokenGating";
import { saveRegistryEntry } from "@/lib/registry";
import { parseMemoString } from "@/lib/solanaMemoStorage";
import type { PostType } from "@/lib/storage";

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

function toPostType(value: string | null): PostType | null {
  if (value === "JOB" || value === "TALENT") return value;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = toPostType(searchParams.get("type"));
  if (!type) {
    return NextResponse.json(
      { error: "Missing or invalid `type` query param" },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "Use server helpers for registry data." });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = toPostType(body?.type);
    const cid = body?.cid as string | undefined;
    const postId = body?.postId as string | undefined;
    const signature = body?.signature as string | undefined;
    const wallet = body?.wallet as string | undefined;

    if (!type || !cid || !postId || !signature || !wallet) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const parsedTx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!parsedTx) {
      return NextResponse.json(
        { error: "Unable to find transaction signature on-chain" },
        { status: 422 }
      );
    }

    const memoInstruction = parsedTx.transaction.message.instructions.find(
      (ix: any) => "program" in ix && ix.program === "spl-memo"
    );

    if (!memoInstruction || !("parsed" in memoInstruction)) {
      return NextResponse.json(
        { error: "Transaction missing memo instruction" },
        { status: 422 }
      );
    }

    const memo =
      typeof memoInstruction.parsed === "string"
        ? memoInstruction.parsed
        : memoInstruction.parsed?.memo ?? "";

    const parsedMemo = parseMemoString(memo);

    if (
      !parsedMemo ||
      parsedMemo.type !== type ||
      parsedMemo.cid !== cid ||
      parsedMemo.postId !== postId
    ) {
      return NextResponse.json(
        { error: "Memo content does not match payload" },
        { status: 422 }
      );
    }

    const posterKey = (() => {
      const account = parsedTx.transaction.message.accountKeys[0];
      if (!account) return null;
      if (typeof account === "string") return account;
      return account.pubkey ?? null;
    })();

    if (!posterKey || posterKey !== wallet) {
      return NextResponse.json(
        { error: "Wallet mismatch" },
        { status: 422 }
      );
    }

    if (type === "JOB") {
      const gatingResult = await checkTokenBalance(wallet);
      if (!gatingResult.hasAccess) {
        return NextResponse.json(
          { error: "Wallet does not meet token requirements" },
          { status: 403 }
        );
      }
    }

    const entry = {
      type,
      cid,
      postId,
      signature,
      wallet,
      timestamp: Date.now(),
      slot: parsedTx.slot,
    };

    await saveRegistryEntry(entry);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registry API error", error);
    return NextResponse.json(
      { error: "Failed to write registry entry" },
      { status: 500 }
    );
  }
}


