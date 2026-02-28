import React, { useState } from "react";
import { api } from "../../utils/api";
import { projectId } from "../../utils/supabase/info";
import { FUNCTION_NAME } from "../../utils/api";
import { xhrHybridUpload } from "../../utils/upload/xhrUpload";

export function ProofPanel() {
  const [log, setLog] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const append = (s: string) => setLog((p) => p + (p ? "\n" : "") + s);

  async function proveAuth() {
    setLog("");
    append("=== PROVE AUTH PATTERN ===");

    try {
      const res = await api.meFiles();
      const text = await res.text();
      append(`Status: ${res.status}`);
      append(`Body: ${text.slice(0, 2000)}`);
      append("✅ If status is 200 and this endpoint works, hybrid auth is functioning.");
      append("NOTE: URL/header proof is best verified in DevTools Network for this request.");
    } catch (e: any) {
      append(`❌ Error: ${String(e?.message || e)}`);
    }
  }

  async function proveUpload() {
    setProgress(0);
    append("");
    append("=== PROVE UPLOAD PIPELINE (1MB test blob) ===");

    try {
      const bytes = new Uint8Array(1024 * 1024);
      crypto.getRandomValues(bytes);
      const file = new File([bytes], `proof-upload-${Date.now()}.bin`, { type: "application/octet-stream" });

      const form = new FormData();
      form.append("file", file);

      const uploadUrl = `https://${projectId}.supabase.co/functions/v1/${FUNCTION_NAME}/files/lesson/upload`;

      const res = await xhrHybridUpload({
        url: uploadUrl,
        form,
        timeoutMs: 180_000,
        retries: 2,
        onProgress: (p) => setProgress(p),
      });

      const text = await res.text();
      append(`Upload status: ${res.status}`);
      append(`Upload body: ${text.slice(0, 2000)}`);
      append("✅ If progress moved and status is 200, upload pipeline is working.");
    } catch (e: any) {
      append(`❌ Upload error: ${String(e?.message || e)}`);
    }
  }

  async function proveDelete() {
    append("");
    append("=== PROVE DELETE ===");
    try {
      const res1 = await api.meFiles();
      const json1 = await api.getJSON<{ files: any[] }>(res1);
      const before = json1.files?.length || 0;
      append(`Files before: ${before}`);

      if (!json1.files?.length) {
        append("No files to delete. Upload a file first.");
        return;
      }

      const first = json1.files[0];
      append(`Deleting: ${first.name || first.id}`);

      const del = await api.deleteFile(first.id);
      const delText = await del.text();
      append(`Delete status: ${del.status}`);
      append(`Delete body: ${delText.slice(0, 1000)}`);

      const res2 = await api.meFiles();
      const json2 = await api.getJSON<{ files: any[] }>(res2);
      const after = json2.files?.length || 0;
      append(`Files after: ${after}`);

      if (after < before) append("✅ Delete proof passed (count decreased).");
      else append("⚠️ Delete may not have removed item (check API response + server behavior).");
    } catch (e: any) {
      append(`❌ Delete error: ${String(e?.message || e)}`);
    }
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 10 }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>Proof Panel</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={proveAuth}>Prove Auth</button>
        <button onClick={proveUpload}>Prove Upload (1MB)</button>
        <button onClick={proveDelete}>Prove Delete</button>
      </div>

      <div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Upload progress</div>
        <div style={{ height: 10, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: 10, width: `${progress}%`, background: "#4E6B86" }} />
        </div>
      </div>

      <pre style={{
        whiteSpace: "pre-wrap",
        padding: 12,
        borderRadius: 12,
        border: "1px solid #eee",
        background: "#fff",
        fontSize: 12,
        lineHeight: 1.35,
        maxHeight: 320,
        overflow: "auto"
      }}>
        {log || "Run a proof action. Then check DevTools Network for the request URL + headers."}
      </pre>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        For final proof: open DevTools → Network → click the request → verify URL has <b>userToken=</b> and headers use anon key.
      </div>
    </div>
  );
}
