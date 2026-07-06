export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/production/:path*",
    "/invoices/:path*",
    "/customers/:path*",
    "/payments/:path*",
    "/costs/:path*",
    "/inventory/:path*",
    "/purchases/:path*",
    "/suppliers/:path*",
    "/debts/:path*",
    "/employees/:path*",
    "/salaries/:path*",
    "/settings/:path*",
  ],
};
