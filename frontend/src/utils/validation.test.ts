import { describe, it, expect } from "vitest";
import { isEmpty, isValidEmail } from "./validation";

describe("isEmpty", () => {
  it("returns true for empty string", () => {
    expect(isEmpty("")).toBe(true);
  });

  it("returns true for whitespace-only string", () => {
    expect(isEmpty("   ")).toBe(true);
  });

  it("returns false for non-empty string", () => {
    expect(isEmpty("hello")).toBe(false);
  });

  it("returns false for string with only non-whitespace after trim", () => {
    expect(isEmpty("  a  ")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("returns true for standard email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("returns true for email with subdomain", () => {
    expect(isValidEmail("user@sub.example.com")).toBe(true);
  });

  it("returns false for string without @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("returns false for string without domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("returns false for email with spaces", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });
});
