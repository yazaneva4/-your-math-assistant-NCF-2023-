import "./globals.css";

export const metadata = {
  title: "Your Math Assistant — NCF 2023",
  description:
    "A chapter-by-chapter AI maths tutor for Grade 4, aligned to India's NCF 2023 primary maths textbooks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
