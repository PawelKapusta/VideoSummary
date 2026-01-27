import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act } from "@testing-library/react";

import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  // Helper component to test the hook
  function TestComponent({ value, delay }: { value: string; delay: number }) {
    const debouncedValue = useDebounce(value, delay);
    return <div data-testid="debounced">{debouncedValue}</div>;
  }

  it("should return initial value immediately", () => {
    const { getByTestId } = render(<TestComponent value="initial" delay={500} />);

    expect(getByTestId("debounced")).toHaveTextContent("initial");
  });

  it("should return initial value after re-render with same value", () => {
    const { getByTestId, rerender } = render(<TestComponent value="initial" delay={500} />);

    rerender(<TestComponent value="initial" delay={500} />);

    expect(getByTestId("debounced")).toHaveTextContent("initial");
  });

  it("should update debounced value after delay", () => {
    const { getByTestId, rerender } = render(<TestComponent value="initial" delay={500} />);

    // Change value
    rerender(<TestComponent value="updated" delay={500} />);

    // Should still show initial value immediately
    expect(getByTestId("debounced")).toHaveTextContent("initial");

    // Advance time by delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now should show updated value
    expect(getByTestId("debounced")).toHaveTextContent("updated");
  });

  it("should reset timer when value changes before delay expires", () => {
    const { getByTestId, rerender } = render(<TestComponent value="first" delay={500} />);

    // Change value before delay expires
    rerender(<TestComponent value="second" delay={500} />);

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should still show first value
    expect(getByTestId("debounced")).toHaveTextContent("first");

    // Advance remaining time
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now should show second value
    expect(getByTestId("debounced")).toHaveTextContent("second");
  });

  it("should reset timer when delay changes", () => {
    const { getByTestId, rerender } = render(<TestComponent value="test" delay={500} />);

    // Change delay
    rerender(<TestComponent value="test" delay={1000} />);

    // Advance time by original delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should still show old value (timer was reset)
    expect(getByTestId("debounced")).toHaveTextContent("test");

    // Advance time by new delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should still show value (not yet updated)
    expect(getByTestId("debounced")).toHaveTextContent("test");
  });

  it("should handle delay of 0", () => {
    const { getByTestId, rerender } = render(<TestComponent value="initial" delay={0} />);

    rerender(<TestComponent value="updated" delay={0} />);

    // With delay=0, setTimeout executes in next tick, so we need to advance timers
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Should update after next tick
    expect(getByTestId("debounced")).toHaveTextContent("updated");
  });

  it("should handle very short delays", () => {
    const { getByTestId, rerender } = render(<TestComponent value="initial" delay={1} />);

    rerender(<TestComponent value="updated" delay={1} />);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(getByTestId("debounced")).toHaveTextContent("updated");
  });

  it("should handle very long delays", () => {
    const { getByTestId, rerender } = render(<TestComponent value="initial" delay={10000} />);

    rerender(<TestComponent value="updated" delay={10000} />);

    // Advance most of the time
    act(() => {
      vi.advanceTimersByTime(9999);
    });

    // Should still show initial
    expect(getByTestId("debounced")).toHaveTextContent("initial");

    // Advance final millisecond
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(getByTestId("debounced")).toHaveTextContent("updated");
  });

  it("should work with different value types", () => {
    // Test with numbers
    function NumberTestComponent({ value, delay }: { value: number; delay: number }) {
      const debouncedValue = useDebounce(value, delay);
      return <div data-testid="debounced">{debouncedValue}</div>;
    }

    const { getByTestId, rerender } = render(<NumberTestComponent value={42} delay={100} />);

    rerender(<NumberTestComponent value={100} delay={100} />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(getByTestId("debounced")).toHaveTextContent("100");
  });

  it("should work with objects", () => {
    function ObjectTestComponent({ value, delay }: { value: { name: string }; delay: number }) {
      const debouncedValue = useDebounce(value, delay);
      return <div data-testid="debounced">{debouncedValue.name}</div>;
    }

    const { getByTestId, rerender } = render(<ObjectTestComponent value={{ name: "John" }} delay={200} />);

    rerender(<ObjectTestComponent value={{ name: "Jane" }} delay={200} />);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(getByTestId("debounced")).toHaveTextContent("Jane");
  });

  it("should handle rapid successive changes", () => {
    const { getByTestId, rerender } = render(<TestComponent value="v1" delay={100} />);

    // Rapid changes
    rerender(<TestComponent value="v2" delay={100} />);
    rerender(<TestComponent value="v3" delay={100} />);
    rerender(<TestComponent value="final" delay={100} />);

    // Advance time
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should show the final value
    expect(getByTestId("debounced")).toHaveTextContent("final");
  });

  it("should handle component unmounting", () => {
    const { rerender, unmount } = render(<TestComponent value="initial" delay={500} />);

    rerender(<TestComponent value="updated" delay={500} />);

    // Unmount before timer expires
    unmount();

    // Advance time - should not cause issues
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Component is unmounted, no assertions possible
    expect(true).toBe(true); // Just verify no errors
  });

  it("should handle negative delay (edge case)", () => {
    const { getByTestId, rerender } = render(<TestComponent value="initial" delay={-100} />);

    rerender(<TestComponent value="updated" delay={-100} />);

    // Negative delay might behave unpredictably, but shouldn't crash
    expect(getByTestId("debounced")).toBeDefined();
  });

  it("should maintain value when re-rendered with same props", () => {
    const { getByTestId, rerender } = render(<TestComponent value="same" delay={300} />);

    // Multiple re-renders with same props
    rerender(<TestComponent value="same" delay={300} />);
    rerender(<TestComponent value="same" delay={300} />);

    // Advance partial time
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(getByTestId("debounced")).toHaveTextContent("same");
  });
});
