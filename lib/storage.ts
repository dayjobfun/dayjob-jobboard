export type PostType = "JOB" | "TALENT";

export interface ChainMetadata {
  cid: string;
  signature: string;
  wallet: string;
  timestamp: number;
  slot?: number;
}

export interface RegistryEntry extends ChainMetadata {
  type: PostType;
  postId: string;
}

export interface JobPost {
  id: string;
  type: "JOB";
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  compensationType?: string;
  commitment: string;
  tags?: string[];
  contact: string;
  postedBy: string;
  postedAt: number;
}

export interface TalentProfile {
  id: string;
  type: "TALENT";
  name: string;
  headline: string;
  location: string;
  bio: string;
  experience: string;
  skills: string[];
  availability: string;
  contact: string;
  postedBy: string;
  postedAt: number;
}

export type JobRecord = JobPost & ChainMetadata;
export type TalentRecord = TalentProfile & ChainMetadata;

/**
 * Helpers
 */
export function generatePostId(prefix: PostType): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Upload arbitrary JSON to IPFS via our API route.
 * The API route proxies to Pinata (or any configured backend).
 */
export async function uploadJSONToIPFS(data: unknown): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("IPFS uploads must be initiated from the client.");
  }
  const response = await fetch("/api/ipfs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`IPFS upload failed: ${message}`);
  }

  const payload = await response.json();
  if (!payload.cid) {
    throw new Error("IPFS response missing CID");
  }

  return payload.cid as string;
}

/**
 * Fetch JSON from IPFS using multiple gateways for resilience.
 */
export async function fetchFromIPFS<T = unknown>(cid: string): Promise<T> {
  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
  ];

  for (const gateway of gateways) {
    try {
      const response = await fetch(gateway, { cache: "no-store" });
      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch {
      // try next gateway
    }
  }

  throw new Error(`Unable to fetch IPFS content for CID ${cid}`);
}


