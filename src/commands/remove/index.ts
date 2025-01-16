import { Context } from 'telegraf';
import alchemy from '../../config/alchemy-client.js';
import listenWallet from '../../config/listen-wallet.js';
import { Wallet } from '../../schemas/wallet-schema.js';

const remove = () => async (ctx: Context) => {
	if (!ctx.message) {
		return;
	}

	// @ts-ignore
	const message = ctx.message.text;
	const messages = message.split(' ');

	if (messages.length < 2) {
		return ctx.reply(
			'Please provide a wallet address to remove. Usage: /remove wallet_address',
		);
	}

	const walletAddress = messages[1];

	try {
		const result = await Wallet.updateOne(
			{},
			{ $pull: { wallets: walletAddress } },
			{
				upsert: true,
			}
		)

		const { matchedCount, modifiedCount } = result;

		if (!matchedCount && !modifiedCount) {
			return ctx.reply('Error when removing wallet address. Please try again.');
		}

		const wallet = await Wallet.findOne({});

		alchemy.ws.removeAllListeners();

		if (wallet?.wallets.length === 0) {
			return ctx.reply('Wallet address removed successfully.');
		}

		const addresses = wallet?.wallets.map((address) => {
			return {
				from: address,
			};
		});

		listenWallet(addresses, ctx);

		return ctx.reply('Wallet address removed successfully.');
	} catch (error) {
		console.error(error);
		return ctx.reply(
			'Error refreshing wallet addresses. Please try again later.',
		);
	}
};

export default remove;
