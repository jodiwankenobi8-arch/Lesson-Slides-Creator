/**
 * Upload Preflight - Smart Warnings for Different File Types
 * 
 * Provides automatic warnings for large files and optimization tips
 */

export type UploadKind = "pptx" | "pdf" | "zip" | "image" | "other";

export function getUploadKind(file: File): UploadKind {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pptx") return "pptx";
  if (ext === "pdf") return "pdf";
  if (ext === "zip") return "zip";
  if ((file.type || "").startsWith("image/")) return "image";
  return "other";
}

export function preflightFile(file: File) {
  const mb = file.size / (1024 * 1024);
  const kind = getUploadKind(file);

  const warnings: string[] = [];
  if (mb > 20) warnings.push(`Large file (${mb.toFixed(1)} MB). Upload will be slower on typical home upload speeds.`);
  if (kind === "pptx" && mb > 25) warnings.push("Tip: PowerPoint → File → Compress Pictures (Web/150 ppi) can shrink this a lot.");
  if ((kind === "pptx" || kind === "pdf" || kind === "zip") && mb > 60) warnings.push("Very large file. Upload ONE file at a time for best speed.");
  if (kind === "zip") warnings.push("ZIP isn't faster unless it contains many small assets.");
  return { kind, mb, warnings };
}
