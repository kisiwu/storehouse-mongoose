import { Schema, Model, QueryWithHelpers, HydratedDocument, Require_id } from 'mongoose';
import { ModelSettings } from '../../src/index';

/**
 * the object as it is stored in MongoDB
 */
export interface MovieJson {
  title: string;
  rate?: number;
}

export type Movie = Require_id<MovieJson>

// Put all user instance methods in this interface:
export interface MovieJsonMethods {
  fullName(): string;
}

export interface MovieModelStatics {
  myStaticMethod(): number;
}

// Create a new Model type that knows about IUserMethods...
//export type MovieModel = Model<MovieJson, NonNullable<unknown>, MovieJsonMethods> & MovieModelStatics;

export interface MovieQueryHelpers {
  byTitle(title: string): QueryWithHelpers<
    HydratedDocument<MovieJson>[],
    HydratedDocument<MovieJson>,
    MovieQueryHelpers
  >
}

export interface MovieVirtuals {
  /**
   * virtual getter
   */
  displayName: string
}

export interface MovieModel extends Model<MovieJson, MovieQueryHelpers, MovieJsonMethods, MovieVirtuals>, MovieModelStatics {
}

const movieSchema = new Schema<MovieJson, MovieModel, MovieJsonMethods, MovieQueryHelpers, MovieVirtuals>({
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
},
{
  /*
  virtuals: {
    displayName: {
      get: function() {
        return `${this.title} (${this.rate} stars)`
      }
    }
  },
  */
  /*
  methods: {
    fullName() {
      return `${this.title} (${this.rate} stars)`
    },
  },
  */
  /*
  query: {
    byTitle(title: string) {
      return this.find({ title: title });
    }
  },
  */
  statics: {
    myStaticMethod() {
      return 42;
    }
  }
})

movieSchema.virtual('displayName').get(function () {
  return `${this.title} (${this.rate} stars)`
});

movieSchema.methods.fullName = function() {
  return `${this.title} (${this.rate} stars)`
}

movieSchema.query.byTitle = function(
  this: QueryWithHelpers<unknown, HydratedDocument<MovieJson>, MovieQueryHelpers>,
  title: string
) {
  return this.find({ title: title });
}


export const MovieSettings: ModelSettings<MovieJson, MovieModel> = {
    name: 'movies',
    schema: movieSchema,
    collection: 'movies'
};

export interface IRoom {
  name: string
}

export interface RoomModel extends Model<IRoom> {}

export const RoomSettings: ModelSettings<IRoom> = {
  name: 'rooms',
  schema: new Schema({
    name: {
      type: String,
      trim: true,
      required: [true, '\'title\' is required.'],
      unique: true,
      index: { unique: true },
    },
  }),
  collection: 'rooms'
};


//------------------------