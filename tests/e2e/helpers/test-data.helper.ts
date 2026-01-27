// Note: For E2E tests, we don't need direct database access in helpers
// All data operations should go through the app's public API

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/**
 * Load test user data from environment variables (.env.test)
 */
export async function loadTestUser(): Promise<TestUser> {
  try {
    const userId = process.env.E2E_USERNAME_ID;
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    return {
      id: userId || "test-user-id",
      email,
      password,
    };
  } catch (error) {
    throw new Error(`Failed to load test user data: ${error}`);
  }
}
