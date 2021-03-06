"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceWebSocket = exports.VOICE_OPCODES = void 0;
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
const VoiceHeartbeats_1 = require("./VoiceHeartbeats");
var VOICE_OPCODES;
(function (VOICE_OPCODES) {
    VOICE_OPCODES[VOICE_OPCODES["IDENTIFY"] = 0] = "IDENTIFY";
    VOICE_OPCODES[VOICE_OPCODES["SELECT_PROTOCOL"] = 1] = "SELECT_PROTOCOL";
    VOICE_OPCODES[VOICE_OPCODES["READY"] = 2] = "READY";
    VOICE_OPCODES[VOICE_OPCODES["HEARTBEAT"] = 3] = "HEARTBEAT";
    VOICE_OPCODES[VOICE_OPCODES["SESSION_DESCRIPTION"] = 4] = "SESSION_DESCRIPTION";
    VOICE_OPCODES[VOICE_OPCODES["SPEAKING"] = 5] = "SPEAKING";
    VOICE_OPCODES[VOICE_OPCODES["HEARTBEAT_ACK"] = 6] = "HEARTBEAT_ACK";
    VOICE_OPCODES[VOICE_OPCODES["RESUME"] = 7] = "RESUME";
    VOICE_OPCODES[VOICE_OPCODES["HELLO"] = 8] = "HELLO";
    VOICE_OPCODES[VOICE_OPCODES["RESUMED"] = 9] = "RESUMED";
    VOICE_OPCODES[VOICE_OPCODES["DISCONNECT"] = 13] = "DISCONNECT";
})(VOICE_OPCODES = exports.VOICE_OPCODES || (exports.VOICE_OPCODES = {}));
class VoiceWebSocket extends events_1.EventEmitter {
    constructor(connection) {
        super();
        this.connection = connection;
    }
    open() {
        if (!this.connection.endpoint)
            throw new Error('A voice gateway connection was tried to be established before endpoint declaration.');
        this.ws = new ws_1.default(`wss://${this.connection.endpoint.split(':')[0]}/?v=4`);
        this.ws.on('message', this.onMessage.bind(this));
        this.hearbeat = new VoiceHeartbeats_1.VoiceHeartbeats(this);
    }
    async onMessage(data) {
        var _a;
        const message = JSON.parse(data);
        this.sequnce = message.s;
        this.connection.voice.bot.debug(message.op, VOICE_OPCODES[message.op], 'op - t');
        switch (message.op) {
            case VOICE_OPCODES.HELLO: {
                this.hearbeat.interval.timeout = message.d.heartbeat_interval;
                this.hearbeat.start();
                this.send({
                    op: VOICE_OPCODES.IDENTIFY,
                    d: {
                        server_id: this.connection.voice.guild.id,
                        user_id: this.connection.voice.bot.user.id,
                        session_id: (_a = this.connection.voice.guild.voiceStates.get(this.connection.voice.bot.user.id)) === null || _a === void 0 ? void 0 : _a.sessionId,
                        token: this.connection.token,
                    },
                });
                break;
            }
            case VOICE_OPCODES.READY: {
                const ip = await this.connection.sockets.udp.discoverIP({
                    ip: message.d.ip,
                    port: message.d.port,
                    ssrc: message.d.ssrc,
                });
                this.send({
                    op: VOICE_OPCODES.SELECT_PROTOCOL,
                    d: {
                        protocol: 'udp',
                        data: {
                            address: ip.ip,
                            port: ip.port,
                            mode: 'xsalsa20_poly1305',
                        },
                    },
                });
                break;
            }
            case VOICE_OPCODES.SESSION_DESCRIPTION: {
                this.connection.sockets.udp.secretKeys = Buffer.from(message.d.secret_key);
                this.connection.sockets.udp.start();
                break;
            }
        }
    }
    send(data) {
        if (this.ws)
            this.ws.send(JSON.stringify(data));
    }
    close() {
        var _a, _b;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
        (_b = this.hearbeat) === null || _b === void 0 ? void 0 : _b.stopHeartbeat();
    }
}
exports.VoiceWebSocket = VoiceWebSocket;
