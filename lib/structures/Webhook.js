"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhook = exports.WebhookType = void 0;
const User_1 = require("./User");
const base_1 = require("./base");
/**
 * The type of a webhook
 */
var WebhookType;
(function (WebhookType) {
    WebhookType[WebhookType["Incoming"] = 1] = "Incoming";
    WebhookType[WebhookType["ChannelFollower"] = 2] = "ChannelFollower";
})(WebhookType = exports.WebhookType || (exports.WebhookType = {}));
/**
 * Webhooks are a low-effort way to post messages to channels in Discord
 */
class Webhook extends base_1.BaseGuildStruct {
    constructor(bot, webhook, channel) {
        super(bot, channel.guild, webhook);
        this.channel = channel;
        this.init(webhook);
    }
    /**
     * @param {GatewayStruct} webhook The webhook object
     * @returns {this}
     * @ignore
     */
    init(webhook) {
        this.id = webhook.id;
        this.type = webhook.type;
        this.user = new User_1.User(this.bot, webhook.user);
        this.name = webhook.name;
        this.avatarHash = webhook.avatar;
        this.token = webhook.token;
        return this;
    }
    /**
     * Modifies a webhook by its ID
     * @param {ModifyWebhookOptions} options The options for the modified webhook
     * @returns {Promise<Webhook>}
     */
    async modify(options) {
        const webhook = await this.bot.api.modifyWebhook(this.id, options);
        this.update(webhook);
        return webhook;
    }
}
exports.Webhook = Webhook;
