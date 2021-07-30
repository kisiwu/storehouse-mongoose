import Storehouse from '@storehouse/core';
import { Document } from 'mongoose';
//import {expect} from 'chai';
import { MongooseManager, CustomModel } from '../../src/index';

interface Movie extends Document {
  title: string;
  rate?: number;
}

import MovieSchema from './movieSchema';

describe('connect', function () {
  const { logger, params } = this.ctx.kaukau;

  it('should init and connect', async () => {
    // Storehouse.setManagerType(MongooseManager);

    let databaseUri = `${params('mongodb.protocol')}://`;
    if (params('mongodb.username') && params('mongodb.password')) {
      databaseUri += `${params('mongodb.username')}:${params('mongodb.password')}@`;
    }
    databaseUri += `${params('mongodb.hostname')}`;
    if (params('mongodb.port') && params('mongodb.port') !== '0') {
      databaseUri += `:${params('mongodb.port')}`;
    }
    databaseUri += `/${params('mongodb.database')}`;
    if (params('mongodb.options')) {
      databaseUri += `?${params('mongodb.options')}`;
    }

    try {
      Storehouse.add({
        local: {
          type: MongooseManager,
          config: {
            database: databaseUri,
            options: {
              keepAlive: true,
              poolSize: 24,
              useCreateIndex: true,
              useNewUrlParser: true,
              useUnifiedTopology: true,
              useFindAndModify: false,
              promiseLibrary: Promise
            },
            models: [
              MovieSchema
            ]
          }
        }
      });
  
      const Movies: CustomModel<Movie> | undefined = Storehouse.getModel('movies');
  
      if(Movies) {
        const newUser = new Movies();
        newUser.title = `Last Knight ${Math.ceil(Math.random() * 1000) + 1}`;
        await newUser.save();
  
        const movies: Movie[] = await Movies.find({}).sort({_id: -1}).limit(1);
        if (movies.length) {
          const doc = movies[0];
          logger.log('movie title:', doc.title);
        }
  
        /*
        const movies = await Movies.aggregation<Movie>().match({});
        if (movies.length) {
          const doc = movies[0];
          logger.log('movie title:', doc.title);
        }
        */
  
        await newUser.deleteOne();
      }
  
      logger.info('close connections');
      await Storehouse.close();

      logger.info('Done');
    } catch(e) {
      await Storehouse.close();
      throw e;
    }
  });
});
