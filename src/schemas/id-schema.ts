import { Model, model, Schema } from "mongoose";

interface IId {
    ids: number[];
}

type IdModel = Model<IId>

const IdSchema: Schema = new Schema<IId, IdModel>({
    ids: {
        type: [Number],
        required: [true, 'IDs array is required'],
        validate: {
            validator: (v: number[]) => Array.isArray(v) && v.every((item) => typeof item === 'number'),
            message: 'All IDs must be numbers.',
        },
    },
});

export const Id = model<IId, IdModel>('Id', IdSchema);
