import { Document, Schema } from 'mongoose';
import { ModelSettings } from '../../src/index';

export interface MovieJson {
  title: string;
  rate?: number;
}

export interface Movie extends Document, MovieJson {
}

export const MovieSettings: ModelSettings = {
    name: 'movies',
    schema: new Schema({
      title: {
        type: String,
        trim: true,
        required: [true, '\'title\' is required.'],
        unique: true,
        index: { unique: true },
      },
      rate: {
        type: Number,
        default: 0
      },
    }),
    collection: 'movies'
};