import { describe, expect, it } from "vitest";
import { hashPassword, normalizeEmail, verifyPassword } from "./auth";

describe("password hashing", () => {
  it("verifies a correct password", () => {
    const stored = hashPassword("claveSegura123");
    expect(verifyPassword("claveSegura123", stored)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const stored = hashPassword("claveSegura123");
    expect(verifyPassword("otraClave", stored)).toBe(false);
  });

  it("salts every hash", () => {
    expect(hashPassword("misma")).not.toBe(hashPassword("misma"));
  });

  it("rejects malformed hashes", () => {
    expect(verifyPassword("x", "not-a-hash")).toBe(false);
    expect(verifyPassword("x", "scrypt$aa$bb")).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Dueño@Complejo.COM ")).toBe("dueño@complejo.com");
  });
});
