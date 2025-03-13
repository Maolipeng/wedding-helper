import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>婚礼助手</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}