import { kv } from "@vercel/kv";
import {
  fetchFromIPFS,
  JobPost,
  JobRecord,
  PostType,
  RegistryEntry,
  TalentProfile,
  TalentRecord,
} from "./storage";

const COLLECTION_KEYS: Record<PostType, string> = {
  JOB: "dayjob:jobs",
  TALENT: "dayjob:talent",
};

function getCollectionKey(type: PostType) {
  return COLLECTION_KEYS[type];
}

export async function saveRegistryEntry(entry: RegistryEntry) {
  const key = getCollectionKey(entry.type);
  const serialized = JSON.stringify(entry);
  await Promise.all([
    kv.set(`${key}:${entry.postId}`, serialized),
    kv.zadd(key, {
      score: entry.timestamp,
      member: serialized,
    }),
  ]);
}

async function listRegistryEntries(type: PostType, limit = 60) {
  const key = getCollectionKey(type);
  const raw =
    (await kv.zrevrange<string>(key, 0, Math.max(limit - 1, 0))) ?? [];
  return raw.map((item) =>
    typeof item === "string" ? (JSON.parse(item) as RegistryEntry) : item
  );
}

async function getRegistryEntry(type: PostType, postId: string) {
  const key = getCollectionKey(type);
  const raw = await kv.get<string>(`${key}:${postId}`);
  if (!raw) return null;
  return JSON.parse(raw) as RegistryEntry;
}

export async function fetchJobsFromRegistry(limit = 60): Promise<JobRecord[]> {
  const entries = await listRegistryEntries("JOB", limit);
  const jobs = await Promise.all(
    entries.map(async (entry) => {
      try {
        const data = await fetchFromIPFS<JobPost>(entry.cid);
        return { ...data, ...entry } satisfies JobRecord;
      } catch (error) {
        console.error("Failed to hydrate job from IPFS", entry.cid, error);
        return null;
      }
    })
  );

  return jobs.filter(Boolean) as JobRecord[];
}

export async function fetchTalentFromRegistry(
  limit = 60
): Promise<TalentRecord[]> {
  const entries = await listRegistryEntries("TALENT", limit);
  const profiles = await Promise.all(
    entries.map(async (entry) => {
      try {
        const data = await fetchFromIPFS<TalentProfile>(entry.cid);
        return { ...data, ...entry } satisfies TalentRecord;
      } catch (error) {
        console.error(
          "Failed to hydrate talent profile from IPFS",
          entry.cid,
          error
        );
        return null;
      }
    })
  );

  return profiles.filter(Boolean) as TalentRecord[];
}

export async function fetchJobRecordById(jobId: string) {
  const entry = await getRegistryEntry("JOB", jobId);
  if (!entry) return null;

  try {
    const data = await fetchFromIPFS<JobPost>(entry.cid);
    return { ...data, ...entry } satisfies JobRecord;
  } catch (error) {
    console.error("Failed to fetch job detail from IPFS", entry.cid, error);
    return null;
  }
}

export async function fetchTalentRecordById(talentId: string) {
  const entry = await getRegistryEntry("TALENT", talentId);
  if (!entry) return null;

  try {
    const data = await fetchFromIPFS<TalentProfile>(entry.cid);
    return { ...data, ...entry } satisfies TalentRecord;
  } catch (error) {
    console.error("Failed to fetch talent detail from IPFS", entry.cid, error);
    return null;
  }
}


