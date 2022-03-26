"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.Connection = exports.removeConn = exports.addConn = void 0;
function addConn(ws) {
    connections.add(new Connection(ws));
}
exports.addConn = addConn;
function removeConn(ws) {
    connections.forEach(_ => _.ws == ws ? connections.delete(_) : undefined);
}
exports.removeConn = removeConn;
class Connection {
    constructor(ws) {
        this.ws = ws;
        this.needed = new Set();
        ws.on("message", (data_) => {
            const data = JSON.parse(data_.toString());
            if (data.type == "add-addr") {
                this.needed.add(parseInt(data.addr));
            }
            else if (data.type == "clear") {
                clear();
            }
        });
        // clear();
    }
    need(addr) {
        return this.needed.has(addr);
    }
    update(addr, value) {
        this.ws.send("#" + addr + "=" + value);
    }
}
exports.Connection = Connection;
const buffer = new Map();
const connections = new Set();
function update(addr, value) {
    if (!addr || (!value && value !== 0))
        return;
    if (buffer.get(addr) != value) {
        changed(addr, value);
    }
}
exports.update = update;
function changed(addr, value) {
    buffer.set(addr, value);
    connections.forEach(con => con.need(addr) ? con.update(addr, value) : void 0);
}
function clear() {
    buffer.clear();
    setImmediate(() => setTimeout(clear, 5000));
}
clear();
//# sourceMappingURL=conn.js.map