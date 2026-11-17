export function buildContentDisposition(
  disposition: "inline" | "attachment",
  fileName: string,
) {
  const cleaned = fileName.replace(/[\r\n"]/g, "_").trim() || "documento";
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(cleaned);

  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
