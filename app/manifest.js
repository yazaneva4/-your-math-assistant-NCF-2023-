export default function manifest() {
  return {
    name: "Your Math Assistant — NCF 2023",
    short_name: "Math Assistant",
    description:
      "A chapter-by-chapter AI maths tutor for Grade 4, aligned to India's NCF 2023 primary maths textbooks.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF3E3",
    theme_color: "#1B2A4A",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
