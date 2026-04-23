import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Triad Web",
    short_name: "Triad",
    description: "Responsive web experience for Triad.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7ff",
    theme_color: "#7c4dff",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
