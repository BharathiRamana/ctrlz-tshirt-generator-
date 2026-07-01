import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MockupGenerator from "./components/MockupGenerator";

const ADMIN_PASSWORD = "admin1234"; // Change this to whatever you want

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit() {
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem("ctrlz_auth", "true");
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#1A1A1A",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: "#F5F0E8", borderRadius: 16, padding: "40px 32px",
        width: "100%", maxWidth: 360, textAlign: "center",
        borderTop: "4px solid #E8500A",
      }}>
        <div style={{ fontSize: 10, letterSpacing: "3px", color: "#E8500A", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
          Ctrl+Z Store
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", marginBottom: 4 }}>
          Admin Access
        </div>
        <div style={{ fontSize: 13, color: "#6B6560", marginBottom: 28 }}>
          Enter password to continue
        </div>
        <input
          type="password"
          placeholder="Password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{
            width: "100%", padding: "12px 14px", border: error ? "2px solid #E8500A" : "1px solid #D8D0C4",
            borderRadius: 8, fontSize: 14, marginBottom: 12,
            outline: "none", boxSizing: "border-box",
            background: error ? "#FFF0E8" : "#fff",
            transition: "all 0.2s",
          }}
        />
        {error && (
          <div style={{ color: "#E8500A", fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
            Incorrect password. Try again.
          </div>
        )}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%", background: "#E8500A", color: "#fff",
            border: "none", borderRadius: 8, padding: "12px",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          Unlock →
        </button>
      </div>
    </div>
  );
}

function Home() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: "40px", background: "#F5F0E8", minHeight: "100vh" }}>
      <div style={{ background: "#1A1A1A", borderBottom: "4px solid #E8500A", padding: "20px 24px", margin: "-40px -40px 32px -40px" }}>
        <div style={{ fontSize: 10, letterSpacing: "3px", color: "#E8500A", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Ctrl+Z Store</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>CRM Dashboard</div>
      </div>
      <Link
        to="/mockup"
        style={{
          display: "inline-block", background: "#E8500A", color: "#fff",
          padding: "14px 24px", borderRadius: "8px", textDecoration: "none",
          fontWeight: 700, fontSize: 14,
        }}
      >
        🎨 Open AI Mockup Generator
      </Link>
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(
    sessionStorage.getItem("ctrlz_auth") === "true"
  );

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mockup" element={<MockupGenerator />} />
      </Routes>
    </BrowserRouter>
  );
}