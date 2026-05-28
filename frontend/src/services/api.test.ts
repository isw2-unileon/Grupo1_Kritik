import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { login, register, searchProducts, createReview, getReviews } from "./api";

function mockFetch(data: unknown, ok = true) {
  return vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
    })
  ));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("login", () => {
  it("sends POST to /auth/login with email when username contains @", async () => {
    const fake = { token: "t1", user: { id: 1, email: "a@b.com", name: "A", surname: "B", user_name: "ab" } };
    mockFetch(fake);

    const result = await login("a@b.com", "pwd");
    expect(result).toEqual(fake);

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toContain("/auth/login");
    expect(JSON.parse(callArgs[1].body)).toEqual({ email: "a@b.com", password: "pwd" });
  });

  it("sends POST with user_name when username has no @", async () => {
    const fake = { token: "t1", user: { id: 2, email: "x@y.com", name: "X", surname: "Y", user_name: "xy" } };
    mockFetch(fake);

    const result = await login("myuser", "pass");
    expect(result).toEqual(fake);

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(callArgs[1].body)).toEqual({ user_name: "myuser", password: "pass" });
  });

  it("throws on non-ok response", async () => {
    mockFetch({ error: "bad" }, false);
    await expect(login("a@b.com", "pwd")).rejects.toThrow("bad");
  });

  it("throws default error when non-ok response has no json body", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.reject(new Error("parse fail")),
      })
    ));

    await expect(login("a@b.com", "pwd")).rejects.toThrow("login failed");
  });
});

describe("register", () => {
  it("sends POST to /auth/register with payload", async () => {
    const fake = { id: 3, email: "c@d.com", name: "C", surname: "D", user_name: "cd" };
    mockFetch(fake);

    const result = await register({ email: "c@d.com", password: "pw", name: "C", surname: "D" });
    expect(result).toEqual(fake);

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toContain("/auth/register");
    expect(JSON.parse(callArgs[1].body)).toEqual({ email: "c@d.com", password: "pw", name: "C", surname: "D" });
  });

  it("throws on non-ok response", async () => {
    mockFetch({ error: "email taken" }, false);
    await expect(register({ email: "a@b.com", password: "pw", name: "N" })).rejects.toThrow("email taken");
  });
});

describe("searchProducts", () => {
  it("sends GET to /api/products?q=... with auth header", async () => {
    localStorage.setItem("token", "my-token");
    mockFetch([{ id: 1, Name: "Game" }]);

    const result = await searchProducts("Game");
    expect(result).toEqual([{ id: 1, Name: "Game" }]);

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toContain("/api/products?q=Game");
    expect(callArgs[1].headers.Authorization).toBe("Bearer my-token");
  });

  it("throws on non-ok", async () => {
    mockFetch(undefined, false);
    await expect(searchProducts("x")).rejects.toThrow("product search failed");
  });
});

describe("createReview", () => {
  it("sends POST to /api/reviews with auth header", async () => {
    localStorage.setItem("token", "t");
    mockFetch({ id: 1 });

    const review = { title: "Great", product_id: 5, description: "Nice", recommended: true };
    const result = await createReview(review);
    expect(result).toEqual({ id: 1 });

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toContain("/api/reviews");
    expect(callArgs[1].method).toBe("POST");
    expect(JSON.parse(callArgs[1].body)).toEqual(review);
    expect(callArgs[1].headers.Authorization).toBe("Bearer t");
  });

  it("throws on non-ok", async () => {
    mockFetch({ error: "title exists" }, false);
    await expect(createReview({ title: "G", product_id: 1, description: "D", recommended: true })).rejects.toThrow("title exists");
  });
});

describe("getReviews", () => {
  it("sends GET to /api/reviews with auth header", async () => {
    localStorage.setItem("token", "t2");
    mockFetch([{ id: 1, Name: "R" }]);

    const result = await getReviews();
    expect(result).toEqual([{ id: 1, Name: "R" }]);

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toContain("/api/reviews");
    expect(callArgs[1].headers.Authorization).toBe("Bearer t2");
  });

  it("throws on non-ok", async () => {
    mockFetch(undefined, false);
    await expect(getReviews()).rejects.toThrow("could not load reviews");
  });
});
