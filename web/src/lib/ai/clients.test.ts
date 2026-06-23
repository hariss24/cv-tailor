import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isAnthropicKey,
  requireKey,
  hasServerKey,
  serverKeyPreview,
  streamCompletion,
} from "./clients";

const ORIGINAL = process.env.GEMINI_API_KEY;

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
});
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = ORIGINAL;
});

describe("isAnthropicKey", () => {
  it("reconnaît les clés Anthropic", () => {
    expect(isAnthropicKey("sk-ant-abc")).toBe(true);
    expect(isAnthropicKey("AIzaSyXXXX")).toBe(false);
    expect(isAnthropicKey("")).toBe(false);
  });
});

describe("requireKey", () => {
  it("préfère la clé utilisateur", () => {
    process.env.GEMINI_API_KEY = "server-key";
    expect(requireKey("user-key")).toBe("user-key");
  });

  it("retombe sur la clé serveur", () => {
    process.env.GEMINI_API_KEY = "server-key";
    expect(requireKey()).toBe("server-key");
    expect(requireKey(null)).toBe("server-key");
  });

  it("lève si aucune clé n'est disponible", () => {
    expect(() => requireKey()).toThrow(/Aucune clé API/);
  });
});

describe("statut clé serveur", () => {
  it("reflète l'absence de clé", () => {
    expect(hasServerKey()).toBe(false);
    expect(serverKeyPreview()).toBeNull();
  });

  it("expose un aperçu tronqué quand la clé existe", () => {
    process.env.GEMINI_API_KEY = "AIzaSecret";
    expect(hasServerKey()).toBe(true);
    expect(serverKeyPreview()).toBe("AIza…");
  });
});

describe("streamCompletion (garde Anthropic + images)", () => {
  it("refuse les images avec une clé Anthropic", async () => {
    const gen = streamCompletion("prompt", "system", {
      apiKey: "sk-ant-test",
      images: [new Uint8Array([1, 2, 3])],
    });
    await expect(gen.next()).rejects.toThrow(/Anthropic ne supporte pas/);
  });

  it("lève sans clé", async () => {
    const gen = streamCompletion("prompt", "system");
    await expect(gen.next()).rejects.toThrow(/Aucune clé API/);
  });
});
