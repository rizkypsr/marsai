import { Context } from 'telegraf';
import { DB } from '../../types.js';
import alchemy from '../../config/alchemy-client.js';
import listenWallet from '../../config/listen-wallet.js';
import { Wallet } from '../../schemas/wallet-schema.js';


const add = () => async (ctx: Context) => {
    if (!ctx.message) {
        return;
    }

    // @ts-ignore
    const message = ctx.message.text;
    const messages = message.split(' ');

    if (messages.length < 2) {
        return ctx.reply(
            'Please provide a wallet address to add. Usage: /add wallet_address',
        );
    }

    const walletAddress = messages[1];

    try {
        const result = await Wallet.updateOne(
            {},
            { $addToSet: { wallets: walletAddress } },
            {
                upsert: true,
            }
        )

        const { matchedCount, modifiedCount } = result;

        if (!matchedCount && !modifiedCount) {
            return ctx.reply('Error when adding wallet address. Please try again.');
        }

        const wallet = await Wallet.findOne({});

        alchemy.ws.removeAllListeners();

        const addresses = wallet?.wallets.map((address) => {
            return {
                from: address,
            };
        });

        listenWallet(addresses, ctx);

        return ctx.reply('Wallet address added successfully.');
    } catch (error) {
        console.error(error);
        return ctx.reply(
            'Error refreshing wallet addresses. Please try again later.',
        );
    }
};

export default add;
