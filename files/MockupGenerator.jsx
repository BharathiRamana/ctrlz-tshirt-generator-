import { useState, useRef } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
const EDGE_FUNCTION_URL = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/fashn-proxy";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// ─── Model Presets ────────────────────────────────────────────────────────────
// These are PUBLIC model image URLs you provide as the "base model"
// fal.ai needs a URL for the model_image — use your own hosted images
// or use the sample URLs below to test first
const MODEL_PRESETS = [
  {
    id: "indian_male_urban",
    label: "Indian Male — Urban",
    gender: "male",
    // Replace with your own hosted Indian model photos for best results
    // Must be a public HTTPS URL
    imageUrl: "https://storage.googleapis.com/falserverless/example_inputs/model.png",
    hint: "Urban Bangalore street setting",
  },
  {
    id: "indian_female_urban",
    label: "Indian Female — Urban",
    gender: "female",
    imageUrl: "https://storage.googleapis.com/falserverless/example_inputs/model.png",
    hint: "Urban Bangalore street setting",
  },
  {
    id: "indian_male_heritage",
    label: "Indian Male — Heritage",
    gender: "male",
    imageUrl: "https://storage.googleapis.com/falserverless/example_inputs/model.png",
    hint: "Heritage / cultural backdrop",
  },
  {
    id: "indian_female_heritage",
    label: "Indian Female — Heritage",
    gender: "female",
    imageUrl: "https://storage.googleapis.com/falserverless/example_inputs/model.png",
    hint: "Heritage / cultural backdrop",
  },
  {
    id: "indian_male_studio",
    label: "Indian Male — Studio",
    gender: "male",
    imageUrl: "https://storage.googleapis.com/falserverless/example_inputs/model.png",
    hint: "Clean white studio background",
  },
  {
    id: "indian_female_studio",
    label: "Indian Female — Studio",
    gender: "female",
    imageUrl: "https://storage.googleapis.com/falserverless/example_inputs/model.png",
    hint: "Clean white studio background",
  },
];

// ─── API Client ───────────────────────────────────────────────────────────────

async function callProxy(action, payload) {
  const res = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || "Request failed");
  return data;
}

async function pollUntilDone(requestId, maxWaitMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 3000));
    const status = await callProxy("status", { request_id: requestId });
    if (status.status === "COMPLETED") {
      const result = await callProxy("result", { request_id: requestId });
      const url = result.images?.[0]?.url;
      if (!url) throw new Error("No image returned.");
      return url;
    }
    if (status.status === "FAILED") throw new Error(status.error || "Generation failed.");
  }
  throw new Error("Timed out. Please try again.");
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function uploadToFal(file) {
  // fal.ai needs a public URL for garment_image
  // Since we can't upload directly from browser, we convert to base64 data URL
  // fal.ai accepts data URLs as input
  return toBase64(file);
}

function CopyBtn({ text, label = "Copy URL" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: copied ? "#1A1A1A" : "#E8500A", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", cursor: "pointer", textTransform: "uppercase" }}
    >{copied ? "✓ Copied" : label}</button>
  );
}

// ─── Step Bar ─────────────────────────────────────────────────────────────────

