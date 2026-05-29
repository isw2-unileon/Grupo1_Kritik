export interface UserData {
  id: number;
  email: string;
  name: string;
  surname: string;
  user_name: string;
}

export interface LoginResponse {
  token: string;
  user: UserData;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  surname?: string;
  user_name?: string;
  birth?: string;
}

export interface Product {
  id: number;
  Name: string;
}

export interface NewReview {
  product_id: number;
  description: string;
  recommended: boolean;
}

const BASE = import.meta.env.VITE_API_URL ?? "";

// fetch wrapper that attaches the stored JWT to authenticated requests.
function authedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export async function login(
  username: string,
  password: string,
  signal?: AbortSignal,
): Promise<LoginResponse> {
  const isEmail = username.includes("@");
  const body = isEmail
    ? { email: username, password }
    : { user_name: username, password };

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "login failed" }));
    throw new Error(err.error || "login failed");
  }

  return res.json();
}

export async function register(
  data: RegisterPayload,
  signal?: AbortSignal,
): Promise<UserData> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "registration failed" }));
    throw new Error(err.error || "registration failed");
  }

  return res.json();
}

export async function searchProducts(
  query: string,
  signal?: AbortSignal,
): Promise<Product[]> {
  const res = await authedFetch(
    `${BASE}/api/products?q=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!res.ok) {
    throw new Error("product search failed");
  }

  // El backend devuelve un array cuando hay varias coincidencias, pero un único
  // objeto cuando encuentra un producto por nombre exacto (y null/{} si no hay
  // nada). Normalizamos siempre a Product[] para que el resto de la app no se rompa.
  const data: unknown = await res.json();
  if (Array.isArray(data)) return data as Product[];
  if (data && typeof data === "object" && "id" in data) return [data as Product];
  return [];
}

export async function createReview(
  review: NewReview,
  signal?: AbortSignal,
): Promise<unknown> {
  const res = await authedFetch(`${BASE}/api/reviews`, {
    method: "POST",
    body: JSON.stringify(review),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "could not create review" }));
    throw new Error(err.error || "could not create review");
  }
  return res.json();
}

export interface Review {
  id: number;
  Description: string;
  Recommended: boolean;
  ProductName: string;
  UserName: string;
}

export async function getReviews(signal?: AbortSignal): Promise<Review[]> {
  const res = await authedFetch(`${BASE}/api/reviews`, { signal });
  if (!res.ok) {
    throw new Error("could not load reviews");
  }
  return res.json();
}
