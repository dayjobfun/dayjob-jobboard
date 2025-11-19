"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

import { Header } from "@/components/Header";
import {
  TalentProfile,
  generatePostId,
  uploadJSONToIPFS,
} from "@/lib/storage";
import { sendPostMemo } from "@/lib/solanaMemoStorage";

const INDEX_ADDRESS = process.env.NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS || "";

async function registerTalent(payload: {
  type: "TALENT";
  cid: string;
  postId: string;
  signature: string;
  wallet: string;
}) {
  const response = await fetch("/api/registry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Failed to register talent profile: ${message || response.status}`
    );
  }
}

export default function PostTalentPage() {
  const router = useRouter();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    location: "Remote",
    bio: "",
    experience: "",
    skills: "",
    availability: "Immediately Available",
    contact: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey || !connection) {
      setError("Connect your wallet to publish your profile.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const profileId = generatePostId("TALENT");
      const skills = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const profile: TalentProfile = {
        id: profileId,
        type: "TALENT",
        name: formData.name,
        headline: formData.headline,
        location: formData.location,
        bio: formData.bio,
        experience: formData.experience,
        skills,
        availability: formData.availability,
        contact: formData.contact,
        postedBy: publicKey.toString(),
        postedAt: Date.now(),
      };

      const cid = await uploadJSONToIPFS(profile);
      const signature = await sendPostMemo(
        "TALENT",
        cid,
        profile.id,
        publicKey,
        connection,
        sendTransaction
      );

      await registerTalent({
        type: "TALENT",
        cid,
        postId: profile.id,
        signature,
        wallet: publicKey.toString(),
      });

      setTxSignature(signature);
      setSuccess(true);
      setTimeout(() => router.push("/talent"), 2500);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to post talent profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!INDEX_ADDRESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">
                Configure Index Address
              </h2>
              <p className="text-gray-300">
                Set <code>NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS</code> in your
                environment so talent posts can be written to Solana memos.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Publish Your Talent Profile
            </h1>
            <p className="text-gray-400">
              Showcase your skills to teams hiring on DAYJOB.FUN. Your profile
              is stored on IPFS with an immutable Solana memo.
            </p>
          </div>

          {success ? (
            <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Profile Published!
              </h2>
              <p className="text-gray-300 mb-2">
                Transaction Signature:
                <span className="block text-sm text-green-300 break-all mt-1">
                  {txSignature}
                </span>
              </p>
              <p className="text-gray-400">Redirecting to talent board...</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 space-y-6"
            >
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Full Name or Alias *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Solana Wizard"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.headline}
                    onChange={(e) =>
                      setFormData({ ...formData, headline: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Senior Rust + Anchor Engineer"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Remote, NYC, Singapore"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    Availability
                  </label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        availability: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Immediately, 2 weeks, Occasional freelance"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Bio / Summary *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Who are you, what have you built, what are you excited about?"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Experience Highlights *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="- Built X for Y\n- Previously at Z\n- Maintainer of ..."
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Skills (comma separated) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Rust, Anchor, React, Tokenomics"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Contact Info *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Email, Telegram, Lens, wallet, etc."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Publishing profile...
                  </>
                ) : (
                  "Publish My Talent Profile"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


