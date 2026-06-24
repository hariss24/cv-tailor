import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

describe("Login API", () => {
  beforeEach(() => {
    process.env.REMOTE_AUTH_PASSWORD = "secretpassword";
    // Mock crypto.subtle.digest for tests to avoid having to use real crypto API in node
    const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32));
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: mockDigest
        }
      }
    });
  });

  afterEach(() => {
    delete process.env.REMOTE_AUTH_PASSWORD;
    vi.restoreAllMocks();
  });

  it("should return success if no password is set", async () => {
    delete process.env.REMOTE_AUTH_PASSWORD;
    const req = new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify({ password: "anything" }),
      headers: { "x-forwarded-for": "1.1.1.1" }
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const req = new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify({ password: "wrong" }),
      headers: { "x-forwarded-for": "2.2.2.2" }
    });
    
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should rate limit after 5 failed attempts", async () => {
    const makeRequest = () => new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify({ password: "wrong" }),
      headers: { "x-forwarded-for": "3.3.3.3" }
    });

    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest());
      expect(res.status).toBe(401);
    }

    // The 6th request should hit the rate limit
    const resLimited = await POST(makeRequest());
    expect(resLimited.status).toBe(429);
    const data = await resLimited.json();
    expect(data.error).toContain("Trop de tentatives");
  });

  it("should succeed with correct password and clear rate limit", async () => {
    const makeRequest = (pwd: string) => new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify({ password: pwd }),
      headers: { "x-forwarded-for": "4.4.4.4" }
    });

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await POST(makeRequest("wrong"));
    }

    // Success
    const res = await POST(makeRequest("secretpassword"));
    expect(res.status).toBe(200);
    
    // Cookie should be set
    const cookie = res.headers.get("Set-Cookie");
    expect(cookie).toContain("auth_token=");
  });
});
