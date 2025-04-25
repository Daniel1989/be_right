export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>错题宝 - 失败是成功之母</title>
        <meta name="description" content="Spaced repetition app for reviewing and mastering academic errors" />
      </head>
      <body>{children}</body>
    </html>
  );
}
