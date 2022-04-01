const debug = true;
const outName = location.pathname.split("/").filter(a => a).slice(1).join("/");
const encodedOut = encodeURIComponent(outName);
debug && console.log("output:", outName);
const time = debug ? console.time : () => { };
const timeEnd = debug ? console.timeEnd : () => { };
let ws: WebSocket;
window.addEventListener("load", () => {
    $("body").style.backgroundColor = "#FF3a00";
    fetch("/config/" + outName + ".json").then(_ => _.json()).then(value => {
        parseConfig(value);
    })
    ws = new WebSocket("ws://" + location.host + "/ws/sACN");
    ws.addEventListener("message", (ev: MessageEvent<string>) => {
        if (ev.data.startsWith("#")) {
            const [addr, value] = ev.data.substring(1).split("=").map(_ => parseInt(_));
            addrCbs.get(addr)?.(addr, value);
        } else {
            const data = JSON.parse(ev.data);
            if (data.type == "data") {
                const addr = parseInt(data.addr);
                const value = parseInt(data.value);
                addrCbs.get(addr)?.(addr, value);
            }
            debug && console.log(data);
        }
    })
    ws.addEventListener("open", () => {
        wsLoaded = true;
        waitingWSAddrAdds.forEach(addr => {
            ws.send(`{"type": "add-addr","addr": ${addr}}`);
        })
        ws.send(`{"type":"clear"}`);
    })
    debug && console.log(ws);

})

const addrCbs = new Map<number, (addr: number, value: number) => void>();

let wsLoaded = false;

let waitingWSAddrAdds: number[] = [];

function addAddr(addr: number, fn: (addr: number, value: number) => string) {
    addrCbs.set(addr, debug ? (addr: number, value: number) => console.debug(fn(addr, value), value, addr) : fn);
    if (wsLoaded) {
        ws.send(`{"type": "add-addr","addr": ${addr}}`);
    } else {
        waitingWSAddrAdds.push(addr);
    }
}

function parseConfig(data: any) {
    for (let i of data.els) {
        let el: OEl;
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
            })
        }
        els.set(i.id, el);
    }

    $("body").style.backgroundColor = "black";
}

function toSrc(url: string) {
    return "/media/" + url;
}

const els = new Map<string, OEl>();

