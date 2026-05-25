/**
 * Fetches markdown files from the canonical destaque.ai skill repo
 * (geo-seo-aeo-master) via GitHub raw URLs.
 *
 * Cross-repo contract: see INTERFACES.md no skill repo.
 * Cache TTL: 1h. Fallback: caller provides hardcoded string.
 */

const SKILL_BASE =
  "https://raw.githubusercontent.com/dudumendonca84/geo-seo-aeo-master/main/skills/geo-seo-aeo-master";

const TTL_MS = 60 * 60 * 1000;

type CacheEntry = { value: string; fetchedAt: number };
const memo = new Map<string, CacheEntry>();

export type SkillFetchResult = {
  body: string;
  source: "skill" | "fallback";
};

/**
 * Fetch a markdown file from the skill repo. Returns the fallback string
 * if the HTTP call fails, the response is empty, or any error is thrown.
 * The choice of fallback is the caller's — it should be a hardcoded
 * baseline aligned with the most recent known version of the file.
 */
export async function loadSkillFile(opts: {
  path: string;
  fallback: string;
}): Promise<SkillFetchResult> {
  const { path, fallback } = opts;
  const now = Date.now();
  const cached = memo.get(path);
  if (cached && now - cached.fetchedAt < TTL_MS) {
    return { body: cached.value, source: "skill" };
  }

  const url = `${SKILL_BASE}/${path}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return { body: fallback, source: "fallback" };
    }
    const body = (await res.text()).trim();
    if (!body) {
      return { body: fallback, source: "fallback" };
    }
    memo.set(path, { value: body, fetchedAt: now });
    return { body, source: "skill" };
  } catch {
    return { body: fallback, source: "fallback" };
  }
}

/**
 * Slice a markdown document between two H2 anchors. `startHeading` is
 * inclusive, `endHeading` is exclusive. If either anchor is missing,
 * returns the full document so the caller doesn't get an empty system
 * prompt.
 */
export function sliceMarkdown(body: string, startHeading: string, endHeading?: string): string {
  const startIdx = body.indexOf(startHeading);
  if (startIdx < 0) return body;
  const tail = body.slice(startIdx);
  if (!endHeading) return tail;
  const endIdx = tail.indexOf(endHeading);
  return endIdx < 0 ? tail : tail.slice(0, endIdx).trim();
}