function StepBar({ current }) {
  const steps = ["upload", "model", "generate", "result"];
  const labels = ["Upload", "Model", "Generate", "Result"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
      {labels.map((l, i) => {
        const done = i < steps.indexOf(current);
        const active = steps[i] === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "#E8500A" : active ? "#1A1A1A" : "#E2DDD6", color: done || active ? "#fff" : "#A8A09A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                {done ? "✓" : i + 1}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: active ? "#1A1A1A" : "#A8A09A", whiteSpace: "nowrap" }}>{l}</div>
            </div>
            {i < labels.length - 1 && <div style={{ flex: 1, height: 2, background: done ? "#E8500A" : "#E2DDD6", margin: "0 6px", marginBottom: 18 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MockupGenerator() {
  const [step, setStep] = useState("upload");
  const [inputMode, setInputMode] = useState("flat");
  const [garmentFile, setGarmentFile] = useState(null);
  const [garmentPreview, setGarmentPreview] = useState(null);
  const [garmentDataUrl, setGarmentDataUrl] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [mockupUrl, setMockupUrl] = useState(null);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const fileRef = useRef();

  const S = {
    wrap: { fontFamily: "'Inter', sans-serif", background: "#F5F0E8", minHeight: "100vh" },
    header: { background: "#1A1A1A", borderBottom: "4px solid #E8500A", padding: "20px 24px" },
    tag: { fontSize: 10, letterSpacing: "3px", color: "#E8500A", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 },
    h1: { color: "#fff", fontSize: 20, fontWeight: 800 },
    sub: { color: "#A8A09A", fontSize: 12, marginTop: 2 },
    body: { padding: "24px" },
    card: { background: "#fff", border: "1px solid #E2DDD6", borderRadius: 12, padding: 20, marginBottom: 16 },
    label: { fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#6B6560", marginBottom: 8, display: "block" },
    error: { background: "#FFF0E8", border: "1px solid #E8500A", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#C03000", marginBottom: 12 },
    info: { background: "#F5F0E8", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#6B6560", marginTop: 12, textAlign: "center" },
    btn: (v = "primary") => ({
      background: v === "primary" ? "#E8500A" : v === "dark" ? "#1A1A1A" : "#F5F0E8",
      color: v === "ghost" ? "#6B6560" : "#fff",
      border: v === "ghost" ? "1px solid #D8D0C4" : "none",
      borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
    }),
    modeBtn: (a) => ({ flex: 1, padding: 12, border: a ? "2px solid #E8500A" : "2px solid #E2DDD6", borderRadius: 10, background: a ? "#FFF0E8" : "#fff", color: a ? "#E8500A" : "#6B6560", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
    presetBtn: (a) => ({ padding: "12px 14px", border: a ? "2px solid #1A1A1A" : "1px solid #E2DDD6", borderRadius: 10, background: a ? "#1A1A1A" : "#fff", color: a ? "#fff" : "#1A1A1A", fontWeight: 600, fontSize: 12, cursor: "pointer", textAlign: "left" }),
  };

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setGarmentFile(file);
    setGarmentPreview(URL.createObjectURL(file));
    const dataUrl = await toBase64(file);
    setGarmentDataUrl(dataUrl);
  }

  async function generateMockup() {
    setGenerating(true);
    setError("");
    setStatusMsg("Submitting to fal.ai...");

    try {
      const preset = MODEL_PRESETS.find(p => p.id === selectedPreset);

      // Submit try-on job
      const submitData = await callProxy("tryon", {
        model_image: preset.imageUrl,
        garment_image: garmentDataUrl, // base64 data URL
        garment_photo_type: inputMode === "flat" ? "flat-lay" : "on-model",
        mode: "quality",
      });

      const requestId = submitData.request_id;
      if (!requestId) throw new Error("No request ID returned. Check your FAL_KEY.");

      setStatusMsg("Processing... (~15 seconds)");
      const imageUrl = await pollUntilDone(requestId);
      setMockupUrl(imageUrl);
      setStep("result");
      setStatusMsg("");

    } catch (e) {
      setError(e.message);
      setStatusMsg("");
    }
    setGenerating(false);
  }

  function resetAll() {
    setStep("upload"); setGarmentFile(null); setGarmentPreview(null);
    setGarmentDataUrl(null); setSelectedPreset(null);
    setMockupUrl(null); setError(""); setStatusMsg("");
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.tag}>Ctrl+Z Store</div>
        <div style={S.h1}>AI Model Mockup Generator</div>
        <div style={S.sub}>Flat tee → Indian model photo · Powered by Fashn V1.6 via fal.ai · $0.075/generation</div>
      </div>

      <div style={S.body}>
        <StepBar current={step} />

        {/* Notice about model images */}
        {step === "upload" && (
          <div style={{ background: "#FFF8E8", border: "1px solid #E8C870", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#7A5A00" }}>
            <strong>📸 Important:</strong> For best results with Indian models, host your own model photos on Supabase Storage and update the <code>imageUrl</code> in MODEL_PRESETS. Sample URLs are used by default for testing.
          </div>
        )}

        {/* Upload */}
        {step === "upload" && (
          <div style={S.card}>
            <span style={S.label}>Step 1 — Upload Your T-shirt</span>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button style={S.modeBtn(inputMode === "flat")} onClick={() => setInputMode("flat")}>🏳️ Flat / Ghost Mannequin</button>
              <button style={S.modeBtn(inputMode === "on_model")} onClick={() => setInputMode("on_model")}>🧍 Already on Model</button>
            </div>
            <div
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current.click()}
              style={{ border: "2px dashed #D8D0C4", borderRadius: 12, padding: 32, textAlign: "center", cursor: "pointer", background: garmentPreview ? "#000" : "#F5F0E8", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
            >
              {garmentPreview
                ? <img src={garmentPreview} alt="Garment" style={{ maxHeight: 240, maxWidth: "100%", objectFit: "contain", borderRadius: 8 }} />
                : (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👕</div>
                    <div style={{ fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Drop your T-shirt image here</div>
                    <div style={{ fontSize: 12, color: "#A8A09A" }}>or click to browse · PNG, JPG, WEBP</div>
                    <div style={{ fontSize: 11, color: "#B8935A", marginTop: 8 }}>White or transparent background works best</div>
                  </div>
                )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            {garmentPreview && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button style={{ ...S.btn("primary"), flex: 1 }} onClick={() => setStep("model")}>Continue → Pick Model</button>
                <button style={S.btn("ghost")} onClick={() => { setGarmentFile(null); setGarmentPreview(null); setGarmentDataUrl(null); }}>Remove</button>
              </div>
            )}
          </div>
        )}

        {/* Model */}
        {step === "model" && (
          <div style={S.card}>
            <span style={S.label}>Step 2 — Choose Model</span>
            <div style={{ fontSize: 12, color: "#6B6560", marginBottom: 14 }}>
              Replace the <code>imageUrl</code> in each preset with your hosted Indian model photos for brand-consistent results.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {MODEL_PRESETS.map(p => (
                <button key={p.id} style={S.presetBtn(selectedPreset === p.id)} onClick={() => setSelectedPreset(p.id)}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{p.gender === "male" ? "👨" : "👩"}</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: selectedPreset === p.id ? "#A8A09A" : "#B8935A", marginTop: 2 }}>{p.hint}</div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("ghost")} onClick={() => setStep("upload")}>← Back</button>
              {selectedPreset && <button style={{ ...S.btn("primary"), flex: 1 }} onClick={() => setStep("generate")}>Continue → Generate</button>}
            </div>
          </div>
        )}

        {/* Generate */}
        {step === "generate" && (
          <div style={S.card}>
            <span style={S.label}>Step 3 — Generate</span>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 16, marginBottom: 20, alignItems: "center" }}>
              <img src={garmentPreview} alt="Garment" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #E2DDD6" }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{MODEL_PRESETS.find(p => p.id === selectedPreset)?.label}</div>
                <div style={{ fontSize: 12, color: "#6B6560" }}>{inputMode === "flat" ? "Flat-lay input" : "On-model input"} · Fashn V1.6 · Quality mode</div>
                <div style={{ fontSize: 11, color: "#B8935A", marginTop: 4 }}>$0.075 per generation · ~15 seconds</div>
              </div>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("ghost")} onClick={() => setStep("model")} disabled={generating}>← Back</button>
              <button style={{ ...S.btn("primary"), flex: 1, opacity: generating ? 0.7 : 1 }} onClick={generateMockup} disabled={generating}>
                {generating ? `⏳ ${statusMsg}` : "✦ Generate AI Mockup"}
              </button>
            </div>
            {generating && (
              <div style={S.info}>
                {statusMsg}<br />
                <div style={{ width: "100%", height: 3, background: "#E2DDD6", borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
                  <div style={{ width: "50%", height: "100%", background: "#E8500A", borderRadius: 2, animation: "shimmer 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {step === "result" && mockupUrl && (
          <div>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <span style={S.label}>Mockup Ready ✓</span>
                  <div style={{ fontSize: 13, color: "#6B6560" }}>Your T-shirt on an AI model</div>
                </div>
                <CopyBtn text={mockupUrl} />
              </div>
              <img src={mockupUrl} alt="AI Mockup" style={{ width: "100%", maxHeight: 480, objectFit: "contain", borderRadius: 10, background: "#F5F0E8" }} />
              <div style={{ marginTop: 12 }}>
                <a href={mockupUrl} download="ctrlz-mockup.jpg" style={{ ...S.btn("dark"), textDecoration: "none", display: "block", textAlign: "center" }}>↓ Download Mockup</a>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={resetAll}>← New Product</button>
              <button style={{ ...S.btn("dark"), flex: 1 }} onClick={() => { setMockupUrl(null); setStep("model"); }}>Try Different Model</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
    </div>
  );
}
