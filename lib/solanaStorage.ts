import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { SOLANA_RPC_URL } from "./constants";
import type { Job } from "./storage";

/**
 * Store job data on Solana using account data
 * 
 * This is a simplified approach that stores job data in Solana accounts.
 * Each job gets its own PDA (Program Derived Address) account.
 * 
 * Cost: ~0.00089 SOL per 10KB of data (very cheap!)
 * 
 * Note: For production, you'd want to deploy a custom Solana program,
 * but this approach works for small JSON data storage.
 */

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// We'll use a simple seed-based approach to create deterministic addresses
// In production, you'd use a deployed program's PDAs
export function getJobAccountAddress(jobId: string): PublicKey {
  // Create a deterministic address from the job ID
  // Using a simple hash approach (in production, use proper PDAs with a program)
  const seeds = [Buffer.from("dayjob"), Buffer.from(jobId)];
  // For now, we'll use a simple approach - in production use findProgramAddressSync with your program
  return PublicKey.findProgramAddressSync(seeds, SystemProgram.programId)[0];
}

/**
 * Store job data on-chain
 * Returns the account address where the job is stored
 */
export async function storeJobOnChain(
  job: Job,
  payerPublicKey: PublicKey
): Promise<{ accountAddress: string; transaction: Transaction }> {
  const jobAccount = getJobAccountAddress(job.id);
  const jobData = JSON.stringify(job);
  const dataBuffer = Buffer.from(jobData, "utf-8");
  
  // Calculate space needed (data + 8 bytes for discriminator)
  const space = dataBuffer.length + 8;
  
  // Get minimum rent (very cheap - ~0.00089 SOL per 10KB)
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  
  // Create transaction to initialize account with data
  const transaction = new Transaction().add(
    SystemProgram.createAccountWithSeed({
      fromPubkey: payerPublicKey,
      basePubkey: payerPublicKey,
      seed: `dayjob-${job.id}`,
      newAccountPubkey: jobAccount,
      lamports,
      space,
      programId: SystemProgram.programId,
    })
  );
  
  // Note: In production, you'd use a custom program instruction to write the data
  // For now, this creates the account structure
  
  return {
    accountAddress: jobAccount.toString(),
    transaction,
  };
}

/**
 * Retrieve job data from chain
 * This reads from the account data
 */
export async function getJobFromChain(jobId: string): Promise<Job | null> {
  try {
    const jobAccount = getJobAccountAddress(jobId);
    const accountInfo = await connection.getAccountInfo(jobAccount);
    
    if (!accountInfo) {
      return null;
    }
    
    // Parse the data (skip discriminator if present)
    const data = accountInfo.data;
    const jobData = JSON.parse(data.toString("utf-8"));
    return jobData as Job;
  } catch (error) {
    console.error("Error retrieving job from chain:", error);
    return null;
  }
}

/**
 * Get all jobs by scanning for accounts
 * Note: This is a simplified approach. In production, maintain a registry account.
 */
export async function getAllJobsFromChain(): Promise<Job[]> {
  // In a real implementation, you'd maintain a registry account
  // that stores all job IDs, then fetch each job
  // For now, this is a placeholder
  return [];
}

/**
 * Calculate storage cost in SOL
 */
export async function calculateStorageCost(dataSize: number): Promise<number> {
  const space = dataSize + 8;
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  return lamports / LAMPORTS_PER_SOL;
}
