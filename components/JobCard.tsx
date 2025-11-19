"use client";

import Link from "next/link";
import type { JobRecord } from "@/lib/storage";
import { MapPin, Building2, Clock } from "lucide-react";

interface JobCardProps {
  job: JobRecord;
}

export function JobCard({ job }: JobCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link href={`/job/${job.id}`}>
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors mb-2">
              {job.title}
            </h3>
            <div className="flex items-center text-gray-400 text-sm mb-2">
              <Building2 className="w-4 h-4 mr-1" />
              <span>{job.company}</span>
            </div>
            <div className="flex items-center text-gray-400 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{job.location}</span>
            </div>
            <div className="inline-flex items-center text-xs text-gray-400 uppercase tracking-wide">
              {job.commitment}
            </div>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {job.description}
        </p>

        {job.salary && (
          <div className="text-purple-400 font-semibold mb-4">
            {job.salary}
            {job.compensationType ? ` · ${job.compensationType}` : ""}
          </div>
        )}

        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-400 mb-4">
          Contact:{" "}
          <span className="text-gray-200">
            {job.contact.length > 32
              ? `${job.contact.slice(0, 29)}...`
              : job.contact}
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-500 text-xs">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatDate(job.postedAt)}</span>
          </div>
          <div className="text-purple-400 group-hover:text-pink-400 transition-colors text-right">
            View Details →
          </div>
        </div>
      </div>
    </Link>
  );
}

