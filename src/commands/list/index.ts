import { Context } from 'telegraf';
import { Wallet } from '../../schemas/wallet-schema.js';

const list = () => async (ctx: Context) => {

  try {
    const wallet = await Wallet.findOne({});

    if (!wallet || wallet.wallets.length === 0) {
      return ctx.reply('No wallet addresses saved yet.');
    }

    const message = `
            Saved Wallet Addresses:

            ${wallet.wallets
        .map((address) => `\`${address}\``)
        .join('\n')}`.replace(/  +/g, '');

    return ctx.reply(message, {
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching the wallet addresses.');
  }
};

export default list;
