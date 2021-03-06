"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionUsersController = void 0;
const base_1 = require("../base");
/**
 * Interface for the users that added a reaction identified by its emoji.
 * The users are mapped by their IDs
 */
class ReactionUsersController extends base_1.BaseFetchAllController {
    constructor(reaction) {
        super(reaction);
        this.reaction = reaction;
        this.message = reaction.message;
    }
    /**
     * Fetches all users that reacted with the reaction emoji associated to this controller
     * @param {FetchReactionUsersOptions} options A set of options for this operation
     * @returns {Promise<User[]>}
     */
    async fetchAll(options) {
        const users = await this.bot.api.fetchReactionUsers(this.message.channel.id, this.message.id, this.reaction.id, options);
        this.cache.merge(users);
        if (this.bot.user && users.has(this.bot.user.id)) {
            // The bot reacted to this reaction
            this.reaction.botReacted = true;
        }
        if (this.message.guild) {
            // The message was sent in a guild
            // All users are also members in that guild
            this.reaction.members.merge(users
                .filter(user => this.message.guild.members.cache.has(user.id))
                .map(user => this.message.guild.members.cache.get(user.id)));
        }
        return users;
    }
}
exports.ReactionUsersController = ReactionUsersController;
