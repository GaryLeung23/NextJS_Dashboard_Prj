import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
 
// 创建 NextAuth 中间件实例
export default NextAuth(authConfig).auth;
 
// 配置需要应用此中间件的路径
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  //使用 Next.js 中间件保护路由
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};