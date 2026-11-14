import { apiBlob } from "@/lib/api";

// Fetches a file from the API (with the auth token) and makes the browser save it.
export async function downloadFile(path: string, filename: string): Promise<void> {
  const blob = await apiBlob(path);

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Free the memory, after a moment so the browser has started the save
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}