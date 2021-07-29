import { Schema } from 'mongoose';

export default {
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
        type: Number
      },
    })
};