/**
 * Site Configuration
 * ------------------
 * Copy this file to personal/site.config.ts and fill in your details.
 * The personal/ directory is gitignored — your personal info stays local.
 */

export const siteConfig = {
  // Page metadata
  title: "Jane Doe | Professional",
  description:
    "Jane Doe - Professional based in New York. Strategy, leadership, and impact.",

  // Hero section
  hero: {
    tagline: "Professional · New York",
    firstName: "Jane",
    lastName: "Doe",
    subtitle:
      "Senior Consultant @ Acme Corp.<br/>Strategy, leadership, and impact.",
    profileImageSrc: "/profile.jpg", // Place your photo at public/profile.jpg
    ctaLabel: "View My Work",
    ctaHref: "#experience",
    secondaryCtaLabel: "Get in Touch",
    secondaryCtaHref: "#connect",
  },

  // About section — each string becomes a <p> tag
  about: [
    "Welcome to my personal website. This is a placeholder for your introduction.",
    "Share your professional background, your current role, and what drives you.",
    "Highlight your key strengths, interests, and the value you bring to your work.",
  ],

  // Connect section
  connect: {
    linkedinUrl: "https://linkedin.com/in/your-profile",
    email: "hello@example.com",
  },
};
