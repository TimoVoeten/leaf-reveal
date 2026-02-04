import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { supabaseAdmin } from "../../lib/supabase";

function getIp(req: NextApiRequest) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0].trim();
  if (Array.isArray(xf)) return xf[0];
  return req.socket.remoteAddress || "0.0.0.0";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const ip = getIp(req);
  const ipHash = crypto
    .createHash("sha256")
    .update(ip + (process.env.IP_SALT || "salt"))
    .digest("hex");

  // al geclaimd?
  const { data: existing } = await supabaseAdmin
    .from("claims")
    .select("leaf_id")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (existing) return res.status(200).json({ ok: false, alreadyClaimed: true });

  // pak 1 beschikbaar blad
  const { data: leaf } = await supabaseAdmin
    .from("leaves")
    .select("id")
    .eq("removed", false)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!leaf) return res.status(200).json({ ok: false, done: true });

  await supabaseAdmin
    .from("leaves")
    .update({ removed: true, removed_at: new Date().toISOString() })
    .eq("id", leaf.id);

  await supabaseAdmin
    .from("claims")
    .insert({ ip_hash: ipHash, leaf_id: leaf.id });

  const { count } = await supabaseAdmin
    .from("leaves")
    .select("*", { count: "exact", head: true })
    .eq("removed", false);

  return res.status(200).json({ ok: true, leafId: leaf.id, remaining: count ?? null });
}
