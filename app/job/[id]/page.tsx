import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Building2,
  Clock,
  Wallet,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

import { Header } from "@/components/Header";
import { fetchJobRecordById } from "@/lib/registry";

interface JobDetailPageProps {
  params: { id: string };
}

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const job = await fetchJobRecordById(params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-300">
                  <span className="inline-flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-purple-400" />
                    {job.company}
                  </span>
                  <span className="inline-flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-purple-400" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-400" />
                    {formatDate(job.postedAt)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-purple-300 text-sm">CID</div>
                <Link
                  href={`https://ipfs.io/ipfs/${job.cid}`}
                  target="_blank"
                  className="text-sm text-purple-400 hover:text-pink-400 inline-flex items-center gap-1"
                >
                  {job.cid.slice(0, 8)}...{job.cid.slice(-6)}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {job.salary && (
              <div className="mt-6 mb-4">
                <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  {job.salary}
                  {job.compensationType ? ` · ${job.compensationType}` : ""}
                </span>
              </div>
            )}

            {job.tags && job.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 text-sm text-gray-300">
              Commitment: <span className="text-white">{job.commitment}</span>
            </div>

            <div className="border-t border-gray-700 pt-6 mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center">
                <Wallet className="w-4 h-4 mr-2" />
                Posted by {shortAddress(job.postedBy)}
              </div>
              <div className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                <span className="mr-1">Apply / Contact:</span>
                <a
                  href={
                    job.contact.startsWith("http")
                      ? job.contact
                      : `mailto:${job.contact}`
                  }
                  target={job.contact.startsWith("http") ? "_blank" : undefined}
                  className="text-purple-400 hover:text-pink-400"
                >
                  {job.contact}
                </a>
              </div>
              {job.signature && (
                <div className="flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <a
                    href={`https://solscan.io/tx/${job.signature}`}
                    target="_blank"
                    className="text-purple-400 hover:text-pink-400"
                    rel="noreferrer"
                  >
                    View transaction
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Job Description
            </h2>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


