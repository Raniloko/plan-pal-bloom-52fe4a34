import { describe, expect, it } from "vitest";
import { occasionText, parseOccasion, serializeOccasion } from "./guestReservation";

describe("occasion helpers", () => {
  it("parses multiple occasions and free text", () => {
    expect(parseOccasion("sport, sonstiges: Geburtstag")).toEqual({ keys: ["sport", "sonstiges"], other: "Geburtstag" });
    expect(parseOccasion("")).toEqual({ keys: [], other: "" });
  });

  it("round-trips to the booking form format", () => {
    expect(serializeOccasion(["sport", "sonstiges"], "Geburtstag, Firma")).toBe("sport, sonstiges: Geburtstag; Firma");
    expect(serializeOccasion(["essen", "sonstiges"], "")).toBe("essen, sonstiges");
  });

  it("renders readable labels", () => {
    expect(occasionText("sport, sonstiges: Geburtstag")).toBe("Live-Sport, Geburtstag");
  });
});
