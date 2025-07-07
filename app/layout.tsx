import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';

//添加额外的页面元数据，添加到<head>中。所有使用 layout.js 的页面都将继承 layout.js 中的元数据。
export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',//%s根据页面title动态替换
    default: 'Acme Dashboard',
  },
  description: 'The official Next.js Course Dashboard, built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
