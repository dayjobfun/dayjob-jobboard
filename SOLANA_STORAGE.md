# Solana Storage for DAYJOB.FUN

## The Simplest & Cheapest Approach

For storing small JSON data on Solana, here are your options from simplest to most complex:

## Option 1: Solana Account Data (Recommended) ⭐

**Cost:** ~0.00089 SOL per 10KB (~$0.0001 USD at current prices)

**How it works:**

- Each job stored in its own Solana account (PDA)
- Account data contains the JSON job data
- Requires a simple Solana program

**Implementation:**

1. Deploy a simple Anchor program (see example below)
2. Store job data in PDA accounts
3. Very cheap and fully on-chain

**Example Anchor Program:**

```rust
use anchor_lang::prelude::*;

declare_id!("YourProgramID");

#[program]
pub mod dayjob {
    use super::*;

    pub fn post_job(ctx: Context<PostJob>, job_data: String) -> Result<()> {
        let job = &mut ctx.accounts.job_account;
        job.data = job_data;
        job.posted_by = ctx.accounts.payer.key();
        job.timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn get_job(ctx: Context<GetJob>) -> Result<String> {
        Ok(ctx.accounts.job_account.data.clone())
    }
}

#[derive(Accounts)]
pub struct PostJob<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8 + 10000, // discriminator + pubkey + timestamp + data
        seeds = [b"job", job_id.as_bytes()],
        bump
    )]
    pub job_account: Account<'info, JobAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct JobAccount {
    pub data: String,
    pub posted_by: Pubkey,
    pub timestamp: i64,
}
```

## Option 2: Hybrid (IPFS + Solana Memo) ⭐ **Implemented**

**Cost:** ~0.000005 SOL per post (just the transaction fee)

**Live flow inside DAYJOB.FUN:**

1. User fills job/talent form → JSON body is sent to `/api/ipfs`
2. API route forwards to Pinata via `PINATA_JWT`, returns a CID
3. Client builds memo `DAYJOB:{JOB|TALENT}:<cid>:<postId>`
4. Memo instruction references `NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS`
5. Wallet signs + submits the transaction
6. Front-end calls `/api/registry` with `{ type, cid, postId, signature, wallet }`
7. The registry route fetches the transaction, verifies the memo + token gate, then stores a record in Vercel KV
8. Server components call `fetchJobsFromRegistry` / `fetchTalentFromRegistry`, hydrate the JSON from IPFS, and still surface the on-chain signature for audit

**Why this rocks**

- No servers, DBs, or indexers—just IPFS + Solana RPC
- User pays the network fee when posting, so ops cost is nearly zero
- Everyone can independently verify the CID + transaction signature

**Memo format**

```
DAYJOB:JOB:bafy...:JOB-1710794467123-4xkq
DAYJOB:TALENT:bafy...:TALENT-1710794467123-l8qm
```

**Indexer address**

Set `NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS` to any public key you control. Every memo references it so we can cheaply pull only DAYJOB transactions with `getSignaturesForAddress`.

## Option 3: Single Registry Account

**Cost:** ~0.00089 SOL initial + small fees for updates

**How it works:**

- One account stores all job IDs
- Each job stored in separate account or IPFS
- Cheaper than multiple accounts

## Option 4: Compressed NFTs (cNFTs)

**Cost:** ~0.001 SOL per job (very cheap with state compression)

**How it works:**

- Store job data as compressed NFT metadata
- Extremely cheap with Merkle tree compression
- Built-in indexing via Metaplex

## Quick Start - Hybrid (already wired up)

1. Sign up for [Pinata](https://pinata.cloud) → Settings → API Keys → create JWT  
   Paste the JWT into `.env.local` as `PINATA_JWT`.
2. Pick or generate an index wallet; copy its base58 address into `.env.local` as `NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS`.
3. Create a Vercel KV (Upstash) instance and drop the credentials into `.env.local` as `KV_REST_API_URL` + `KV_REST_API_TOKEN`.
4. Deploy. Nothing else is required—posting forms already:
   - Upload JSON to Pinata via `/api/ipfs`
   - Build + send memo instruction
   - Show the signature after success
5. Readers automatically display fresh data because `app/page.tsx` and `app/talent/page.tsx` read from the KV registry every request (`dynamic = "force-dynamic"`), while each entry still links back to the Solana transaction.

## Cost Comparison

| Method           | Cost per Job  | Decentralized | Complexity |
| ---------------- | ------------- | ------------- | ---------- |
| Account Data     | ~0.00089 SOL  | ✅ Full       | Medium     |
| IPFS + Memo      | ~0.000005 SOL | ✅ Hybrid     | Easy       |
| Registry Account | ~0.00089 SOL  | ✅ Full       | Medium     |
| cNFT             | ~0.001 SOL    | ✅ Full       | Medium     |

## Recommendation

- ✅ **Today:** Keep using IPFS + Memo (already running in the repo)
- 🔜 **Future:** Deploy a lightweight Anchor program when you need write-access control or richer querying (Option 1)

Once an Anchor program exists, you can still keep the memo strategy as a public audit trail.
