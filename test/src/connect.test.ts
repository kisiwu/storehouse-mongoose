//import { Debug } from '@novice1/logger';
import Storehouse from '@storehouse/core';
import { MongooseManager, getModel, getManager, getConnection } from '../../src/index';
import {expect} from 'chai';

//Debug.enable('@storehouse/mongoose*');

import { MovieSettings, Movie } from './movieSchema';

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
              maxPoolSize: 24
            },
            models: [
              MovieSettings
            ]
          }
        }
      });

      const connection = await getConnection(Storehouse, 'local').asPromise();//await Storehouse.getConnection<Connection>();
      logger.log('retrieved connection for database', connection.name);
      expect(connection.name).to.be.a('string');

      const manager = getManager(Storehouse/*, 'local'*/); // Storehouse.getManager<MongooseManager>();
      const id = manager.toObjectId("62532bce61cb4f39c9c4f1ae");
      logger.log('id=', id)
      //if(manager) {
        const MoviesModel = manager.getModel('movies');
        if (MoviesModel) {
          const nb = await MoviesModel.countDocuments();
          logger.log('nb movies', nb);
          expect(nb).to.be.a('number');
        }
      //}

      const Movies = getModel<Movie>(Storehouse, /*'local',*/ 'movies'); // Storehouse.getModel<CustomModel<Movie>>('movies');
  
      //if(Movies) {
        const newUser = new Movies();
        newUser.title = `Last Knight ${Math.ceil(Math.random() * 1000) + 1}`;
        await newUser.save();
        logger.log('added new movie');
  
        const movies: Movie[] = await Movies.find({}).sort({_id: -1}).limit(1);
        if (movies.length) {
          const doc = movies[0];
          logger.log('new movie title:', doc.title);
        }
  
        /*
        const movies = await Movies.aggregation<Movie>().match({});
        if (movies.length) {
          const doc = movies[0];
          logger.log('movie title:', doc.title);
        }
        */
  
        await newUser.deleteOne();
        logger.info('deleted movie');
      //}
  
      await Storehouse.close();
      logger.info('closed connections');

      logger.info('Done');
    } catch(e) {
      await Storehouse.close();
      logger.info('closed connections');
      throw e;
    }
  });
});
