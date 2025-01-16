import { Model, model, Schema } from "mongoose";

interface IWallet {
    wallets: string[];
}

export type WalletModel = Model<IWallet>

const WalletSchema: Schema = new Schema<IWallet, WalletModel>({
    wallets: {
        type: [String],
        required: [true, 'Wallets array is required'],
        validate: {
            validator: (v: string[]) => Array.isArray(v) && v.every((item) => typeof item === 'string'),
            message: 'All wallets must be strings.',
        },
    },
});

export const Wallet = model<IWallet, WalletModel>('Wallet', WalletSchema);