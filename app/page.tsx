"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type QrMode = "url" | "text" | "wifi" | "vcard";
type WifiEncryption = "WPA" | "WEP" | "nopass";

const modeLabels: Record<QrMode, string> = {
  url: "URL",
  text: "Text",
  wifi: "WiFi",
  vcard: "vCard",
};

const presets = [
  { fg: "#101828", bg: "#fff7ed", name: "Sunrise" },
  { fg: "#155e75", bg: "#ecfeff", name: "Lagoon" },
  { fg: "#6d28d9", bg: "#faf5ff", name: "Neon" },
  { fg: "#166534", bg: "#f0fdf4", name: "Fresh" },
];

function escapeWifi(value: string) {
  return value.replace(/([\\;,":])/g, "\\$1");
}

function buildVCard(fields: {
  name: string;
  phone: string;
  email: string;
  company: string;
  website: string;
}) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fields.name || "New Contact"}`,
    fields.company ? `ORG:${fields.company}` : "",
    fields.phone ? `TEL:${fields.phone}` : "",
    fields.email ? `EMAIL:${fields.email}` : "",
    fields.website ? `URL:${fields.website}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function Home() {
  const [mode, setMode] = useState<QrMode>("url");
  const [url, setUrl] = useState("https://example.com");
  const [text, setText] = useState("Hello from a colorful QR code");
  const [ssid, setSsid] = useState("My WiFi");
  const [password, setPassword] = useState("super-secret");
  const [encryption, setEncryption] = useState<WifiEncryption>("WPA");
  const [hidden, setHidden] = useState(false);
  const [vName, setVName] = useState("Jane Appleseed");
  const [vPhone, setVPhone] = useState("+66 80 000 0000");
  const [vEmail, setVEmail] = useState("jane@example.com");
  const [vCompany, setVCompany] = useState("Vivid Studio");
  const [vWebsite, setVWebsite] = useState("https://example.com");
  const [foreground, setForeground] = useState("#101828");
  const [background, setBackground] = useState("#fff7ed");
  const [frameText, setFrameText] = useState("SCAN ME");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [svgMarkup, setSvgMarkup] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload = useMemo(() => {
    if (mode === "url") return url.trim() || "https://example.com";
    if (mode === "text") return text.trim() || " ";
    if (mode === "wifi") {
      return `WIFI:T:${encryption};S:${escapeWifi(ssid)};P:${escapeWifi(
        password,
      )};H:${hidden ? "true" : "false"};;`;
    }
    return buildVCard({
      name: vName,
      phone: vPhone,
      email: vEmail,
      company: vCompany,
      website: vWebsite,
    });
  }, [
    mode,
    url,
    text,
    encryption,
    ssid,
    password,
    hidden,
    vName,
    vPhone,
    vEmail,
    vCompany,
    vWebsite,
  ]);

  useEffect(() => {
    let active = true;

    async function renderQr() {
      const options = {
        errorCorrectionLevel: "H" as const,
        margin: 1,
        width: 900,
        color: {
          dark: foreground,
          light: background,
        },
      };

      const qrPng = await QRCode.toDataURL(payload, options);
      const qrSvg = await QRCode.toString(payload, {
        ...options,
        type: "svg",
      });

      if (!active) return;
      setQrDataUrl(qrPng);
      setSvgMarkup(qrSvg);
    }

    renderQr();
    return () => {
      active = false;
    };
  }, [payload, foreground, background]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !qrDataUrl) return;

    const image = new Image();
    image.onload = () => {
      const size = 1080;
      const qrSize = 770;
      canvas.width = size;
      canvas.height = size;

      context.fillStyle = background;
      context.fillRect(0, 0, size, size);

      const gradient = context.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, "#ff4d8d");
      gradient.addColorStop(0.45, "#ffd166");
      gradient.addColorStop(1, "#06d6a0");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, 112);
      context.fillRect(0, size - 112, size, 112);

      context.fillStyle = background;
      context.roundRect(88, 148, 904, 784, 34);
      context.fill();
      context.drawImage(image, 155, 171, qrSize, qrSize);

      context.fillStyle = "#ffffff";
      context.font = "700 64px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(frameText || "SCAN ME", size / 2, 56, 920);
      context.fillText(frameText || "SCAN ME", size / 2, size - 56, 920);
    };
    image.src = qrDataUrl;
  }, [qrDataUrl, background, frameText]);

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "vivid-qr-code.png";
    link.click();
  };

  const exportSvg = () => {
    const escapedText = (frameText || "SCAN ME")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const framedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff4d8d"/>
      <stop offset="45%" stop-color="#ffd166"/>
      <stop offset="100%" stop-color="#06d6a0"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="${background}"/>
  <rect width="1080" height="112" fill="url(#frame)"/>
  <rect y="968" width="1080" height="112" fill="url(#frame)"/>
  <rect x="88" y="148" width="904" height="784" rx="34" fill="${background}"/>
  <g transform="translate(155 171) scale(0.8556)">${svgMarkup
    .replace(/<\?xml.*?\?>/g, "")
    .replace(/<svg[^>]*>/, "")
    .replace("</svg>", "")}</g>
  <text x="540" y="58" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#ffffff">${escapedText}</text>
  <text x="540" y="1024" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#ffffff">${escapedText}</text>
</svg>`;
    const blob = new Blob([framedSvg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "vivid-qr-code.svg";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">QR Code Generator</p>
          <h1>Tongjai Yampaka QR Studio</h1>
          <p className="intro">
            พวกเรามาสร้าง QR สำหรับ URL, ข้อความ, WiFi และ vCard พร้อมสีสดใส frame text และ export ได้ทันที
          </p>
        </div>
        <div className="hero-burst" aria-hidden="true" />
      </section>

      <section className="studio">
        <form className="control-panel">
          <div className="section-heading">
            <span>1</span>
            <h2>Content</h2>
          </div>

          <div className="segmented" aria-label="QR content type">
            {(Object.keys(modeLabels) as QrMode[]).map((item) => (
              <button
                key={item}
                type="button"
                className={mode === item ? "active" : ""}
                onClick={() => setMode(item)}
              >
                {modeLabels[item]}
              </button>
            ))}
          </div>

          {mode === "url" && (
            <label className="field">
              <span>URL</span>
              <input value={url} onChange={(event) => setUrl(event.target.value)} />
            </label>
          )}

          {mode === "text" && (
            <label className="field">
              <span>Text</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} />
            </label>
          )}

          {mode === "wifi" && (
            <div className="grid-fields">
              <label className="field">
                <span>Network name</span>
                <input value={ssid} onChange={(event) => setSsid(event.target.value)} />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Security</span>
                <select
                  value={encryption}
                  onChange={(event) => setEncryption(event.target.value as WifiEncryption)}
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No password</option>
                </select>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={hidden}
                  onChange={(event) => setHidden(event.target.checked)}
                />
                <span>Hidden network</span>
              </label>
            </div>
          )}

          {mode === "vcard" && (
            <div className="grid-fields">
              <label className="field">
                <span>Name</span>
                <input value={vName} onChange={(event) => setVName(event.target.value)} />
              </label>
              <label className="field">
                <span>Phone</span>
                <input value={vPhone} onChange={(event) => setVPhone(event.target.value)} />
              </label>
              <label className="field">
                <span>Email</span>
                <input value={vEmail} onChange={(event) => setVEmail(event.target.value)} />
              </label>
              <label className="field">
                <span>Company</span>
                <input
                  value={vCompany}
                  onChange={(event) => setVCompany(event.target.value)}
                />
              </label>
              <label className="field full">
                <span>Website</span>
                <input
                  value={vWebsite}
                  onChange={(event) => setVWebsite(event.target.value)}
                />
              </label>
            </div>
          )}

          <div className="section-heading">
            <span>2</span>
            <h2>Style</h2>
          </div>

          <div className="preset-row">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="preset"
                onClick={() => {
                  setForeground(preset.fg);
                  setBackground(preset.bg);
                }}
              >
                <span style={{ background: preset.fg }} />
                <span style={{ background: preset.bg }} />
                {preset.name}
              </button>
            ))}
          </div>

          <div className="color-grid">
            <label className="color-field">
              <span>Foreground</span>
              <input
                type="color"
                value={foreground}
                onChange={(event) => setForeground(event.target.value)}
              />
            </label>
            <label className="color-field">
              <span>Background</span>
              <input
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Frame text</span>
            <input
              value={frameText}
              maxLength={24}
              onChange={(event) => setFrameText(event.target.value.toUpperCase())}
            />
          </label>
        </form>

        <aside className="preview-panel">
          <div className="preview-toolbar">
            <div>
              <p>Live Preview</p>
              <strong>{modeLabels[mode]}</strong>
            </div>
            <div className="qr-chip">H Error Correction</div>
          </div>

          <div className="canvas-wrap">
            <canvas ref={canvasRef} aria-label="QR code preview" />
          </div>

          <div className="download-row">
            <button type="button" onClick={exportPng}>
              Export PNG
            </button>
            <button type="button" className="secondary" onClick={exportSvg}>
              Export SVG
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
