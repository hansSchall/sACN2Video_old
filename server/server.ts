require("colors");
import colors from "colors";
import express from "express";
import expressWs from "express-ws";
import { join } from "path";
import { Receiver } from "sacn";
import { config } from "./src/config.js";
import { addConn, removeConn, update } from "./src/conn.js";
import { reboot, rebootReq } from "./src/reboot.js";

const app = express();
const ws = expressWs(app);

app.use(express.json());
app.use(express.raw());

app.use("/media", express.static(join(__dirname, "../", config.assetsDir)));
app.use("/config", express.static(join(__dirname, "../", config.dataDir)));

app.use("/hmi", express.static(join(__dirname, "../../client/hmi"), {
    index: ["index.html", "hmi.html"]
}))

app.use("/hmi/:id", (req, res) => {
    res.sendFile(join(__dirname, "../../client/hmi/hmi.html"));
})

app.use("/out/:id", (req, res) => {
    res.sendFile(join(__dirname, "../../client/output/output.html"));
})

app.use("/static/", express.static(join(__dirname, "../../client/static")));

app.get("/api/reboot/:out", (req, res) => {
    res.json({
        token: rebootReq(req.params.out || ""),
        interval: config.rebootInterval,
    })
})

app.get("/reboot/:out", (req, res) => {
    reboot(req.params.out);
    res.status(204).end();
})


ws.app.ws("/ws/sACN", (ws, req) => {
    ws.on("close", () => {
        removeConn(ws);
    })
    addConn(ws);
})

if (config.http) app.listen(config.http.port, () => {
    console.log(("[HTTP] listening on port " + config.http.port).green);
}); else console.warn("[WARN] No HTTP config / HTTP disabled\n > add http section in config.ts".yellow)


if (config.sACN) {
    const sACN = new Receiver({
        universes: config.sACN.universes,
        reuseAddr: true,
        iface: config.sACN.iface
    })
    sACN.on("error", console.error);
    sACN.on("packet", pkg => {
        const univOffset = (pkg.universe - 1) * 512;
        const values = new Array(512);
        values.fill(0);
        for (let i in pkg.payload) {
            values[parseInt(i) - 1] = Math.round(pkg.payload[i] * 2.55);
        }
        values.forEach((value, addr) => {
            update(univOffset + addr + 1, value);
        })
    })
    sACN.on("PacketCorruption", console.error);
    sACN.on("PacketOutOfOrder", console.error);
    console.log(("[sACN] universes: " + sACN.universes.join(",")).green)
} else {
    console.warn("[WARN] No sACN config / sACN disabled".yellow);
}