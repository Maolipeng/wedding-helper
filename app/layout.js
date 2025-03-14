import "./globals.css";
import { ToastProvider } from "./components/ui/Toast";

export const metadata = {
  title: '婚礼助手',
  description: '帮助您规划和管理婚礼流程的智能助手',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh" data-theme="wedding">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ToastProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}