import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("should return empty string when no arguments provided", () => {
    expect(cn()).toBe("");
  });

  it("should return single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("should combine multiple classes without conflicts", () => {
    expect(cn("text-red-500", "bg-blue-500", "p-4")).toBe("text-red-500 bg-blue-500 p-4");
  });

  it("should merge conflicting Tailwind classes (later wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should handle complex Tailwind conflicts", () => {
    expect(cn("p-2", "p-4", "text-sm", "text-lg")).toBe("p-4 text-lg");
  });

  it("should ignore undefined and null values", () => {
    expect(cn("text-red-500", undefined, null, "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("should handle empty strings", () => {
    expect(cn("text-red-500", "", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("should handle arrays of classes", () => {
    expect(cn(["text-red-500", "p-2"], "bg-blue-500")).toBe("text-red-500 p-2 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn(
      "btn",
      isActive && "btn-active",
      isDisabled && "btn-disabled",
      "text-center"
    )).toBe("btn btn-active text-center");
  });

  it("should handle important modifier classes", () => {
    // !important is preserved as part of the class name
    expect(cn("text-red-500", "text-blue-500!")).toBe("text-red-500 text-blue-500!");
  });

  it("should handle responsive classes", () => {
    expect(cn("text-sm", "md:text-lg", "lg:text-xl")).toBe("text-sm md:text-lg lg:text-xl");
  });

  it("should handle arbitrary values", () => {
    expect(cn("bg-[#ff0000]", "text-[14px]")).toBe("bg-[#ff0000] text-[14px]");
  });
});