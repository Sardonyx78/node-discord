"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = async ({ d }, bot) => {
    var _a;
    const { user_id: userId } = d;
    const handlersUtils = new utils_1.ReactionHandlersUtils(bot, d);
    const { emoji } = handlersUtils;
    const message = await handlersUtils.getMessage();
    const { id } = emoji;
    // Validates that the reaction is cached
    if (!message.reactions.cache.has(id))
        return;
    const reaction = message.reactions.cache.get(id);
    const user = reaction.users.cache.get(userId);
    const member = reaction.members.get(userId);
    // Change the reaction's botReacted state
    reaction.botReacted = userId === ((_a = bot.user) === null || _a === void 0 ? void 0 : _a.id);
    // Decrements the count of the reaction
    reaction.count--;
    if (reaction.count > 0) {
        // Removes the user from the Collection of users who reacted with this reaction
        if (user) {
            reaction.users.cache.delete(user.id);
        }
        // Removes the member from the Collection of members who reacted with this reaction
        if (member) {
            reaction.members.delete(member.id);
        }
    }
    else {
        // Terminate the reaction completely from the message cached reactions
        message.reactions.cache.delete(id);
    }
    bot.events.emit(constants_1.BotEvent.MessageReactionRemove, reaction, member || user);
};
