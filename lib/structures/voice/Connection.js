"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const UDPSocket_1 = require("./UDPSocket");
const VoiceWebSocket_1 = require("./VoiceWebSocket");
class Connection {
    constructor(voice) {
        this.sockets = {};
        this.active = false;
        this._endpoint = '';
        this.voice = voice;
    }
    /**
     * The endpoint voice websocket is going to connect
     * @type {string}
     */
    set endpoint(val) {
        if (this._endpoint === val)
            return;
        else {
            this._endpoint = val;
            if (this.sockets.ws) {
                this.sockets.ws.close();
                this.sockets.ws.removeAllListeners();
            }
            if (this.sockets.udp) {
                this.sockets.udp.close();
                this.sockets.udp.removeAllListeners();
            }
            this.active = true;
            this.sockets = {
                ws: new VoiceWebSocket_1.VoiceWebSocket(this),
                udp: new UDPSocket_1.UDPSocket(this),
            };
            this.sockets.ws.open();
        }
    }
    get endpoint() {
        return this._endpoint;
    }
    get PCMOut() {
        return this.sockets.udp.PCMOut;
    }
    get OpusOut() {
        return this.sockets.udp.OpusOut;
    }
}
exports.Connection = Connection;
