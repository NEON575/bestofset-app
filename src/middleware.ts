export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/invoices/:path*",
    "/customers/:path*",
    "/payments/:path*",
    "/costs/:path*",
    "/inventory/:path*",
    "/purchases/:path*",
    "/debts/:path*",
    "/salaries/:path*",
    "/settings/:path*",
  ],
};
