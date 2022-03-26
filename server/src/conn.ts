import { WebSocket } from "ws";
export function addConn(ws: WebSocket) {
    connections.add(new Connection(ws));
}
export function removeConn(ws: WebSocket) {
    connections.forEach(_ => _.ws == ws ? connections.delete(_) : undefined);
}

export class Connection {
    constructor(readonly ws: WebSocket) {
        ws.on("message", (data_) => {
            const data = JSON.parse(data_.toString());
            if (data.type == "add-addr") {
                this.needed.add(parseInt(data.addr));
            } else if (data.type == "clear") {
                clear();
            }
        })
        // clear();
    }
    private needed = new Set<number>();
    need(addr: number): boolean {
        return this.needed.has(addr);
    }

    update(addr: number, value: number) {
        this.ws.send("#" + addr + "=" + value);
    }
}
const buffer = new Map<number, number>();
const connections = new Set<Connection>();
export function update(addr: number, value: number) {
    if (!addr || (!value && value !== 0)) return;
    if (buffer.get(addr) != value) {
        changed(addr, value);
    }
}
function changed(addr: number, value: number) {
    buffer.set(addr, value);
    connections.forEach(con => con.need(addr) ? con.update(addr, value) : void 0);
}
function clear() {
    buffer.clear();
    setImmediate(() => setTimeout(clear, 5000));
}
clear();