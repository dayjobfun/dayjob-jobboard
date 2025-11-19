import { Header } from "@/components/Header";
import { TalentBoard } from "@/components/TalentBoard";
import { fetchTalentFromRegistry } from "@/lib/registry";

export const dynamic = "force-dynamic";

export default async function TalentPage() {
  const profiles = await fetchTalentFromRegistry(60);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Meet the Builders, Creators & Operators
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Every profile lives on IPFS with a Solana memo, making DAYJOB.FUN an
            unstoppable talent network. Filter by skills to find your next hire.
          </p>
        </div>
        <TalentBoard profiles={profiles} />
      </div>
    </main>
  );
}


