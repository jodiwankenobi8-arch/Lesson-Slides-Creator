import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// DEPLOYMENT VERIFICATION: 2026-02-28T16:45:00Z-apple-orchard-v1
console.log("✅ main.tsx loaded - Deployment ID: 2026-02-28T16:45:00Z-apple-orchard-v1");

function showFatal(message: string, extra?: unknown) {
  console.error("FATAL_BOOT_ERROR:", message, extra);

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:999999;background:#0b1220;" +
    "color:#e5e7eb;padding:16px;overflow:auto;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
  overlay.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <h1 style="font-size:18px;margin:0 0 8px 0">App failed to boot</h1>
      <p style="opacity:.85;margin:0 0 12px 0">${message}</p>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);padding:12px;border-radius:12px">${extra ? String(extra) : ""}</pre>
    </div>
  `;
  document.body.appendChild(overlay);
}

try {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    showFatal("Missing #root element in index.html");
  } else {
    createRoot(rootEl).render(<App />);
  }
} catch (err: any) {
  showFatal("Exception during React mount", err?.stack || err?.message || String(err));
}