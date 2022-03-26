const debug = true;
const outName = location.pathname.split("/").filter(a => a).slice(1).join("/");
const encodedOut = encodeURIComponent(outName);
debug && console.log("output:", outName);
const time = debug ? console.time : () => { };
const timeEnd = debug ? console.timeEnd : () => { };
let ws;
window.addEventListener("load", () => {
    $("body").style.backgroundColor = "#FF3a00";
    debug && console.time("fetch");
    fetch("/config/" + outName + ".json").then(_ => _.json()).then(value => {
        debug && console.timeEnd("fetch");
        parseConfig(value);
    });
    ws = new WebSocket("ws://" + location.host + "/ws/sACN");
    ws.addEventListener("message", (ev) => {
        if (ev.data.startsWith("#")) {
            const [addr, value] = ev.data.substring(1).split("=").map(_ => parseInt(_));
            addrCbs.get(addr)?.(addr, value);
        }
        else {
            const data = JSON.parse(ev.data);
            if (data.type == "data") {
                const addr = parseInt(data.addr);
                const value = parseInt(data.value);
                addrCbs.get(addr)?.(addr, value);
            }
            debug && console.log(data);
        }
    });
    ws.addEventListener("open", () => {
        wsLoaded = true;
        waitingWSAddrAdds.forEach(addr => {
            ws.send(`{"type": "add-addr","addr": ${addr}}`);
        });
        ws.send(`{"type":"clear"}`);
    });
    console.log(ws);
});
const addrCbs = new Map();
let wsLoaded = false;
let waitingWSAddrAdds = [];
function addAddr(addr, fn) {
    addrCbs.set(addr, debug ? (addr, value) => console.debug(fn(addr, value), value, addr) : fn);
    if (wsLoaded) {
        ws.send(`{"type": "add-addr","addr": ${addr}}`);
    }
    else {
        waitingWSAddrAdds.push(addr);
    }
}
function parseConfig(data) {
    for (let i of data.els) {
        let el;
        switch (i.type) {
            case "img":
                el = new OImg(i.id, i.src, i.position, i?.options);
                break;
            case "color":
                el = new OColor(i.id, i.position);
                break;
            case "video":
                el = new OVideo(i.id, i.src, i.position, i?.options);
                break;
            case "audio":
                el = new OAudio(i.id, i.src, i?.options);
                break;
            default:
                continue;
        }
        for (let par in i.map) {
            addAddr(i.map[par], (addr, value) => {
                el.updateParam(par, value);
                return par;
            });
        }
        els.set(i.id, el);
    }
    $("body").style.backgroundColor = "black";
}
function toSrc(url) {
    return "/media/" + url;
}
const els = new Map();
class OEl {
    constructor(id) {
        this.id = id;
    }
}
class ODraw extends OEl {
    renderPos(pos) {
        // console.trace("renderPos", this);
        const style = this.el.style;
        style.top = pos.y + "vh";
        style.left = pos.x + "vw";
        style.height = pos.h + "vh";
        style.width = pos.w + "vw";
    }
}
class OImg extends ODraw {
    constructor(id, src, defaultPos, options) {
        super(id);
        this.src = src;
        this.defaultPos = defaultPos;
        this.p16 = new Pos16Bit(this.renderPos.bind(this), this.defaultPos);
        this.el = $el("el el-img", "img", "", el => {
            $("#content").appendChild(el);
            el.src = toSrc(this.src);
            el.style.objectFit = options?.pos || "fill";
            console.log(this.p16);
        });
    }
    updateParam(param, value) {
        switch (param) {
            case "opacity":
                this.el.style.opacity = (value / 255).toString();
                break;
            default:
                this.p16.switchCase(param, value);
        }
    }
}
class OVideo extends ODraw {
    constructor(id, src, defaultPos, options) {
        super(id);
        this.src = src;
        this.defaultPos = defaultPos;
        this.options = options;
        this.p16 = new Pos16Bit(this.renderPos.bind(this), this.defaultPos);
        this.prevPlayMode = "paused";
        this.playMode = "paused";
        this.volume = 1;
        this.volume = options?.volume ?? 1;
        console.log(this.volume);
        this.el = $el("el el-video", "video", "", el => {
            $("#content").appendChild(el);
            el.src = toSrc(this.src);
            el.volume = this.volume;
            el.muted = !!options?.muted;
        });
    }
    renderPlayMode() {
        if (this.playMode != this.prevPlayMode) {
            if (this.playMode == "paused") {
                this.el.pause();
            }
            else {
                this.el.play();
                if (this.playMode == "loop" || this.playMode == "start loop") {
                    this.el.loop = true;
                }
                else {
                    this.el.loop = false;
                }
                if (this.playMode == "start loop" || this.playMode == "start play") {
                    this.el.currentTime = 0;
                }
            }
        }
        this.prevPlayMode = this.playMode;
    }
    updateParam(param, value) {
        switch (param) {
            case "opacity":
                this.el.style.opacity = (value / 255).toString();
                break;
            case "volume":
                this.el.volume = (value / 255) * this.volume;
                break;
            case "playMode":
                if (value > 5 && value <= 15) {
                    this.playMode = "paused"; //10
                }
                else if (value > 15 && value <= 25) {
                    this.playMode = "play"; //20
                }
                else if (value > 25 && value <= 35) {
                    this.playMode = "start play"; // 30
                }
                else if (value > 35 && value <= 45) {
                    this.playMode = "loop"; // 40
                }
                else if (value > 45 && value <= 55) {
                    this.playMode = "start loop"; // 50
                }
                this.renderPlayMode();
                break;
            default:
                this.p16.switchCase(param, value);
        }
    }
}
class OAudio extends OEl {
    constructor(id, src, options) {
        super(id);
        this.src = src;
        this.options = options;
        this.prevPlayMode = "paused";
        this.playMode = "paused";
        this.volume = 1;
        this.volume = options?.volume || 1;
        this.el = $el("el el-audio", "audio", "", el => {
            $("#content").appendChild(el);
            el.src = toSrc(this.src);
            el.volume = this.volume;
            el.muted = !!options?.muted;
        });
    }
    renderPlayMode() {
        if (this.playMode != this.prevPlayMode) {
            if (this.playMode == "paused") {
                this.el.pause();
            }
            else {
                this.el.play();
                if (this.playMode == "loop" || this.playMode == "start loop") {
                    this.el.loop = true;
                }
                else {
                    this.el.loop = false;
                }
                if (this.playMode == "start loop" || this.playMode == "start play") {
                    this.el.currentTime = 0;
                }
            }
        }
        this.prevPlayMode = this.playMode;
    }
    updateParam(param, value) {
        switch (param) {
            case "volume":
                this.el.volume = (value / 255) * this.volume;
                break;
            case "playMode":
                if (value > 5 && value <= 15) {
                    this.playMode = "paused"; //10
                }
                else if (value > 15 && value <= 25) {
                    this.playMode = "play"; //20
                }
                else if (value > 25 && value <= 35) {
                    this.playMode = "start play"; // 30
                }
                else if (value > 35 && value <= 45) {
                    this.playMode = "loop"; // 40
                }
                else if (value > 45 && value <= 55) {
                    this.playMode = "start loop"; // 50
                }
                this.renderPlayMode();
                break;
        }
    }
}
class OColor extends ODraw {
    constructor(id, defaultPos) {
        super(id);
        this.defaultPos = defaultPos;
        this.p16 = new Pos16Bit(this.renderPos.bind(this), this.defaultPos);
        this.color = [0, 0, 0];
        this.el = $el("el el-color", "div", "", el => {
            $("#content").appendChild(el);
        });
    }
    updateParam(param, value) {
        switch (param) {
            case "opacity":
                this.el.style.opacity = (value / 255).toString();
                break;
            case "r":
                this.color[0] = value;
                this.renderColor();
                break;
            case "g":
                this.color[1] = value;
                this.renderColor();
                break;
            case "b":
                this.color[2] = value;
                this.renderColor();
                break;
            default:
                this.p16.switchCase(param, value);
        }
    }
    renderColor() {
        this.el.style.backgroundColor = `rgb(${this.color[0]},${this.color[1]},${this.color[2]})`;
    }
}
class Pos16Bit {
    constructor(renderPos, defaultPos) {
        this.renderPos = renderPos;
        this.xC = 0;
        this.xF = 0;
        this.yC = 0;
        this.yF = 0;
        this.hC = 0;
        this.hF = 0;
        this.wC = 0;
        this.wF = 0;
        if (!defaultPos)
            defaultPos = { x: 0, y: 0, h: 100, w: 100 };
        console.log(defaultPos);
        this.xC = ((defaultPos.x || 0) * 2.55);
        this.xF = ((defaultPos.x || 0) * 2.55);
        this.yC = ((defaultPos.y || 0) * 2.55);
        this.yF = ((defaultPos.y || 0) * 2.55);
        this.hC = ((defaultPos.h || 100) * 2.55);
        this.hF = ((defaultPos.h || 100) * 2.55);
        this.wC = ((defaultPos.w || 100) * 2.55);
        this.wF = ((defaultPos.w || 100) * 2.55);
        console.log("pos16 constructor");
        setTimeout(this.render.bind(this));
    }
    render() {
        this.renderPos({
            x: ((this.xC * 255) + this.xF) / 652.80,
            y: ((this.yC * 255) + this.yF) / 652.80,
            w: ((this.wC * 255) + this.wF) / 652.80,
            h: ((this.hC * 255) + this.hF) / 652.80,
        });
    }
    switchCase(par, value) {
        switch (par) {
            case "x":
                this.xC = value;
                this.xF = value;
                break;
            case "y":
                this.yC = value;
                this.yF = value;
                break;
            case "h":
                this.hC = value;
                this.hF = value;
                break;
            case "w":
                this.wC = value;
                this.wF = value;
                break;
            case "xC":
                this.xC = value;
                break;
            case "xF":
                this.xF = value;
                break;
            case "yC":
                this.yC = value;
                break;
            case "yF":
                this.yF = value;
                break;
            case "hC":
                this.hC = value;
                break;
            case "hF":
                this.hF = value;
                break;
            case "wC":
                this.wC = value;
                break;
            case "wF":
                this.wF = value;
                break;
            default:
                return;
        }
        this.render();
    }
}
let rebootToken = "";
let rebootInterval = 2000;
function rebootPing() {
    requestAnimationFrame(() => setTimeout(rebootPing, rebootInterval));
    fetch("/api/reboot/" + encodedOut).then(_ => _.ok ? _.json() : false).then(value => {
        if (value) {
            if (rebootToken && value.token && rebootToken != value.token) {
                location.reload();
            }
            else {
                rebootToken = value.token.toString();
                rebootInterval = parseInt(value.interval);
            }
        }
    });
}
rebootPing();
//# sourceMappingURL=output.js.map