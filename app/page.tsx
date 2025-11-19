import { JobBoard } from "@/components/JobBoard";
import { Header } from "@/components/Header";
import { fetchJobsFromRegistry } from "@/lib/registry";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await fetchJobsFromRegistry(60);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              DAYJOB.FUN
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Decentralized, uncensorable job board powered by IPFS + Solana memo
            proofs. Browse jobs freely—postings live on-chain forever.
          </p>
        </div>
        <JobBoard jobs={jobs} />
      </div>
    </main>
  );
}

