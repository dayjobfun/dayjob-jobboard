# DAYJOB.FUN - Decentralized Job + Talent Board

The first job for DAYJOB.FUN is to FORK THE GITHUB and GET IT WORKING. BOUNTY: **\_\_\_\_** SOL

DAYJOB.FUN is an uncensorable Solana-native marketplace for both companies and talent. Jobs and talent profiles are stored on IPFS and referenced on-chain via the Memo program, so anything posted is permanently discoverable.

## Features

- 🔐 **Wallet Adapter** – Phantom, Solflare, Backpack, etc.
- 🎫 **Token-Gated Job Posting** – must hold 10,000,000 of your SPL token
- 🧠 **Talent Network** – dedicated `Talent` page plus profile publisher
- 🌐 **IPFS + Solana Memo** – cheapest fully decentralized persistence
- 🔎 **Full-Text Search** – for both jobs and talent
- 🧭 **Indexer-Free** – app scans Solana memos directly, no DB required
- 💅 **Polished UI** – gradients, glassmorphism, responsive layouts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

Create an `.env.local` with:

```bash
# IPFS Storage (Pinata)
PINATA_JWT=eyJhbGciOi...  # Get from https://pinata.cloud → API Keys → Create JWT

# Solana Configuration
NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS=<your-public-key>  # Any Solana address you control
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com  # Optional, defaults to mainnet

# Registry Storage (Vercel KV / Upstash)
KV_REST_API_URL=https://<your-upstash-instance>.upstash.io
KV_REST_API_TOKEN=<your-upstash-token>

# Token Gating (lib/constants.ts)
TOKEN_ADDRESS=YOUR_SPL_TOKEN_ADDRESS  # SPL token required for job posting
REQUIRED_TOKEN_AMOUNT=10000000  # Default: 10 million tokens
```

**Setup Steps:**

1. **Pinata (IPFS)**

   - Sign up at https://pinata.cloud
   - Go to Settings → API Keys → Create JWT
   - Copy the JWT token to `PINATA_JWT`

2. **Index Address**

   - Generate any Solana wallet (can be a throwaway)
   - Copy the public key to `NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS`
   - This address is referenced in all memo transactions for filtering

3. **Vercel KV (Registry)**

   - In Vercel dashboard, go to Storage → Create Database → KV
   - Copy the `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your `.env.local`
   - Or use Upstash directly: https://console.upstash.com

4. **Token Address**
   - Update `TOKEN_ADDRESS` in `lib/constants.ts` with your SPL token mint address
   - Adjust `REQUIRED_TOKEN_AMOUNT` if needed

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

### Token Gating

`lib/constants.ts` controls the gating logic:

- `TOKEN_ADDRESS` – SPL token required to post a job
- `REQUIRED_TOKEN_AMOUNT` – defaults to 10,000,000

`checkTokenBalance()` verifies the wallet before showing the form.

### Persistence Model: IPFS + Solana Memo + Registry

DAYJOB.FUN uses a **hybrid approach** that combines decentralized storage (IPFS) with on-chain proof (Solana memos) and a curated registry for access control.

#### Complete Flow

**1. Posting a Job or Talent Profile**

When a user posts:

1. **IPFS Upload** (`/api/ipfs`)

   - Client sends job/talent JSON to `/api/ipfs`
   - API route forwards to Pinata using `PINATA_JWT`
   - Returns IPFS CID (Content Identifier)

2. **Solana Memo Transaction**

   - Client creates a memo instruction with format: `DAYJOB:JOB:<cid>:<postId>` or `DAYJOB:TALENT:<cid>:<postId>`
   - Memo instruction includes the index address (`NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS`) in the keys array
   - User signs and sends the transaction (pays ~0.000005 SOL in fees)
   - Transaction signature is returned

3. **Registry Verification** (`/api/registry`)
   - Client calls `/api/registry` with: `{ type, cid, postId, signature, wallet }`
   - Server verifies:
     - Transaction exists on-chain
     - Memo content matches payload
     - Wallet address matches transaction signer
     - For jobs: Token balance meets requirement (10M tokens)
   - If valid, stores entry in Vercel KV with: `{ type, cid, postId, signature, wallet, timestamp, slot }`

**2. Reading Jobs/Talent**

When users browse:

1. **Registry Query**

   - Server components call `fetchJobsFromRegistry()` or `fetchTalentFromRegistry()`
   - These functions read from Vercel KV (sorted by timestamp, newest first)

2. **IPFS Hydration**

   - For each registry entry, fetch the full JSON from IPFS using the CID
   - Multiple gateways are tried for reliability: `ipfs.io`, `gateway.pinata.cloud`, `cloudflare-ipfs.com`

3. **Display**
   - UI shows job/talent data from IPFS
   - Links to Solana transaction via signature for verification
   - All data is verifiable: anyone can check the memo on-chain and fetch the IPFS content

#### Why Use a Registry?

The registry provides **access control** while maintaining decentralization:

- ✅ **Token Gating**: Only users with sufficient tokens can post jobs (verified server-side)
- ✅ **Fast Reads**: No need to scan blockchain on every page load
- ✅ **Curated List**: Invalid or spam posts are filtered out
- ✅ **Audit Trail**: Every entry links to an on-chain memo transaction
- ✅ **Decentralized Data**: All actual content lives on IPFS, not in the registry

The registry only stores **references** (CIDs + signatures), not the actual job/talent data. The data itself is on IPFS, and the proof is on Solana.

#### Memo Transaction Structure

Each memo transaction:

- **Program**: Solana Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`)
- **Keys**:
  - User's wallet (signer)
  - Index address (for filtering)
