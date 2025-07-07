import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  //覆盖 NextAuth 的默认 UI，使用自定义页面。
  pages: {
    signIn: "/login", //用户将被重定向到我们的自定义登录页面
  },
  callbacks: {
    //中间件触发 authorized 回调  如果路径不在 matcher 范围内，authorized 不会被调用。
    //该函数用于判断用户是否被授权访问特定页面。 (不管是否登录)
    //返回 true（允许访问）或 false/ 重定向（拒绝访问）。
    authorized({ auth, request: { nextUrl } }) {
      // console.log("Auth:", auth);
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      console.log("nextUrl.pathname:",nextUrl.pathname);
      //注意这里的逻辑，登录后只能访问 dashboard，未登录只能访问登录页。
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
