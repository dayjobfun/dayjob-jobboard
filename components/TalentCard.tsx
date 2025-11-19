"use client";

import { BadgeCheck, MapPin, Sparkles, Link2 } from "lucide-react";
import type { TalentRecord } from "@/lib/storage";

interface TalentCardProps {
  profile: TalentRecord;
}

export function TalentCard({ profile }: TalentCardProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">
            {profile.name}
          </h3>
          <p className="text-sm text-purple-300 flex items-center gap-1">
            <BadgeCheck className="w-4 h-4" />
            {profile.headline}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-gray-400">
            Availability
          </div>
          <div className="text-sm text-white">{profile.availability}</div>
        </div>
      </div>

      <div className="flex items-center text-gray-400 text-sm mb-4">
        <MapPin className="w-4 h-4 mr-1" />
        {profile.location}
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
        {profile.bio}
      </p>

      <div className="text-gray-400 text-sm mb-4 whitespace-pre-wrap">
        {profile.experience}
      </div>

      {profile.skills?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.skills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 bg-pink-500/15 text-pink-200 rounded-full text-xs flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-500">
          Posted by{" "}
          <span className="text-gray-300">
            {profile.wallet.slice(0, 4)}...{profile.wallet.slice(-4)}
          </span>
        </div>
        <a
          href={
            profile.contact.startsWith("http")
              ? profile.contact
              : `mailto:${profile.contact}`
          }
          target={profile.contact.startsWith("http") ? "_blank" : undefined}
          className="inline-flex items-center gap-2 text-pink-300 hover:text-pink-100 transition"
        >
          <Link2 className="w-4 h-4" />
          Contact
        </a>
      </div>
    </div>
  );
}


