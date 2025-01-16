import { Telegraf } from 'telegraf';
import createDebug from 'debug';
import { add, list, remove, start, info, count } from './commands/index.js';
import listenWallet from './config/listen-wallet.js';
import { connectDB } from './config/db.js';
import { Wallet } from './schemas/wallet-schema.js';
import { Id } from './schemas/id-schema.js';

const debug = createDebug('bot');

const ENVIRONMENT = process.env.NODE_ENV || '';
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const USERNAME = process.env.USERNAME || '';
const PORT = (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000;
const WEBHOOK_URL = `${process.env.WEBHOOK_URL}/bot${BOT_TOKEN}`;

const bot = new Telegraf(BOT_TOKEN);

bot.telegram.setMyCommands([
    { command: 'add', description: 'Add a wallet address' },
    { command: 'remove', description: 'Remove a wallet address' },
    { command: 'list', description: 'List all wallet addresses' },
    { command: 'info', description: 'Get token holding for wallet address' },
]);

bot.start(start());

bot.command('id', (ctx) => ctx.reply(`Your ID is: ${ctx.chat.id}`));
bot.command('add', add());
bot.command('remove', remove());
bot.command('list', list());
bot.command('info', info());
bot.command('count', count());
bot.command('ls', async (ctx) => {
    const id = await Id.findOne({});

    if (!id?.ids?.length) {
        return ctx.reply('No ids saved yet.');
    }

    return ctx.reply(id.ids.join(', '));
});

const initial = async () => {

    await connectDB();

    const id = await Id.findOne({});
    const wallet = await Wallet.findOne({});

    if (!id?.ids?.length || !wallet?.wallets?.length) {
        return;
    }

    const addresses = wallet.wallets.map((address) => {
        return {
            from: address,
        };
    });

    listenWallet(addresses, bot);
};

const production = () => {
    debug('Bot runs in production mode');
    debug(`${USERNAME} setting webhook: ${WEBHOOK_URL}`);
    bot.telegram.setWebhook(WEBHOOK_URL);
    debug(`${USERNAME} starting webhook on port: ${PORT}`);
    // bot.telegram.startWebhook(`/bot${BOT_TOKEN}`, null, PORT);

    initial();
};

const development = () => {
    debug('Bot runs in development mode');
    debug(`${USERNAME} deleting webhook`);
    bot.telegram.deleteWebhook();
    debug(`${USERNAME} starting polling`);
    bot.launch({ dropPendingUpdates: true });

    initial();
};

ENVIRONMENT === 'production' ? production() : development();
