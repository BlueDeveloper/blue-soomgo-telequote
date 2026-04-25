import type { Carrier, Plan, ApiResponse } from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://hlmobile-api.raon-foodtruck.workers.dev";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res.json();
}

// Auth
export async function login(password: string): Promise<ApiResponse<{ token: string }>> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

// Carriers
export async function fetchCarriers(activeOnly = true, parent?: string | null): Promise<Carrier[]> {
  const params = new URLSearchParams();
  if (!activeOnly) params.set("active", "0");
  if (parent !== undefined) params.set("parent", parent === null ? "null" : parent);
  const qs = params.toString();
  const res = await request<Carrier[]>(`/api/carriers${qs ? `?${qs}` : ""}`);
  return res.data || [];
}

export async function fetchCarrierTree(activeOnly = true): Promise<Carrier[]> {
  const params = new URLSearchParams({ tree: "1" });
  if (!activeOnly) params.set("active", "0");
  const res = await request<Carrier[]>(`/api/carriers?${params.toString()}`);
  return res.data || [];
}

export async function createCarrier(data: Partial<Carrier>): Promise<ApiResponse<{ id: string }>> {
  return request("/api/carriers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCarrier(id: string, data: Partial<Carrier>): Promise<ApiResponse<void>> {
  return request(`/api/carriers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCarrier(id: string): Promise<ApiResponse<void>> {
  return request(`/api/carriers/${id}`, { method: "DELETE" });
}

// Plans
export async function fetchPlans(
  carrierId?: string,
  type?: string,
  activeOnly = true
): Promise<Plan[]> {
  const params = new URLSearchParams();
  if (carrierId) params.set("carrier", carrierId);
  if (type) params.set("type", type);
  if (!activeOnly) params.set("active", "0");
  const qs = params.toString();
  const res = await request<Plan[]>(`/api/plans${qs ? `?${qs}` : ""}`);
  return res.data || [];
}

export async function createPlan(data: Partial<Plan> & { carrierId?: string }): Promise<ApiResponse<{ id: number }>> {
  return request("/api/plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePlan(id: number, data: Partial<Plan>): Promise<ApiResponse<void>> {
  return request(`/api/plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePlan(id: number): Promise<ApiResponse<void>> {
  return request(`/api/plans/${id}`, { method: "DELETE" });
}
