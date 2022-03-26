import { v4 } from "uuid";

export function rebootReq(out: string) {
    if (list.has(out)) {
        return list.get(out);
    } else {
        return reboot(out);
    }
}
let interval = 1000;
export function setPingInterval(int: number) {
    interval = int;
}
export function getPingInterval() {
    return interval;
}
const list = new Map<string, string>();
export function reboot(out: string) {
    let id = v4();
    list.set(out, id);
    return id;
}