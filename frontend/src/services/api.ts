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

const BASE = "";

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

export async function register(
  data: RegisterPayload
): Promise<UserData> {
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
