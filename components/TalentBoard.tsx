"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { TalentRecord } from "@/lib/storage";
import { TalentCard } from "./TalentCard";

interface TalentBoardProps {
  profiles: TalentRecord[];
}

export function TalentBoard({ profiles }: TalentBoardProps) {
  const [query, setQuery] = useState("");

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const haystack = [
        profile.name,
        profile.headline,
        profile.location,
        profile.bio,
        profile.skills.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [profiles, query]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search talent by skill, role, location..."
            className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {profiles.length === 0
            ? "No talent profiles yet. Share yours with the community!"
            : "No talent profiles match your search."}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProfiles.map((profile) => (
            <TalentCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}


