import { AlchemySubscription } from 'alchemy-sdk';
import alchemy from './alchemy-client.js';
import { escapers } from '@telegraf/entity';
import {
    cover,
    marsContract,
    uniswapMarsContract,
} from './constants.js';
import { ethers } from 'ethers';
import { Context, Telegraf } from 'telegraf';
import shortenAddress from './shorten-address.js';
import isBuy from './is-buy.js';
import createDebug from 'debug';
import { Wallet } from '../schemas/wallet-schema.js';
import { Id } from '../schemas/id-schema.js';

const debug = createDebug('bot');

const listenWallet = async (
    addresses: any,
    ctx: Telegraf<Context<any>> | Context,
) => {
    debug(
        `Listening to wallet addresses: ${addresses
            .map((address: any) => address.from)
            .join(', ')}`,
    );

    console.log(`Listening to wallet addresses: ${addresses
        .map((address: any) => address.from)
        .join(', ')}`);

    const walletData = await Wallet.findOne({});
    let idData = await Id.findOne({});

    if (!idData || !walletData) {
        return;
    }

    if (!idData.ids || !walletData.wallets) {
        return;
    }

    const telegramIds = idData.ids;

    console.log('telegramIds:', idData.ids);

    if (telegramIds.length === 0 || walletData.wallets.length === 0) {
        console.error('Please check the wallet addresses and /start the bot again.');
        return;
    }

    alchemy.ws.on(
        {
            method: AlchemySubscription.MINED_TRANSACTIONS,
            addresses: addresses,
        },
        async (tx) => {
            const receipt = await alchemy.core.getTransactionReceipt(
                tx.transaction.hash,
            );

            if (!receipt || !receipt.logs) {
                console.log('No logs found for this transaction.');
                return;
            }

            const logs = receipt.logs;

            for (let i = 0; i < logs.length; i++) {
                const log = logs[i];

                // Transfer MARS
                if (log.address === marsContract) {
                    const iface = new ethers.Interface([
                        `event Transfer(
                        address indexed from,
                        address indexed to,
                        uint256 value)`,
                    ]);

                    const decodedLog = iface.parseLog(log);

                    if (decodedLog != null) {
                        const amount = decodedLog.args.value;

                        const message = `
                            Activity from **${escapers.MarkdownV2(
                            shortenAddress(tx.transaction.from),
                        )}**

                            Transfer ${amount} MARS

                            [View on Etherscan](https://etherscan.io/tx/${log.transactionHash
                            })`.replace(/  +/g, '');

                        const sendResultPromises = telegramIds.map((id) =>
                            ctx.telegram
                                .sendPhoto(id, cover, {
                                    caption: message,
                                    parse_mode: 'MarkdownV2',
                                })
                                .catch((error) => {
                                    console.error(
                                        `Failed to send photo to ID ${id}:`,
                                        error.message,
                                    );
                                }),
                        );

                        await Promise.allSettled(sendResultPromises);
                    }
                }

                if (
                    log.topics[0] ===
                    '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822' &&
                    log.address === uniswapMarsContract
                ) {
                    const iface = new ethers.Interface([
                        `event Swap(
                            address indexed sender,
                            uint256 amount0In,
                            uint256 amount1In,
                            uint256 amount0Out,
                            uint256 amount1Out,
                            address indexed to
                        )`,
                    ]);

                    const decodedLog = iface.parseLog(log);

                    if (decodedLog == null) {
                        console.log('Failed to decode log.');
                        return;
                    }

                    const isBuyEvent = isBuy(decodedLog.args.amount1In);
                    const amount = `${isBuyEvent
                        ? Number(ethers.formatEther(decodedLog.args.amount1In)).toFixed(3)
                        : Number(ethers.formatEther(decodedLog.args.amount1Out)).toFixed(
                            3,
                        )
                        } ETH`;

                    const message = `
                        Activity from **${escapers.MarkdownV2(
                        shortenAddress(tx.transaction.from),
                    )}**   

                        ${isBuyEvent ? '**Buy**' : '*Sell*'
                        } MARS for ${escapers.MarkdownV2(amount)}

                        [View on Etherscan](https://etherscan.io/tx/${log.transactionHash
                        })`.replace(/  +/g, '');

                    const sendResultPromises = telegramIds.map((id) =>
                        ctx.telegram
                            .sendPhoto(id, cover, {
                                caption: message,
                                parse_mode: 'MarkdownV2',
                            })
                            .catch((error) => {
                                console.error(
                                    `Failed to send photo to ID ${id}:`,
                                    error.message,
                                );
                            }),
                    );

                    await Promise.allSettled(sendResultPromises);
                }
            }
        },
    );
};

export default listenWallet;
