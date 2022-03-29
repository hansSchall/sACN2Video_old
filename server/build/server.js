"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("colors");
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const path_1 = require("path");
const sacn_1 = require("sacn");
const config_js_1 = require("./src/config.js");
const conn_js_1 = require("./src/conn.js");
const reboot_js_1 = require("./src/reboot.js");
const app = (0, express_1.default)();
const ws = (0, express_ws_1.default)(app);
app.use(express_1.default.json());
app.use(express_1.default.raw());
app.use("/media", express_1.default.static((0, path_1.join)(__dirname, "../", config_js_1.config.assetsDir)));
app.use("/config", express_1.default.static((0, path_1.join)(__dirname, "../", config_js_1.config.dataDir)));
app.use("/hmi", express_1.default.static((0, path_1.join)(__dirname, "../../client/hmi"), {
    index: ["index.html", "hmi.html"]
}));
app.use("/hmi/:id", (req, res) => {
    res.sendFile((0, path_1.join)(__dirname, "../../client/hmi/hmi.html"));
});
app.use("/out/:id", (req, res) => {
    res.sendFile((0, path_1.join)(__dirname, "../../client/output/output.html"));
});
app.use("/static/", express_1.default.static((0, path_1.join)(__dirname, "../../client/static")));
app.get("/api/reboot/:out", (req, res) => {
    res.json({
        token: (0, reboot_js_1.rebootReq)(req.params.out || ""),
        interval: config_js_1.config.rebootInterval,
    });
});
app.get("/reboot/:out", (req, res) => {
    (0, reboot_js_1.reboot)(req.params.out);
    res.status(204).end();
});
ws.app.ws("/ws/sACN", (ws, req) => {
    ws.on("close", () => {
        (0, conn_js_1.removeConn)(ws);
    });
    (0, conn_js_1.addConn)(ws);
});
if (config_js_1.config.http)
    app.listen(config_js_1.config.http.port, () => {
        console.log(("[HTTP] listening on port " + config_js_1.config.http.port).green);
    });
else
    console.warn("[WARN] No HTTP config / HTTP disabled\n > add http section in config.ts".yellow);
if (config_js_1.config.sACN) {
    const sACN = new sacn_1.Receiver({
        universes: config_js_1.config.sACN.universes,
        reuseAddr: true,
        iface: config_js_1.config.sACN.iface
    });
    sACN.on("error", console.error);
    sACN.on("packet", pkg => {
        const univOffset = (pkg.universe - 1) * 512;
        const values = new Array(512);
        values.fill(0);
        for (let i in pkg.payload) {
            values[parseInt(i) - 1] = Math.round(pkg.payload[i] * 2.55);
        }
        values.forEach((value, addr) => {
            (0, conn_js_1.update)(univOffset + addr + 1, value);
        });
    });
    sACN.on("PacketCorruption", console.error);
    sACN.on("PacketOutOfOrder", console.error);
    console.log(("[sACN] universes: " + sACN.universes.join(",")).green);
}
else {
    console.warn("[WARN] No sACN config / sACN disabled".yellow);
}
//# sourceMappingURL=server.js.map