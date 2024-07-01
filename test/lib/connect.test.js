// const { Debug } = require('@novice1/logger');
const Storehouse = require('@storehouse/core');
const {expect} = require('chai');
const { MongooseManager, getModel } = require('../../lib/index');

const movieSettings = require('./movies');

// Debug.enable('@storehouse/mongoose*');

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
              maxPoolSize: 24
            },
            models: [
              movieSettings
            ]
          }
        }
      });

      const connection = await Storehouse.getConnection().asPromise();
      logger.info('retrieved connection for database', connection.name);
      expect(connection.name).to.be.a('string');

      const manager = Storehouse.getManager();
      const MoviesModel = manager.getModel('movies');
      if (MoviesModel) {
        const nb = await MoviesModel.countDocuments();
        logger.log('nb movies', nb);
        expect(nb).to.be.a('number');
      }

      const Movies = getModel(Storehouse, 'movies');

      const newUser = new Movies();
      newUser.title = `Last Knight ${Math.ceil(Math.random() * 1000) + 1}`;
      await newUser.save();
      logger.info('added new movie');

      const movies = await Movies.find({}).sort({ _id: -1 }).limit(1);
      if (movies.length) {
        const doc = movies[0];
        logger.log('new movie title:', doc.title);
        expect(doc.title).to.be.a('string');
      }

      const movAggr = await Movies.aggregate().option({ maxTimeMS: 2000 }).match({})
      if (movAggr.length) {
        const doc = movAggr[0];
        logger.log('movie title (aggregate):', doc.title);
        expect(doc.title).to.be.a('string');
      }

      // TODO: make that work in typescript (aggregation().model().aggregation())
      const moviesFromAggr = await Movies.aggregation().model().aggregation()
        .option({ maxTimeMS: 2000 })
        .match({});
      if (moviesFromAggr.length) {
        const doc = moviesFromAggr[0];
        logger.log('movie title (aggregation):', doc.title);
        expect(doc.title).to.be.a('string');
      }

      logger.info('"aggregation"\'s only advantage => counting documents:', await Movies.aggregation()
      .option({ maxTimeMS: 2000 })
      .match({}).countDocuments());

      await newUser.deleteOne();
      logger.info('deleted movie');

      await Storehouse.close();
      logger.info('closed connections');

      logger.info('Done');
    } catch (e) {
      await Storehouse.close();
      logger.info('closed connections');
      throw e;
    }
  });
});