- **Data**: `DAYJOB:JOB:<cid>:<postId>` or `DAYJOB:TALENT:<cid>:<postId>`

The index address allows us to efficiently query all DAYJOB transactions using `getSignaturesForAddress(indexAddress)`.

#### Cost Breakdown

- **IPFS Storage**: Free (via Pinata free tier)
- **Solana Transaction**: ~0.000005 SOL (~$0.00001 USD)
- **Registry Storage**: Vercel KV free tier (or paid if needed)

Total cost per post: **~$0.00001 USD** (just Solana fees)

For additional options (Arweave, account storage, cNFTs) read `SOLANA_STORAGE.md` and `DATA_STORAGE.md`.

## Project Structure

```
├── app/
│   ├── page.tsx            # Jobs page (server component)
│   ├── talent/page.tsx     # Talent directory
│   ├── post/job/page.tsx   # Token-gated job posting
│   ├── post/talent/page.tsx# Talent profile publisher
│   ├── job/[id]/page.tsx   # Job detail from IPFS+Solana
│   ├── api/ipfs/route.ts   # Pinata proxy
│   └── api/registry/route.ts# Memo verification + KV registry
├── components/
│   ├── JobBoard.tsx / JobCard.tsx
│   ├── TalentBoard.tsx / TalentCard.tsx
│   └── WalletProvider.tsx, Header.tsx
├── lib/
│   ├── storage.ts          # Shared types + IPFS upload/fetch helpers
│   ├── registry.ts         # Vercel KV registry (read/write curated entries)
│   ├── solanaMemoStorage.ts# Memo transaction creation + parsing
│   ├── memoScanner.ts      # Direct memo scanning (alternative to registry)
│   ├── tokenGating.ts      # SPL token balance verification
│   └── constants.ts        # Configuration (token address, RPC URL, etc.)
└── public/                # Static assets
```

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Solana Web3.js** - Blockchain interaction
- **@solana/wallet-adapter** - Wallet integration
- **Lucide React** - Icons

## Architecture Details

### Access Control Flow

1. **Client-Side Check**: Before showing the posting form, `checkTokenBalance()` verifies the wallet has enough tokens
2. **Server-Side Verification**: When registering a post, `/api/registry` re-checks the token balance to prevent bypassing
3. **Registry Storage**: Only verified posts are stored in the registry
4. **Public Reading**: Anyone can read from the registry (no authentication needed)

### Data Flow Diagram

```
User Posts Job
    ↓
1. Upload JSON to IPFS → Get CID
    ↓
2. Create Memo Transaction → Sign & Send → Get Signature
    ↓
3. Call /api/registry with {type, cid, postId, signature, wallet}
    ↓
4. Server verifies:
   - Transaction exists on-chain
   - Memo matches payload
   - Token balance (for jobs)
    ↓
5. Store in Vercel KV registry
    ↓
6. Success! Job appears on job board

User Browses Jobs
    ↓
1. Server calls fetchJobsFromRegistry()
    ↓
2. Read entries from Vercel KV (sorted by timestamp)
    ↓
3. For each entry, fetch JSON from IPFS using CID
    ↓
4. Display jobs with links to Solana transaction
```

### Alternative: Direct Memo Scanning

If you want to bypass the registry and read directly from chain, use `lib/memoScanner.ts`:

```typescript
import { scanJobMemos } from "@/lib/memoScanner";

// Read jobs directly from Solana memos
const jobs = await scanJobMemos(50);
```

**Trade-offs:**

- ✅ Fully decentralized (no registry dependency)
- ❌ Slower (RPC calls + IPFS fetches on every page load)
- ❌ No built-in access control (anyone can post memos)

The registry approach is recommended for production as it provides access control and faster reads.

## Future Enhancements

- [ ] Dedicated Solana program to replace memos with PDA storage
- [ ] Real-time websocket updates when new memos land
- [ ] Reputation / verification layer for talent
- [ ] Application module with encrypted contact swaps
- [ ] Advanced filtering, bookmarking, RSS feeds
- [ ] Optional direct memo scanning mode (bypass registry)

## License

MIT
