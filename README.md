# @storehouse/mongoose

[Documentation](https://novice1.000webhostapp.com/storehouse/mongoose/).

## Installation

Make sure you have [@storehouse/core](https://www.npmjs.com/package/@storehouse/core) and [mongoose](https://www.npmjs.com/package/mongoose) installed.

```bash
$ npm install @storehouse/mongoose
```

## Usage

### Basic

movies.ts
```ts
import { Document, Schema } from 'mongoose';
import { ModelSettings } from '@storehouse/mongoose';

export interface MovieJson {
  title: string;
  rate?: number;
}

export interface Movie extends Document, MovieJson {
}

export const movieSettings: ModelSettings = {
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
    }),
    collection: 'movies'
};
```

index.ts
```ts
import Storehouse from '@storehouse/core';
import { MongooseManager, CustomModel } from '@storehouse/mongoose';
import { movieSettings } from './movies';

// register
Storehouse.add({
  local: {
    // type: '@storehouse/mongoose' if you called Storehouse.setManagerType(MongooseManager)
    type: MongooseManager, 
    config: {
      // string
      database: 'mongodb://localhost:27017/database',
      
      // ConnectOptions
      options: {
        keepAlive: true,
        poolSize: 24,
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        promiseLibrary: Promise
      },
      
      // ModelSettings[]
      models: [
        movieSettings
      ]
    }
  }
});
```

Once the manager registered, you can access it or directly get the connection or models.

```ts
import Storehouse from '@storehouse/core';
import { MongooseManager, CustomModel } from '@storehouse/mongoose';
import { Connection } from 'mongoose';
import { Movie } from './movies';

// connection
const conn = await Storehouse.getConnection<Connection>();
if (conn) {
  console.log('retrieved connection for database', conn.name);
}

// manager
const localManager = Storehouse.getManager<MongooseManager>('local');
if (localManager) {
  // model
  const moviesModel = manager.getModel<CustomModel<Movie>>('movies');
  if (moviesModel) {
    console.log('nb movies', await moviesModel.countDocuments());
  }
}

// model
const Movies = Storehouse.getModel<CustomModel<Movie>>('movies');
if(Movies) {
  console.log('nb movies', await Movies.countDocuments());
}
```

### Helpers

There are methods to help you retrieve the connection, manager and models so you don't have to check if they are undefined.
Those methods throw an error when they fail.

```ts
import Storehouse from '@storehouse/core';
import { CustomModel, getConnection, getManager, getModel } from '@storehouse/mongoose';
import { Movie } from './movies';

// connection
const conn = await getConnection(Storehouse, 'local');
console.log('retrieved connection for database', conn.name);

// manager
const manager = getManager(Storehouse, 'local');
manager.getModel<CustomModel<Movie>>('movies');

// model
const Movies = getModel<Movie>(Storehouse, 'local', 'movies');
console.log('nb movies', await Movies.countDocuments());
```

### Aggregation

A method from `CustomModel` of `@storehouse/mongoose`.

```ts
import Storehouse from '@storehouse/core';
import { getModel } from '@storehouse/mongoose';
import { Movie, MovieJson } from './movies';

const Movies = getModel<Movie>(Storehouse, 'local', 'movies');
const movies = await Movies.aggregation<MovieJson>().match({});
```

## References

- [Documentation](https://novice1.000webhostapp.com/storehouse/mongoose/)
- [@storehouse/core](https://www.npmjs.com/package/@storehouse/core)
- [mongoose](https://mongoosejs.com/)
