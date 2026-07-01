import { describe, it, expect, vi, afterEach } from "vitest";
import { getCommuteTimes, commuteSummary } from "./maps";
import type { JobSearchProfile } from "./profile";

afterEach(() => vi.unstubAllGlobals());

const profile = {
  homeAddress: "Home",
  commuteModes: ["transit", "bicycling"],
} as unknown as JobSearchProfile;

function okMatrix(text: string) {
  return { ok: true, json: async () => ({ rows: [{ elements: [{ status: "OK", duration: { text } }] }] }) };
}

describe("getCommuteTimes", () => {
  it("appelle Maps par mode et renvoie la durée (origine + destination dans l'URL)", async () => {
    const fetchMock = vi.fn(async () => okMatrix("25 min"));
    vi.stubGlobal("fetch", fetchMock);
    const out = await getCommuteTimes("48.8,2.3", profile, "KEY");
    expect(out).toEqual({ transit: "25 min", bicycling: "25 min" });
    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toContain("destinations=48.8%2C2.3");
    expect(url).toContain("origins=Home");
  });

  it("renvoie N/A partout si la destination est vide", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect(await getCommuteTimes("", profile, "KEY")).toEqual({ transit: "N/A", bicycling: "N/A" });
  });

  it("N/A si l'élément Maps n'est pas OK", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: true, json: async () => ({ rows: [{ elements: [{ status: "ZERO_RESULTS" }] }] }) }));
    const out = await getCommuteTimes("75 - Paris", profile, "KEY");
    expect(out).toEqual({ transit: "N/A", bicycling: "N/A" });
  });
});

describe("commuteSummary", () => {
  it("formate TC + Vélo dans l'ordre attendu", () => {
    expect(commuteSummary({ transit: "25 min", bicycling: "40 min" })).toBe("TC: 25 min | Vélo: 40 min");
  });
});
