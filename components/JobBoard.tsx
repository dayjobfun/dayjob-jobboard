"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { JobCard } from "./JobCard";
import type { JobRecord } from "@/lib/storage";

interface JobBoardProps {
  jobs: JobRecord[];
}

export function JobBoard({ jobs }: JobBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const haystack = [
          job.title,
          job.company,
          job.location,
          job.description,
          job.tags?.join(" ") ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchTerm.toLowerCase());
      }),
    [jobs, searchTerm]
  );

  return (
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search jobs by title, company, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg mb-4">
            {jobs.length === 0
              ? "No jobs posted yet. Be the first to post a job!"
              : "No jobs match your search."}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

