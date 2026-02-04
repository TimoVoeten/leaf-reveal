import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data: removedRows } = await supabaseAdmin
    .from("leaves")
    .select("id")
    .eq("removed", true);

  const { count: remaining } = await supabaseAdmin
    .from("leaves")
    .select("*", { count: "exact", head: true })
    .eq("removed", false);

  res.status(200).json({
    removed: removedRows?.map((d) => d.id) || [],
    remaining: remaining ?? null
  });
}