abstract class OEl {
    constructor(readonly id: string) { }
    public abstract updateParam(param: string, value: number): void;
}
abstract class ODraw extends OEl {
    protected abstract el: HTMLElement;
    protected renderPos(pos: Position) {
        // console.trace("renderPos", this);
        const style = this.el.style;
        style.top = pos.y + "vh";
        style.left = pos.x + "vw";
        style.height = pos.h + "vh";
        style.width = pos.w + "vw";
    }
}
class OImg extends ODraw {
    protected el: HTMLElement;
    constructor(id: string, readonly src: string, readonly defaultPos: Position, options?: any) {
        super(id);
        this.el = $el<HTMLImageElement>("el el-img", "img", "", el => {
            $("#content").appendChild(el);
            el.src = toSrc(this.src);
            el.style.objectFit = options?.pos || "fill";
            debug && console.log(this.p16);
        })
    }
    private p16 = new Pos16Bit(this.renderPos.bind(this), this.defaultPos);
    public updateParam(param: string, value: number): void {
        switch (param) {
            case "opacity":
                this.el.style.opacity = (value / 255).toString(); break;
            default:
                this.p16.switchCase(param, value);
        }
    }
}
type PlayMode = "paused" | "play" | "start play" | "loop" | "start loop"
class OVideo extends ODraw {
    constructor(id: string, readonly src: string, readonly defaultPos: Position, readonly options?: any) {
        super(id);
        this.volume = options?.volume ?? 1;
        debug && console.log(this.volume);
        this.el = $el<HTMLVideoElement>("el el-video", "video", "", el => {
            $("#content").appendChild(el);
            el.src = toSrc(this.src);
            el.volume = this.volume;
            el.muted = !!options?.muted;
        })
    }
    protected el: HTMLVideoElement;
    private p16 = new Pos16Bit(this.renderPos.bind(this), this.defaultPos);
    private prevPlayMode: PlayMode = "paused";
    private playMode: PlayMode = "paused";
    private volume: number = 1;
    private renderPlayMode() {
        if (this.playMode != this.prevPlayMode) {
            if (this.playMode == "paused") {
                this.el.pause();
            } else {
                this.el.play();
                if (this.playMode == "loop" || this.playMode == "start loop") {
                    this.el.loop = true;
                } else {
                    this.el.loop = false;
                }
                if (this.playMode == "start loop" || this.playMode == "start play") {
                    this.el.currentTime = 0;
                }
            }
        }
        this.prevPlayMode = this.playMode;
    }
    public updateParam(param: string, value: number): void {
        switch (param) {
            case "opacity":
                this.el.style.opacity = (value / 255).toString(); break;
            case "volume":
                this.el.volume = (value / 255) * this.volume;
                break;
            case "playMode":
                if (value > 5 && value <= 15) {
                    this.playMode = "paused"; //10
                } else if (value > 15 && value <= 25) {
                    this.playMode = "play"; //20
                } else if (value > 25 && value <= 35) {
                    this.playMode = "start play"; // 30
                } else if (value > 35 && value <= 45) {
                    this.playMode = "loop"; // 40
                } else if (value > 45 && value <= 55) {
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
    constructor(id: string, readonly src: string, readonly options?: any) {
        super(id);
        this.volume = options?.volume || 1;
        this.el = $el<HTMLAudioElement>("el el-audio", "audio", "", el => {
            $("#content").appendChild(el);
            el.src = toSrc(this.src);
            el.volume = this.volume;
            el.muted = !!options?.muted;
        })
    }
    protected el: HTMLAudioElement;
    private prevPlayMode: PlayMode = "paused";
    private playMode: PlayMode = "paused";
    private volume: number = 1;
    private renderPlayMode() {
        if (this.playMode != this.prevPlayMode) {
            if (this.playMode == "paused") {
                this.el.pause();
            } else {
                this.el.play();
                if (this.playMode == "loop" || this.playMode == "start loop") {
                    this.el.loop = true;
                } else {
                    this.el.loop = false;
                }
                if (this.playMode == "start loop" || this.playMode == "start play") {
                    this.el.currentTime = 0;
                }
            }
        }
        this.prevPlayMode = this.playMode;
    }
    public updateParam(param: string, value: number): void {
        switch (param) {
            case "volume":
                this.el.volume = (value / 255) * this.volume;
                break;
            case "playMode":
                if (value > 5 && value <= 15) {
                    this.playMode = "paused"; //10
                } else if (value > 15 && value <= 25) {
                    this.playMode = "play"; //20
                } else if (value > 25 && value <= 35) {
                    this.playMode = "start play"; // 30
                } else if (value > 35 && value <= 45) {
                    this.playMode = "loop"; // 40
                } else if (value > 45 && value <= 55) {
                    this.playMode = "start loop"; // 50
                }
                this.renderPlayMode();
                break;
        }
    }
}
class OColor extends ODraw {
    protected el: HTMLElement;
    constructor(id: string, readonly defaultPos: Position) {
        super(id);
        this.el = $el<HTMLElement>("el el-color", "div", "", el => {
            $("#content").appendChild(el);
        })
    }
    private p16 = new Pos16Bit(this.renderPos.bind(this), this.defaultPos);
    private color: [number, number, number] = [0, 0, 0];
    public updateParam(param: string, value: number): void {
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
    private renderColor() {
        this.el.style.backgroundColor = `rgb(${this.color[0]},${this.color[1]},${this.color[2]})`
    }
}
class Pos16Bit {
    constructor(public renderPos: (pos: Position) => void, defaultPos?: Position) {
        if (!defaultPos) defaultPos = { x: 0, y: 0, h: 100, w: 100 };
        debug && console.log(defaultPos);
        this.xC = ((defaultPos.x || 0) * 2.55);
        this.xF = ((defaultPos.x || 0) * 2.55);
        this.yC = ((defaultPos.y || 0) * 2.55);
        this.yF = ((defaultPos.y || 0) * 2.55);
        this.hC = ((defaultPos.h || 100) * 2.55);
        this.hF = ((defaultPos.h || 100) * 2.55);
        this.wC = ((defaultPos.w || 100) * 2.55);
        this.wF = ((defaultPos.w || 100) * 2.55);
        setTimeout(this.render.bind(this));
    }
    public xC = 0;
    public xF = 0;
    public yC = 0;
    public yF = 0;
    public hC = 0;
    public hF = 0;
    public wC = 0;
    public wF = 0;
    public render() {
        this.renderPos({
            x: ((this.xC * 255) + this.xF) / 652.80,
            y: ((this.yC * 255) + this.yF) / 652.80,
            w: ((this.wC * 255) + this.wF) / 652.80,
            h: ((this.hC * 255) + this.hF) / 652.80,
        })
    }
    public switchCase(par: string, value: number) {
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
            } else {
                rebootToken = value.token.toString();
                rebootInterval = parseInt(value.interval);
            }
        }
    })
}
rebootPing();