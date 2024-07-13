import { createConnection/*, HydratedDocument*/ } from 'mongoose'
import { expect } from 'chai';

import { MovieSettings, MovieJson, MovieModel, MovieVirtuals
    /*, MovieQueryHelpers, MovieJsonMethods*/ } from './movieSchema';

describe('just mongoose', function () {
    const { logger, params } = this.ctx.kaukau;

    it('should init and connect', async () => {

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

        const connection = await createConnection(databaseUri, { maxPoolSize: 24 }).asPromise()

        try {
            logger.log('retrieved connection for database', connection.name);
            expect(connection.name).to.be.a('string');


            const Movies = connection.model<MovieJson, MovieModel>(MovieSettings.name, MovieSettings.schema, MovieSettings.collection);

            //const Movies = connection.model<MovieJson>(MovieSettings.name)

            logger.log('static method', Movies.myStaticMethod())

            const title = `Last peasant ${Math.ceil(Math.random() * 1000) + 1}`

            /*newMovie: HydratedDocument<MovieJson, MovieVirtuals & MovieJsonMethods, MovieQueryHelpers>*/
            const newMovie = new Movies({ rate: 5, title })
            await newMovie.save()
            logger.log('fullname()', newMovie.fullName())
            logger.log('displayName', newMovie.displayName)

            const obj = newMovie.toObject<MovieJson & MovieVirtuals>({virtuals: true})
            logger.info('obj', obj)

            logger.log('Query Helper ".byTitle(...)"', await Movies.find({}).byTitle(title))

            logger.info('deleted', (await newMovie.deleteOne()))

            await connection.close()
            logger.info('closed connections');

            logger.info('Done');
        } catch(e) {
            await connection.close()
            logger.info('closed connections');
            throw e;
        }

        
    });
});
