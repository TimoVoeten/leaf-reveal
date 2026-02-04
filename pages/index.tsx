import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const TOTAL_LEAVES = 20;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function Home() {
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [remaining, setRemaining] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const leafStyles = useMemo(() => {
    const leafPngs = ["/leaves/leaf1.png", "/leaves/leaf2.png", "/leaves/leaf3.png"];
    return Array.from({ length: TOTAL_LEAVES }, (_, i) => ({
      id: i + 1,
      left: `${rand(0, 95)}%`,
      top: `${rand(0, 95)}%`,
      rotate: `${rand(-40, 40)}deg`,
      scale: rand(0.6, 1.2),
      leaf: leafPngs[i % leafPngs.length],
    }));
  }, []);
    useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((d) => {
        if (d.removed) setRemoved(new Set(d.removed));
      });
  }, []);


  async function claim() {
    setMsg("");
    const r = await fetch("/api/claim", { method: "POST" });
    const data = await r.json();

    if (data.alreadyClaimed) return setMsg("Je hebt al een blad geclaimd (vanaf dit IP/netwerk).");
    if (data.done) return setMsg("Alles is onthuld!");

    if (data.ok && data.leafId) {
      setRemoved((prev) => new Set(prev).add(Number(data.leafId)));
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      setMsg("Yes! Je hebt een blad geclaimd 🌿");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eaf7ee", padding: 16 }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Help ons de poster onthullen!</h1>
        <p style={{ marginTop: 0, opacity: 0.8 }}>Claim één blad. Elke claim haalt 1 blad weg (voor iedereen).</p>

        <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0" }}>
          <button
            onClick={claim}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "#1f7a3a",
              color: "white",
              fontSize: 16,
              cursor: "pointer",
              flex: 1,
            }}
          >
            Claim een blad
          </button>
          <div style={{ fontWeight: 700 }}>{remaining === null ? "…" : remaining} over</div>
        </div>

        {msg && <div style={{ background: "white", padding: 12, borderRadius: 12, marginBottom: 12 }}>{msg}</div>}

        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "3 / 4",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            background: "#fff",
          }}
        >
          <Image src="/poster.jpg" alt="Poster" fill style={{ objectFit: "cover" }} priority />

          <div style={{ position: "absolute", inset: 0 }}>
            {leafStyles.map((s) => (
              <img
                key={s.id}
                src={s.leaf}
                alt=""
                style={{
                  position: "absolute",
                  left: s.left,
                  top: s.top,
                  width: 70,
                  height: 70,
                  transform: `rotate(${s.rotate}) scale(${s.scale})`,
                  opacity: removed.has(s.id) ? 0 : 1,
                  transition: "opacity 500ms ease",
                  pointerEvents: "none",
                  filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.18))",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
