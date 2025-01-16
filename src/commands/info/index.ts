import { Context } from 'telegraf';
import { escapers } from '@telegraf/entity';
import alchemy from '../../config/alchemy-client.js';

const info = () => async (ctx: Context) => {
    if (!ctx.message) {
        return;
    }

    // @ts-ignore
    const message = ctx.message.text;
    const messages = message.split(' ');

    if (messages.length < 2) {
        return ctx.reply(
            'Please provide a wallet address to get info. Usage: /info wallet_address',
        );
    }

    const walletAddress = messages[1];

    try {
        const tokenBalance = await getTokenBalance(
            walletAddress,
            '0x716457d3Ee671231e3a9fd320940E88aC247a733',
        );

        return ctx.reply(
            `\`${walletAddress}\` has *${escapers.MarkdownV2(tokenBalance)}*`,
            {
                parse_mode: 'MarkdownV2',
            },
        );
    } catch (error) {
        console.error(error);
        return ctx.reply('Error reading wallet addresses. Please try again later.');
    }
};

async function getTokenBalance(
    walletAddress: string,
    tokenAddress: string,
): Promise<string> {
    try {
        const [tokenBalance, tokenInfo] = await Promise.all([
            alchemy.core.getTokenBalances(walletAddress, [tokenAddress]),
            alchemy.core.getTokenMetadata(tokenAddress),
        ]);

        const response = tokenBalance.tokenBalances[0];

        if (response.tokenBalance === null) {
            throw 'Token balance not found';
        }

        const rawBalance = BigInt(response.tokenBalance);
        const readableBalance =
            Number(rawBalance) / Math.pow(10, tokenInfo.decimals || 18);

        return `${readableBalance.toLocaleString('en-US')} ${tokenInfo.symbol}`;
    } catch (error: unknown) {
        console.error(error);
        throw `Error getting token balance.`;
    }
}

export default info;
