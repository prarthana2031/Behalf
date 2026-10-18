import { NextResponse } from "next/server";
import { dateAndRank } from "@/lib/pipeline";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST() {
  try { return NextResponse.json(await dateAndRank()); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function GET() {
  return NextResponse.json({
    "behalf-profile-reader": ["read_linkedin", "read_instagram", "read_person"],
    "behalf-dating": ["plan_dates", "date_agents", "rank_pool"],
  });
}
