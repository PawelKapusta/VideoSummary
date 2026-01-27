import { describe, it, expect } from "vitest";
import {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ServerError,
} from "@/lib/openrouter.errors";

describe("OpenRouter Error Classes", () => {
  describe("OpenRouterError", () => {
    it("should create error with message and status", () => {
      const error = new OpenRouterError("Test error", 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
      expect(error.name).toBe("OpenRouterError");
    });

    it("should create error with message only", () => {
      const error = new OpenRouterError("Test error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error.message).toBe("Test error");
      expect(error.status).toBeUndefined();
      expect(error.name).toBe("OpenRouterError");
    });

    it("should create error with empty message", () => {
      const error = new OpenRouterError("");

      expect(error.message).toBe("");
      expect(error.status).toBeUndefined();
      expect(error.name).toBe("OpenRouterError");
    });
  });

  describe("AuthenticationError", () => {
    it("should create error with default message and status", () => {
      const error = new AuthenticationError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe("Invalid API Key");
      expect(error.status).toBe(401);
      expect(error.name).toBe("AuthenticationError");
    });

    it("should create error with custom message", () => {
      const error = new AuthenticationError("Custom auth error");

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe("Custom auth error");
      expect(error.status).toBe(401);
      expect(error.name).toBe("AuthenticationError");
    });

    it("should have correct inheritance chain", () => {
      const error = new AuthenticationError();

      expect(error instanceof AuthenticationError).toBe(true);
      expect(error instanceof OpenRouterError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("RateLimitError", () => {
    it("should create error with default message and status", () => {
      const error = new RateLimitError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toBe("Rate limit exceeded");
      expect(error.status).toBe(429);
      expect(error.name).toBe("RateLimitError");
    });

    it("should create error with custom message", () => {
      const error = new RateLimitError("Custom rate limit error");

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toBe("Custom rate limit error");
      expect(error.status).toBe(429);
      expect(error.name).toBe("RateLimitError");
    });

    it("should have correct inheritance chain", () => {
      const error = new RateLimitError();

      expect(error instanceof RateLimitError).toBe(true);
      expect(error instanceof OpenRouterError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("InvalidRequestError", () => {
    it("should create error with custom message and status 400", () => {
      const error = new InvalidRequestError("Invalid request data");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(InvalidRequestError);
      expect(error.message).toBe("Invalid request data");
      expect(error.status).toBe(400);
      expect(error.name).toBe("InvalidRequestError");
    });

    it("should create error with empty message", () => {
      const error = new InvalidRequestError("");

      expect(error).toBeInstanceOf(InvalidRequestError);
      expect(error.message).toBe("");
      expect(error.status).toBe(400);
      expect(error.name).toBe("InvalidRequestError");
    });

    it("should have correct inheritance chain", () => {
      const error = new InvalidRequestError("test");

      expect(error instanceof InvalidRequestError).toBe(true);
      expect(error instanceof OpenRouterError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("ServerError", () => {
    it("should create error with custom message and status", () => {
      const error = new ServerError("Internal server error", 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe("Internal server error");
      expect(error.status).toBe(500);
      expect(error.name).toBe("ServerError");
    });

    it("should create error with different status codes", () => {
      const error502 = new ServerError("Bad Gateway", 502);
      const error503 = new ServerError("Service Unavailable", 503);

      expect(error502.status).toBe(502);
      expect(error502.message).toBe("Bad Gateway");

      expect(error503.status).toBe(503);
      expect(error503.message).toBe("Service Unavailable");
    });

    it("should handle status codes below 500", () => {
      const error = new ServerError("Custom server error", 418); // I'm a teapot

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe("Custom server error");
      expect(error.status).toBe(418);
      expect(error.name).toBe("ServerError");
    });

    it("should have correct inheritance chain", () => {
      const error = new ServerError("test", 500);

      expect(error instanceof ServerError).toBe(true);
      expect(error instanceof OpenRouterError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("Error Throwing", () => {
    it("should be throwable as Error", () => {
      const error = new OpenRouterError("Test error");

      expect(() => {
        throw error;
      }).toThrow(OpenRouterError);
      expect(() => {
        throw error;
      }).toThrow("Test error");
    });

    it("should be throwable as specific error types", () => {
      expect(() => {
        throw new AuthenticationError();
      }).toThrow(AuthenticationError);

      expect(() => {
        throw new RateLimitError();
      }).toThrow(RateLimitError);

      expect(() => {
        throw new InvalidRequestError("Bad request");
      }).toThrow(InvalidRequestError);

      expect(() => {
        throw new ServerError("Server error", 500);
      }).toThrow(ServerError);
    });

    it("should preserve error properties when thrown", () => {
      try {
        throw new AuthenticationError("Custom auth message");
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect(error).toBeInstanceOf(OpenRouterError);
        expect(error).toBeInstanceOf(Error);
        const authError = error as AuthenticationError;
        expect(authError.message).toBe("Custom auth message");
        expect(authError.status).toBe(401);
        expect(authError.name).toBe("AuthenticationError");
      }
    });
  });

  describe("Error Stack Traces", () => {
    it("should have stack trace", () => {
      const error = new OpenRouterError("Test error");

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack).toContain("OpenRouterError");
    });

    it("should have stack trace for all error types", () => {
      const errors = [
        new OpenRouterError("test"),
        new AuthenticationError(),
        new RateLimitError(),
        new InvalidRequestError("test"),
        new ServerError("test", 500),
      ];

      errors.forEach((error) => {
        expect(error.stack).toBeDefined();
        expect(typeof error.stack).toBe("string");
      });
    });
  });
});
