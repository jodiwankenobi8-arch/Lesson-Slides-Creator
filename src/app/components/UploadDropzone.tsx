/**
 * Upload Dropzone - Automatic Quicker & Easier Upload Handler
 * 
 * Features:
 * - Automatically queues uploads (one at a time)
 * - Automatically compresses images
 * - Warns on PPTX/PDF/ZIP sizes
 * - Shows real-time progress
 * - Automatic retries on failures
 * - XHR-based for reliable progress tracking
 */

import React, { useState } from "react";
import { preflightFile } from "../../utils/upload/preflight";
import { enqueueUpload } from "../../utils/upload/uploadQueue";
import { compressImageFile } from "../../utils/upload/imageCompress";
import { xhrHybridUpload } from "../../utils/upload/xhrUpload";
import { FUNCTION_NAME } from "../../utils/api";
import { projectId } from "../../utils/supabase/info";

export function UploadDropzone() {
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  // Your actual function upload URL (uses projectId + function name)
  const uploadUrl = `https://${projectId}.supabase.co/functions/v1/${FUNCTION_NAME}/files/lesson/upload`;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    // ✅ Automatically do one at a time (queue)
    Array.from(fileList).forEach((file) => {
      enqueueUpload(async () => {
        const pf = preflightFile(file);
        if (pf.warnings.length) setStatus(pf.warnings.join(" "));

        let toUpload = file;

        // ✅ Automatic safe compression (images only)
        if (pf.kind === "image") {
          setStatus(`Optimizing image ${file.name}…`);
          try {
            toUpload = await compressImageFile(file);
          } catch {
            toUpload = file; // fallback
          }
        }

        setProgress(0);
        setStatus(`Uploading ${toUpload.name}…`);

        const form = new FormData();
        form.append("file", toUpload);

        // XHR = real progress
        await xhrHybridUpload({
          url: uploadUrl,
          form,
          onProgress: (p) => setProgress(p),
          timeoutMs: 180_000,
          retries: 2,
        });

        setStatus(`Uploaded — preparing in the cloud… (${toUpload.name})`);
        setProgress(100);
      });
    });
  }

  return (
    <div style={{ padding: 16, border: "2px dashed #cfd8e3", borderRadius: 14, background: "#fbfdff" }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Upload</div>
      <div style={{ opacity: 0.75, marginBottom: 10 }}>
        Tip: Upload ONE PPTX first. Avoid PPTX+PDF+ZIP duplicates.
      </div>

      <input
        type="file"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div style={{ marginTop: 12 }}>
        <div style={{ height: 10, background: "#eef2f7", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: 10, background: "#4e6b86", transition: "width 0.2s" }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>{status}</div>
      </div>
    </div>
  );
}
