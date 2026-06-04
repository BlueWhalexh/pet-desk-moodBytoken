// Mock implementation of @clerk/nextjs/server for PETDEX_MOCK=1. The
// next.config.ts webpack alias swaps the real package for this file in
// mock mode so contributors don't need a Clerk publishable key to boot.
// Every export here mirrors the shape used in petdex's source — adding
// new Clerk APIs requires extending this file.

import { MOCK_USER } from "./index";

type AuthResult = {
  userId: string | null;
  sessionId: string | null;
  sessionClaims: Record<string, unknown> | null;
  orgId: string | null;
  orgRole: string | null;
  redirectToSignIn: () => never;
  protect: () => Promise<void>;
};

function mockAuthResult(): AuthResult {
  return {
    userId: MOCK_USER.userId,
    sessionId: "sess_mock",
    sessionClaims: { sub: MOCK_USER.userId, email: MOCK_USER.email },
    orgId: null,
    orgRole: null,
    redirectToSignIn: () => {
      throw new Error("[mock] redirectToSignIn called");
    },
    protect: async () => {
      /* mock user is always signed in */
    },
  };
}

export async function auth(): Promise<AuthResult> {
  return mockAuthResult();
}

export async function currentUser() {
  return {
    id: MOCK_USER.userId,
    emailAddresses: [
      {
        id: "email_mock",
        emailAddress: MOCK_USER.email,
        verification: { status: "verified" },
      },
    ],
    primaryEmailAddressId: "email_mock",
    username: MOCK_USER.username,
    firstName: MOCK_USER.firstName,
    lastName: MOCK_USER.lastName,
    imageUrl: MOCK_USER.imageUrl ?? "",
    publicMetadata: {} as Record<string, unknown>,
    privateMetadata: {} as Record<string, unknown>,
    externalAccounts: [] as Array<unknown>,
  };
}

export async function clerkClient() {
  return {
    users: {
      getUser: async (_id: string) => currentUser(),
      getUserList: async () => ({ data: [] as unknown[], totalCount: 0 }),
      updateUserMetadata: async () => undefined,
    },
  };
}

// Middleware shim. The real clerkMiddleware wraps the request and exposes
// `auth.protect()` callbacks. In mock mode the user is always signed in so
// protected routes pass through untouched.
type MiddlewareHandler = (
  authObj: {
    protect: () => Promise<void>;
    userId: string;
  },
  req: Request,
) => Promise<Response | undefined> | Response | undefined;

export function clerkMiddleware(handler: MiddlewareHandler) {
  return async (req: Request) => {
    const authObj = {
      protect: async () => {
        /* always passes in mock */
      },
      userId: MOCK_USER.userId,
    };
    return handler(authObj, req);
  };
}

export function createRouteMatcher(_patterns: string[]) {
  // Mock matcher always returns false so nothing prompts a sign-in. The
  // real logic isn't needed because clerkMiddleware itself is a no-op
  // wrapper above.
  return (_req: Request) => false;
}
