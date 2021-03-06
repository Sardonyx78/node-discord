"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotCommunication = void 0;
const events_1 = require("events");
class BotCommunication extends events_1.EventEmitter {
    constructor(bot) {
        super();
        this.bot = bot;
        process.on('message', this.onMessage.bind(this));
    }
    /**
     * Listener function for new messages coming from the parent process
     * @param {ShardEmitCommunicationEventRequest | ShardEmitBotEventRequest<never>} message The message received from the parent process
     * @returns {Promise<void>}
     */
    async onMessage(message) {
        switch (message.action) {
            // Tells the Bot to dispatch an event and return its result
            case "emitCommunicationEvent" /* EmitCommunicationEvent */:
                if (process.send) {
                    const data = await this.emit(message.payload.event);
                    const reply = {
                        payload: {
                            data,
                        },
                        identifier: message.identifier,
                    };
                    process.send(reply);
                }
                break;
            // Tells the Bot to emit an event to BotEvents
            case "emitBotEvent" /* EmitBotEvent */:
                this.bot.events.emit(message.payload.event, ...message.payload.args);
                break;
            // Tells the Bot to disconnect from its current connection
            case "emitDisconnect" /* EmitDisconnect */:
                this.bot.connection.disconnect(message.payload);
                break;
        }
    }
    /**
     * {@link EventEmitter} 'on' override to resolve with the listener's returned value
     * @param {string | symbol} event Event name
     * @param {function(bot: Bot)} listener Callback to be executed when this event is emitted
     * @returns {this}
     */
    on(event, listener) {
        super.on(event, ([resolve, reject]) => {
            try {
                resolve(listener.bind(this)(this.bot));
            }
            catch (err) {
                reject(err);
            }
        });
        return this;
    }
    emit(event, ...args) {
        return new Promise((resolve, reject) => {
            super.emit(event, [resolve, reject], ...args);
        });
    }
    /**
     * Send and receive the data returned from the registered event for each shard
     * @param {string} event The registered event to be emitted
     * @returns {Promise<Serializable[]>}
     */
    async broadcast(event) {
        return new Promise(resolve => {
            const { identifier } = BotCommunication;
            const listener = ({ payload: { event: event, data }, identifier: responseIdentifier, }) => {
                if (event === "broadcastResponses" /* BroadcastResponses */ &&
                    identifier === responseIdentifier &&
                    Array.isArray(data)) {
                    resolve(data);
                }
            };
            process.on('message', listener);
            const request = {
                action: "broadcast" /* Broadcast */,
                payload: event,
                identifier,
            };
            if (process.send) {
                process.send(request);
            }
        });
    }
    /**
     * Send and receive the data returned from the registered event for the shard matching the supplied ID
     * @param {string} event The registered event to be emitted
     * @param {ShardId} shardId The ID of the shard where this event should be emitted
     * @returns {Promise<Serializable>}
     */
    async send(event, shardId) {
        return new Promise(resolve => {
            const { identifier } = BotCommunication;
            const listener = ({ payload: { event, data }, identifier: responseIdentifier, }) => {
                if (event === "sendResponse" /* SendResponse */ &&
                    identifier === responseIdentifier) {
                    resolve(data);
                }
            };
            process.on('message', listener);
            const message = {
                action: "send" /* Send */,
                payload: { event, shardId },
                identifier,
            };
            if (process.send) {
                process.send(message);
            }
        });
    }
    /**
     * Generates a random identifier to provide to cross-shard requests
     * @type {number}
     */
    static get identifier() {
        return Math.random();
    }
}
exports.BotCommunication = BotCommunication;
