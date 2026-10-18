import { NextResponse } from "next/server";
import { addPerson } from "@/lib/pipeline";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { linkedin, instagram } = await req.json().catch(() => ({}));
  if (!/linkedin\.com\/(in|pub)\//i.test(linkedin || "")) return NextResponse.json({ error: "Paste a public LinkedIn profile link (linkedin.com/in/…)." }, { status: 400 });
  if (!/instagram\.com\/[A-Za-z0-9._]+/i.test(instagram || "")) return NextResponse.json({ error: "Paste a public Instagram profile link (instagram.com/…)." }, { status: 400 });
  try {
    const p = await addPerson(linkedin.trim(), instagram.trim());
    return NextResponse.json({ id: p.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not read this person." }, { status: 500 });
  }
}
