import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data } = await supabaseAdmin
    .from("leaves")
    .select("id")
    .eq("removed", true);

  res.status(200).json({
    removed: data?.map((d) => d.id) || [],
  });
}
