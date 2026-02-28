/**
 * XHR Upload - Real Progress Tracking with Retries
 * 
 * ✅ Uses XHR so you get real progress % and it won't "freeze"
 * ✅ Automatic retries on network errors or timeouts
 * ✅ Hybrid auth pattern: Authorization/apikey = anon, userToken in query param
 */

import { supabase } from '../supabase-auth';
import { publicAnonKey, projectId } from '../supabase/info';

type XhrUploadOpts = {
  url: string;
  form: FormData;
  timeoutMs?: number;
  retries?: number;
  onProgress?: (pct: number) => void;
};

export async function xhrHybridUpload(opts: XhrUploadOpts): Promise<Response> {
  const { url, form, timeoutMs = 120_000, retries = 2, onProgress } = opts;

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(`getSession failed: ${error.message}`);
  if (!session?.access_token) throw new Error("No session access token");

  const u = new URL(url);
  u.searchParams.set("userToken", session.access_token);

  let lastErr: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", u.toString(), true);
        xhr.timeout = timeoutMs;

        // ✅ gateway headers
        xhr.setRequestHeader("Authorization", `Bearer ${publicAnonKey}`);
        xhr.setRequestHeader("apikey", publicAnonKey);
        xhr.setRequestHeader("x-project", projectId);

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable || !onProgress) return;
          onProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          const text = xhr.responseText || "";
          resolve(new Response(text, { status: xhr.status, statusText: xhr.statusText }));
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));

        xhr.send(form);
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Upload failed: ${res.status}`);
      }
      return res;
    } catch (e) {
      lastErr = e;
      const msg = String((e as any)?.message || e);
      const retryable = msg.includes("timed out") || msg.includes("Network");
      if (attempt < retries && retryable) {
        await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }

  throw lastErr;
}
