const CONFIG = {
  name: "姚圣淇",
  photo: "./img/ysq.jpg",
  music: "./music/blossoms.mp3",

  // ── Theme Colors ──────────────────────────────────────────────
  colors: {
    primary: "#f472b6",           // Main accent color (rose pink)
    accent: "#60a5fa",            // Secondary accent color (sky blue)
    dark: {
      background: "#0f172a",      // Slate 900
      text: "#f1f5f9",            // Slate 100
    },
    light: {
      background: "#fafaf9",      // Stone 50
      text: "#1e293b",            // Slate 800
    },
  },

  // ── Default Color Mode ────────────────────────────────────────
  defaultMode: "light",

  // ── Sections ──────────────────────────────────────────────────
  sections: [
    {
      type: "greeting",
      title: "Hi! 👋",
      subtitle: "Happy Birthday! 🎂",
    },
    {
      type: "countdown",
      from: 3,                    // Countdown from this number
      goText: "🎉 Surprise!",              // Text shown after countdown ends
    },
    {
      type: "announcement",
      text: "Today is all about celebrating YOU! ✨",
    },
    {
      type: "chatbox",
      message:
        "Happy birthday to you, Shengqi! Wishing you a fantastic year ahead filled with continuous growth, joy, peace, and endless possibilities!",
      buttonText: "Send Blessings 💌",
    },
    {
      type: "ideas",
      lines: [
        "Instead of just sending a regular greeting...",
        "I thought it would be nice to make something a bit more <strong>special</strong>.",
        "A interactive little webpage...",
        "To celebrate your special day!",
        "Hope this brings a smile to your birthday <span>:)</span>",
      ],
      bigLetters: "CHEERS!",
    },
    {
      type: "stars",
      count: 25,
    },
    {
      type: "quote",
      text: "The more you praise and celebrate your life, the more there is in life to celebrate.",
      author: "Oprah Winfrey",
    },
    {
      type: "stars",
      count: 40,
    },
    {
      type: "balloons",
      count: 35,
    },
    {
      type: "profile",
      wishTitle: "Happy Birthday!",
      wishText: "May the year ahead bring you exciting opportunities, vibrant health, and great success in all your endeavors!",
    },
    {
      type: "fireworks",
      count: 60,
    },
    {
      type: "confetti",
      count: 36,
    },
    {
      type: "closing",
      text: "Hope you enjoy this birthday greeting!",
      ack: [
      "Authorship: <strong>Fajar Ghifari Nugroho</strong>",
      "Adapted by: <strong>Beining Du</strong>",
      "BGM: <strong>Blossoms</strong> by Eric Chiryoku",
      "Special thanks to <strong>Sam</strong>!"
    ],
      replayText: "Or click, if you want to watch it again.",
    },
  ],
};
