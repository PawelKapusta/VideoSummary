import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Simple component for testing
const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;

describe("Unit Test Environment", () => {
  it("should pass a basic truthy test", () => {
    expect(true).toBe(true);
  });

  it("should render a React component", () => {
    render(<TestComponent message="Hello Vitest" />);
    expect(screen.getByText("Hello Vitest")).toBeInTheDocument();
  });
});
