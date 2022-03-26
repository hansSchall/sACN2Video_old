"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reboot = exports.getPingInterval = exports.setPingInterval = exports.rebootReq = void 0;
const uuid_1 = require("uuid");
function rebootReq(out) {
    if (list.has(out)) {
        return list.get(out);
    }
    else {
        return reboot(out);
    }
}
exports.rebootReq = rebootReq;
let interval = 1000;
function setPingInterval(int) {
    interval = int;
}
exports.setPingInterval = setPingInterval;
function getPingInterval() {
    return interval;
}
exports.getPingInterval = getPingInterval;
const list = new Map();
function reboot(out) {
    let id = (0, uuid_1.v4)();
    list.set(out, id);
    return id;
}
exports.reboot = reboot;
//# sourceMappingURL=reboot.js.map