"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";

import { Header } from "@/components/Header";
import { checkTokenBalance } from "@/lib/tokenGating";
import {
  JobPost,
  generatePostId,
  uploadJSONToIPFS,
} from "@/lib/storage";
import { sendPostMemo } from "@/lib/solanaMemoStorage";

const INDEX_ADDRESS = process.env.NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS || "";

async function registerOnRegistry(payload: {
  type: "JOB";
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
      `Failed to register job on DAYJOB registry: ${message || response.status}`
    );
  }
}

export default function PostJobPage() {
  const router = useRouter();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    salary: "",
    commitment: "Full-time",
    compensationType: "USD",
    tags: "",
    contact: "",
  });

  useEffect(() => {
    if (!connected || !publicKey) {
      router.push("/");
      return;
    }

    async function verifyAccess() {
      setCheckingAccess(true);
      try {
        const result = await checkTokenBalance(publicKey.toString());
        setHasAccess(result.hasAccess);
        setTokenBalance(result.balance);
      } catch (err) {
        console.error("Error checking access:", err);
        setError("Failed to verify token balance");
      } finally {
        setCheckingAccess(false);
      }
    }

    verifyAccess();
  }, [connected, publicKey, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !connection) return;

    setLoading(true);
    setError("");

    try {
      const jobId = generatePostId("JOB");
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const jobPayload: JobPost = {
        id: jobId,
        type: "JOB",
        title: formData.title,
        company: formData.company,
        location: formData.location,
        description: formData.description,
        salary: formData.salary || undefined,
        compensationType: formData.compensationType,
        commitment: formData.commitment,
        tags: tags.length ? tags : undefined,
        contact: formData.contact,
        postedBy: publicKey.toString(),
        postedAt: Date.now(),
      };

      const cid = await uploadJSONToIPFS(jobPayload);
      const signature = await sendPostMemo(
        "JOB",
        cid,
        jobPayload.id,
        publicKey,
        connection,
        sendTransaction
      );

      await registerOnRegistry({
        type: "JOB",
        cid,
        postId: jobPayload.id,
        signature,
        wallet: publicKey.toString(),
      });

      setTxSignature(signature);
      setSuccess(true);

      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to post job. Please try again."
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
                Set <code>NEXT_PUBLIC_DAYJOB_INDEX_ADDRESS</code> in
                <code>.env.local</code> so we know which account to reference in
                memo instructions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Verifying token balance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">
                Access Denied
              </h2>
              <p className="text-gray-300 mb-2">
                You need to own at least 10,000,000 tokens to post jobs.
              </p>
              <p className="text-gray-400 text-sm">
                Your current balance: {tokenBalance.toLocaleString()} tokens
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
              Post a Job to DAYJOB.FUN
            </h1>
            <p className="text-gray-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" />
              Posting stores your job on IPFS and records the CID on Solana.
              You&apos;ll sign and pay the network fee.
            </p>
          </div>

          {success ? (
            <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Job Posted Successfully!
              </h2>
              <p className="text-gray-300 mb-2">
                Transaction Signature:
                <span className="block text-sm text-green-300 break-all mt-1">
                  {txSignature}
                </span>
              </p>
              <p className="text-gray-400">Redirecting to job board...</p>
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

              <div>
                <label className="block text-white font-medium mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Senior Solana Developer"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Remote, Lisbon, NYC"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Commitment *
                  </label>
                  <select
                    value={formData.commitment}
                    onChange={(e) =>
                      setFormData({ ...formData, commitment: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Freelance</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    Compensation Type
                  </label>
                  <select
                    value={formData.compensationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compensationType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="USD">USD</option>
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="TOKEN">Project Token</option>
                    <option value="EQUITY">Equity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Salary / Compensation
                </label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., $120k - $160k, 5 SOL / week"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={8}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Describe the role, responsibilities, requirements, and what makes it special..."
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Solana, Rust, Remote, Senior"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Contact / Apply Link *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Email, form link, or wallet"
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
                    Broadcasting transaction...
                  </>
                ) : (
                  "Post Job On-Chain"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


