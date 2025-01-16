import { Context } from "telegraf";
import alchemy from "../../config/alchemy-client.js";
import listenWallet from "../../config/listen-wallet.js";
import { Wallet } from "../../schemas/wallet-schema.js";
import { Id } from "../../schemas/id-schema.js";

const start = () => async (ctx: Context) => {
    const id = ctx.chat?.id;

    if (!id) {
        return ctx.reply('Error getting user ID. Please /start again.');
    }

    if (ctx.chat?.type !== 'group' && ctx.chat?.type !== 'supergroup') {
        return ctx.reply('Welcome! Please add me to a group to start using the bot.');
    }

    try {
        const result = await Id.updateOne(
            {},
            { $addToSet: { ids: id } },
            {
                upsert: true,
            }
        )

        const { matchedCount, modifiedCount } = result;

        if (!matchedCount && !modifiedCount) {
            return ctx.reply('Error when starting the bot. Please try again.');
        }

        const ids = await Id.findOne({});
        const wallet = await Wallet.findOne({});

        if (!ids || !wallet) {
            return ctx.reply('Error getting user ID. Please /start again.');
        }

        if (ids.ids.length <= 0 || wallet.wallets.length <= 0) {
            return ctx.reply('Please add a wallet address or start the bot again.');
        }

        alchemy.ws.removeAllListeners();

        const addresses = wallet.wallets.map((address) => {
            return {
                from: address,
            };
        });

        listenWallet(addresses, ctx);

        return ctx.reply('You have already started the bot.');
    } catch (error) {
        console.error(error);
        return ctx.reply('Error starting the bot. Please try again.');
    }
}

export default start;