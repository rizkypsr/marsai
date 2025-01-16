import { Context } from 'telegraf';
import alchemy from '../../config/alchemy-client.js';


const count = () => async (ctx: Context) => {
    const listeners = await alchemy.ws.listenerCount();
    return ctx.reply(listeners.toString());
};

export default count;
