import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "ADMIN" | "MANAGER" | "WORKER";
    };
  }
  interface User {
    id: string;
    role: "ADMIN" | "MANAGER" | "WORKER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "MANAGER" | "WORKER";
  }
}
