const { createCanvas, registerFont } = require("canvas");
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { text, author, theme = "light", font = "sans", format = "png", color, bg, size = "md" } = req.query;

  // Default quote
  let quoteText = text;
  let quoteAuthor = author;

  // Fetch from Quotable if no custom text
  if (!text) {
    const response = await fetch("https://api.quotable.io/random");
    const data = await response.json();
    quoteText = data.content;
    quoteAuthor = data.author;
  }

  // Theme-based background and text color
  const themes = {
    light: { bg: "#ffffff", color: "#222222" },
    dark: { bg: "#1f1f1f", color: "#ffffff" },
    gradient: { bg: "#d53369", color: "#ffffff" }, // fallback bg color for now
  };

  const selected = themes[theme] || themes.light;
  const bgColor = bg || selected.bg;
  const textColor = color || selected.color;

  // Font size
  const fontSizes = { sm: 16, md: 22, lg: 28, xl: 36 };
  const fontSize = fontSizes[size] || 22;

  // Canvas
  const width = 800;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Text style
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px ${font === "serif" ? "Georgia" : font === "mono" ? "Courier" : "Arial"}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(" ");
    let line = "";
    let lines = [];
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    lines.forEach((l, idx) => ctx.fillText(l.trim(), x, y + idx * lineHeight));
  };

  // Draw quote text
  wrapText(ctx, `"${quoteText}"`, width / 2, height / 3, 700, fontSize + 8);
  ctx.font = `bold ${fontSize - 4}px Arial`;
  ctx.fillText(`— ${quoteAuthor}`, width / 2, height - 50);

  // Output
  if (format === "svg") {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bgColor}" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="${textColor}">${quoteText}</text></svg>`);
  }

  res.setHeader("Content-Type", "image/png");
  canvas.createPNGStream().pipe(res);
};