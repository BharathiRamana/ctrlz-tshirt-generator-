import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MockupGenerator from "./components/MockupGenerator";

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
          display: "inline-block",
          background: "#E8500A",
          color: "#fff",
          padding: "14px 24px",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        🎨 Open AI Mockup Generator
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mockup" element={<MockupGenerator />} />
      </Routes>
    </BrowserRouter>
  );
}