// Reads the two public sources for a person: LinkedIn + Instagram. Nothing else.
// Order: Apify actors (if APIFY_TOKEN) -> public-page metadata -> handle-level fallback.

export function parseLinkedIn(url) {
  const m = String(url || "").match(/linkedin\.com\/(?:in|pub)\/([^\/?#]+)/i);
  return m ? decodeURIComponent(m[1]).replace(/\/$/, "") : null;
}
export function parseInstagram(url) {
  const m = String(url || "").match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const h = m?.[1];
  return h && !["p", "reel", "explore", "accounts"].includes(h.toLowerCase()) ? h : null;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

async function apify(actor, input) {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor.replace("/", "~")}/run-sync-get-dataset-items?token=${token}&timeout=90`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) },
    );
    if (!res.ok) return null;
    const items = await res.json();
    return Array.isArray(items) && items.length ? items[0] : null;
  } catch {
    return null;
  }
}

function metaTags(html) {
  const get = (p) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${p}["']`, "i"))?.[1];
  const un = (s) => (s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&#x27;/g, "'").replace(/&#064;/g, "@");
  return { title: un(get("og:title")), description: un(get("og:description") || get("description")) };
}

async function publicPage(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "en" }, redirect: "follow", signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const t = metaTags(await res.text());
    return t.title || t.description ? t : null;
  } catch {
    return null;
  }
}

export async function readInstagram(url) {
  const handle = parseInstagram(url);
  if (!handle) return { ok: false, error: "Not an Instagram profile URL" };
  const item = await apify("apify/instagram-profile-scraper", { usernames: [handle] });
  if (item) {
    const isPrivate = item.private ?? item.isPrivate;
    if (isPrivate === true) return { ok: false, error: "Instagram profile is private" };
    if (isPrivate === false) {
      const posts = (item.latestPosts || []).slice(0, 12).map((p) => ({
        caption: p.caption, hashtags: p.hashtags, location: p.locationName, likes: p.likesCount,
      }));
      return {
        ok: true, via: "apify:instagram-profile-scraper", handle, isPrivate,
        name: item.fullName, bio: item.biography, followers: item.followersCount, posts: item.postsCount,
        category: item.businessCategoryName, link: item.externalUrl, latest: posts,
      };
    }
  }
  const meta = await publicPage(`https://www.instagram.com/${handle}/`);
  if (meta) return { ok: true, via: "public-meta", handle, name: meta.title, bio: meta.description, isPrivate: false };
  return { ok: true, via: "handle-only", handle, isPrivate: null };
}

export async function readLinkedIn(url) {
  const slug = parseLinkedIn(url);
  if (!slug) return { ok: false, error: "Not a LinkedIn /in/ profile URL" };
  const actor = process.env.LINKEDIN_ACTOR || "harvestapi/linkedin-profile-scraper";
  const item = await apify(actor, { queries: [url], urls: [url], publicIdentifiers: [slug], profileScraperMode: "Profile details no email ($4 per 1k)" });
  if (item) {
    return {
      ok: true, via: `apify:${actor}`, slug,
      name: [item.firstName, item.lastName].filter(Boolean).join(" ") || item.fullName,
      headline: item.headline, about: item.about || item.summary, location: item.location?.linkedinText || item.location,
      experience: (item.experience || item.positions || []).slice(0, 6).map((e) => ({ title: e.position || e.title, company: e.companyName || e.company, description: e.description })),
      education: (item.education || []).slice(0, 3).map((e) => ({ school: e.schoolName || e.school, field: e.fieldOfStudy || e.degree })),
      skills: (item.skills || []).slice(0, 15).map((s) => s.name || s),
      interests: item.interests, volunteer: item.volunteering,
    };
  }
  const meta = await publicPage(`https://www.linkedin.com/in/${slug}`);
  if (meta) return { ok: true, via: "public-meta", slug, name: meta.title, headline: meta.description };
  return { ok: true, via: "handle-only", slug };
}
