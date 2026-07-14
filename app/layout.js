import "./globals.css";

export const metadata = {
  title: "Your Math Assistant — NCF 2023",
  description:
    "A chapter-by-chapter AI maths tutor for Grade 4, aligned to India's NCF 2023 primary maths textbooks.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Math Assistant",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1B2A4A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
