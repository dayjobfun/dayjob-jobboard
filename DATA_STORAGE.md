# Data Storage Options for DAYJOB.FUN

## Current Implementation

DAYJOB.FUN now ships with decentralized persistence out of the box:

1. JSON payload (job or talent) → `/api/ipfs`
2. `/api/ipfs` pins to Pinata using `PINATA_JWT` (fast + cheap)
3. CID is written to a Solana memo alongside the post ID
4. Readers scan memos for the configured index address and fetch the JSON from IPFS

No centralized database, no cron indexer, and no server-side storage. Everything lives on IPFS with an on-chain pointer.

## Decentralized Storage Options

### 1. **IPFS (InterPlanetary File System)** ⭐ (Already used)

- Pin via Pinata (`PINATA_JWT`) or Web3.Storage
- Fetch through multiple public gateways for redundancy
- Store only JSON; assets can also live on IPFS/S3/etc.

### 2. **Arweave**

**Pros:**

- Permanent storage (pay once, store forever)
- Truly decentralized
- No need for pinning services

**Cons:**

- Costs AR tokens upfront
- Less familiar to most developers

**Implementation:**

- Use Arweave.js SDK
- Store data permanently on Arweave network
- Retrieve via transaction IDs

### 3. **On-Chain Storage (Solana)**

**Pros:**

- Fully decentralized and on-chain
- No external dependencies

**Cons:**

- Expensive (storage costs on Solana)
- Limited data size per transaction
- Complex to implement

**Implementation:**

- Create a Solana program (smart contract)
- Store job data in program accounts
- More complex but fully on-chain

### 4. **Hybrid** ⭐ (IPFS + Solana Memo) – **Current setup**

- JSON stored on IPFS
- CID recorded on Solana with the Memo program
- Index address lets us query only DAYJOB transactions
- View layer stays completely serverless

## Migration Paths

- 👉 **Already live:** IPFS + Memo
- 🔜 **If you need stricter guarantees:** move to Solana PDA storage (Anchor program)
- 🔧 **If you want permanence:** mirror CIDs on Arweave or Filecoin, or pin through multiple services

## Quick Start Recap

1. [Pinata](https://pinata.cloud) → create JSON JWT → `.env.local` `PINATA_JWT=...`
2. Pick an index public key → `.env.local` `NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS=...`
3. Provision Vercel KV (Upstash) → `.env.local` `KV_REST_API_URL` + `KV_REST_API_TOKEN`
4. (Optional) Customize `NEXT_PUBLIC_SOLANA_RPC_URL`
5. Start posting. `/api/registry` will verify each memo signature, re-check the token gate, and only then persist the CID reference.

## Recommendation

For DAYJOB.FUN, IPFS + Memo already provides a decentralized, uncensorable, and dirt-cheap storage layer. Use the other options only when you need permanent retention (Arweave) or richer on-chain logic (custom Solana programs).
