import { useAuthStore } from "@/store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((item: { msg: string }) => item.msg).join(", ");
    }
  } catch {
    // the response had no JSON body, so we use the fallback below
  }
  return "Something went wrong. Please try again.";
}

// NEW: sends the request, handles errors and the 401 logout, returns the raw Response.
// api() and apiBlob() both build on it, so these rules live in ONE place.
async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const { method = "GET", body } = options;
  const token = useAuthStore.getState().token;

  let response: Response;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isFormData ? body : body ?  JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection.", 0);
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      useAuthStore.getState().logout();
    }
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return response;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options);

  // 204 means "success, nothing to send back", so there is no JSON to read
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// NEW: for files. Same auth and error handling, but returns raw bytes instead of JSON.
export async function apiBlob(path: string): Promise<Blob> {
  const response = await request(path);
  return response.blob();
}







