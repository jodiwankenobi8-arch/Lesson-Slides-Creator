/**
 * File Center - Complete File Management UI
 * 
 * Features:
 * - Load and display all user files
 * - Search/filter files
 * - Select multiple files
 * - Bulk delete with confirmation
 * - Delete all with typed confirmation
 * - Shows file size and creation date
 */

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";

type FileRecord = {
  id: string;
  name: string;
  size?: number;
  mime?: string;
  createdAt?: string;
};

function fmtBytes(n?: number) {
  if (!n && n !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function FileCenter() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string>("");
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return files;
    return files.filter(f => f.name.toLowerCase().includes(s));
  }, [files, q]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  async function refresh() {
    setLoading(true);
    setStatus("");
    try {
      const res = await api.meFiles();
      const json = await api.getJSON<FileRecord[]>(res);
      // Handle both array response and { files: [...] } response
      const fileList = Array.isArray(json) ? json : (json as any).files || [];
      setFiles(fileList);
      setSelected({});
    } catch (e: any) {
      setStatus(`Failed to load files: ${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} file(s)? This cannot be undone.`)) return;

    setStatus("Deleting selected…");
    for (const id of selectedIds) {
      try {
        const res = await api.deleteFile(id);
        if (!res.ok) throw new Error(await res.text());
      } catch (e: any) {
        setStatus(`Delete failed for ${id}: ${String(e?.message || e)}`);
        return;
      }
    }
    setStatus("Deleted selected.");
    await refresh();
  }

  async function deleteAll() {
    if (deleteAllConfirm.trim() !== "DELETE ALL") {
      setStatus(`Type DELETE ALL to confirm.`);
      return;
    }
    if (!confirm("Delete ALL files? This cannot be undone.")) return;

    setStatus("Deleting all…");
    for (const f of files) {
      try {
        const res = await api.deleteFile(f.id);
        if (!res.ok) throw new Error(await res.text());
      } catch (e: any) {
        setStatus(`Delete failed for ${f.name}: ${String(e?.message || e)}`);
        return;
      }
    }
    setStatus("Deleted all files.");
    await refresh();
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>File Center</div>
        <button onClick={refresh} disabled={loading}>Refresh</button>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files…"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />
        <button onClick={deleteSelected} disabled={selectedIds.length === 0 || loading}>
          Delete Selected
        </button>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 10, background: "#fafafa", display: "grid", gridTemplateColumns: "28px 1fr 110px 160px" }}>
          <div></div>
          <div style={{ fontWeight: 600 }}>Name</div>
          <div style={{ fontWeight: 600 }}>Size</div>
          <div style={{ fontWeight: 600 }}>Created</div>
        </div>

        {filtered.map((f) => (
          <label
            key={f.id}
            style={{ padding: 10, display: "grid", gridTemplateColumns: "28px 1fr 110px 160px", borderTop: "1px solid #f1f1f1", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={!!selected[f.id]}
              onChange={(e) => setSelected((s) => ({ ...s, [f.id]: e.target.checked }))}
            />
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
            <div>{fmtBytes(f.size)}</div>
            <div style={{ opacity: 0.75 }}>{f.createdAt ? new Date(f.createdAt).toLocaleString() : "—"}</div>
          </label>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: 12, opacity: 0.7 }}>No files.</div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #eee", paddingTop: 10, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Danger Zone</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={deleteAllConfirm}
            onChange={(e) => setDeleteAllConfirm(e.target.value)}
            placeholder='Type "DELETE ALL" to enable'
            style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />
          <button onClick={deleteAll} disabled={files.length === 0 || loading}>
            Delete All Files
          </button>
        </div>
        {status && (
          <div style={{ padding: 10, borderRadius: 10, border: "1px solid #eee", background: "#fff" }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
