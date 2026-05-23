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
  Name: string;
}

export interface NewReview {
  title: string;
  product_name: string;
  description: string;
  rating: number;
}

const BASE = "";

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
  password: string
): Promise<LoginResponse> {
  const isEmail = username.includes("@");
  const body = isEmail
    ? { email: username, password }
    : { user_name: username, password };

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "login failed" }));
    throw new Error(err.error || "login failed");
  }

  return res.json();
}

export async function register(data: RegisterPayload): Promise<UserData> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "registration failed" }));
    throw new Error(err.error || "registration failed");
  }

  return res.json();
}

export async function searchProducts(query: string): Promise<Product[]> {
  const res = await authedFetch(`${BASE}/api/products?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error("product search failed");
  }
  return res.json();
}

export async function createReview(review: NewReview): Promise<unknown> {
  const res = await authedFetch(`${BASE}/api/reviews`, {
    method: "POST",
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "could not create review" }));
    throw new Error(err.error || "could not create review");
  }
  return res.json();
}

export interface Review {
  id: number;
  Name: string;
  Description: string;
  Recommended: boolean;
  Rating: number;
  ProductName: string;
  UserName: string;
}

export async function getReviews(): Promise<Review[]> {
  const res = await authedFetch(`${BASE}/api/reviews`);
  if (!res.ok) {
    throw new Error("could not load reviews");
  }
  return res.json();
}
