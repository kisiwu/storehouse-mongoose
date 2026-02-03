//import { Debug } from '@novice1/logger';
import { Storehouse } from '@storehouse/core';
import { MongooseManager, getModel, getManager, getConnection } from '../../src/index';
import { expect } from 'chai';

//Debug.enable('@storehouse/mongoose*');

import { MovieSettings, RoomSettings, MovieJson, Movie, MovieModel } from './movieSchema';

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
                            MovieSettings,
                            RoomSettings
                        ]
                    }
                }
            });

            const connection = await getConnection(Storehouse, 'local').asPromise();//await Storehouse.getConnection<Connection>();
            logger.log('retrieved connection for database', connection.name);
            expect(connection.name).to.be.a('string');

            const manager = getManager(Storehouse/*, 'local'*/); // Storehouse.getManager<MongooseManager>();
            const id = manager.toObjectId('62532bce61cb4f39c9c4f1ae');
            logger.log('id=', id)
            //if(manager) {
            const MoviesModel = manager.getModel('movies');
            if (MoviesModel) {
                const nb = await MoviesModel.countDocuments();
                logger.log('nb movies', nb);
                expect(nb).to.be.a('number');
            }
            //}

            const Movies = getModel<MovieJson, MovieModel>(Storehouse, /*'local',*/ 'movies');

            logger.log('static method', Movies.myStaticMethod())
            expect(Movies.myStaticMethod()).to.be.a('number');

            //if(Movies) {
            const newUser = new Movies();
            newUser.title = `Last Knight ${Math.ceil(Math.random() * 1000) + 1}`;
            await newUser.save();
            logger.log('added new movie');

            expect(newUser.fullName).to.be.a('function')
            expect(newUser.fullName()).to.be.a('string')

            const movies = await Movies.find({}).sort({ _id: -1 }).limit(1);
            if (movies.length) {
                const doc = movies[0];
                logger.log('new movie title:', doc.title);
                logger.info('displayName (virtual):', doc.displayName);
                expect(doc.title).to.be.a('string');
                expect(doc.displayName).to.be.a('string');
            }

            const movAggr = await Movies.aggregate<Movie>().option({ maxTimeMS: 2000 }).match({})
            if (movAggr.length) {
                const doc = movAggr[0];
                logger.info('after aggregate', doc)
                logger.log('movie title (aggregate):', doc.title);
                expect(doc.title).to.be.a('string');
            }

            // notice: extra step "model(...)" to see if it works
            const moviesFromAggr = await Movies.aggregation<Movie>().model(Movies)
                .option({ maxTimeMS: 2000 })
                .match({});

            expect(Movies.aggregation<Movie>().model().aggregation).to.be.a('function')
            expect(Movies.aggregation<Movie>().model().aggregation().countDocuments).to.be.a('function')

            if (moviesFromAggr.length) {
                const doc = moviesFromAggr[0];
                logger.info('after aggregation', doc)
                logger.log('movie title (aggregation):', doc.title);
                expect(doc.title).to.be.a('string');
            }

            logger.info('"aggregation"\'s only advantage => counting documents:', await Movies.aggregation()
                .option({ maxTimeMS: 2000 })
                .match({}).countDocuments());

            await newUser.deleteOne();
            logger.info('deleted movie');
            //}

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
