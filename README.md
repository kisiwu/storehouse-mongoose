# @storehouse/mongoose

[Documentation](https://kisiwu.github.io/storehouse/mongoose/latest/).

## Installation

Make sure you have [@storehouse/core](https://www.npmjs.com/package/@storehouse/core) and [mongoose](https://www.npmjs.com/package/mongoose) installed.

```bash
npm install @storehouse/mongoose
```

## Usage

### Basic

movies.ts
```ts
import { Model, Require_id, Schema } from 'mongoose';
import { ModelSettings } from '@storehouse/mongoose';

export interface IMovie {
  title: string;
  rate?: number;
}

export type MovieWithId = Require_id<IMovie>

export interface MovieModel extends Model<IMovie> {
}

export const movieSettings: ModelSettings<IMovie, MovieModel> = {
    name: 'movies',
    schema: new Schema<IMovie, MovieModel>({
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
        maxPoolSize: 24
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
import { MongooseManager } from '@storehouse/mongoose';
import { Connection } from 'mongoose';
import { IMovie, MovieModel } from './movies';

// connection
const conn = await Storehouse.getConnection<Connection>().asPromise();
if (conn) {
  console.log('retrieved connection for database', conn.name);
}

// manager
const localManager = Storehouse.getManager<MongooseManager>('local');
if (localManager) {
  // model
  const moviesModel = localManager.getModel<IMovie, MovieModel>('movies');
  if (moviesModel) {
    console.log('nb movies', await moviesModel.countDocuments());
  }
}

// model
const Movies = Storehouse.getModel<IMovie, MovieModel>('movies');
if(Movies) {
  console.log('nb movies', await Movies.countDocuments());
}
```

### Helpers

There are methods to help you retrieve the connection, manager and models so you don't have to check if they are undefined.
Those methods throw an error when they fail.

```ts
import Storehouse from '@storehouse/core';
import { getConnection, getManager, getModel } from '@storehouse/mongoose';
import { IMovie, MovieModel } from './movies';

// connection
const conn = await getConnection(Storehouse, 'local').asPromise();
console.log('retrieved connection for database', conn.name);

// manager
const manager = getManager(Storehouse, 'local');
manager.getModel<IMovie, MovieModel>('movies');

// model
const Movies = getModel<IMovie, MovieModel>(Storehouse, 'local', 'movies');
console.log('nb movies', await Movies.countDocuments());
```

### Aggregation

A method from `@storehouse/mongoose`'s model.

```ts
import Storehouse from '@storehouse/core';
import { getModel } from '@storehouse/mongoose';
import { IMovie, MovieModel, MovieWithId } from './movies';

const Movies = getModel<IMovie>(Storehouse, 'local', 'movies');
const movies = await Movies.aggregation<MovieWithId>().match({});
```

## References

- [Documentation](https://kisiwu.github.io/storehouse/mongoose/latest/)
- [@storehouse/core](https://www.npmjs.com/package/@storehouse/core)
- [mongoose](https://mongoosejs.com/)
