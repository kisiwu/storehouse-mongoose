// https://mongoosejs.com/docs/api/aggregate.html#aggregate_Aggregate

import  mongoose, { 
  Aggregate,
  Document,
  Model
} from 'mongoose';

interface OverwrittenAggregate<A = unknown> extends Omit<Aggregate<A[]>, 'model'> {
  model<T = Document>(): Model<T>;
  model(model: unknown): Aggregate<A[]>;
  [key: string]: unknown;
}

export interface CustomAggregate<T = unknown> extends OverwrittenAggregate<T> {
  countDocuments(): Promise<number>;
}

interface OverwrittenAggregateFunction {
  (...args: unknown[]): unknown;
}

interface ChainObject {
  method: string;
  args: unknown[];
}

type CursorOptions = {
};

function execWithDefaultCursor<T = unknown>(
  aggregate: OverwrittenAggregate, 
  cursorOptions: Record<string, unknown> = {}) {
  
  const data: T[] = [];
  const PromiseClass = mongoose.Promise || Promise;

  return new PromiseClass(async function (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) {
    try {
      const cursor = aggregate.cursor(cursorOptions).exec();
      let doc: T;
      while ((doc = await cursor.next())) {
        data.push(doc);
      }
      await cursor.close();
      resolve(data);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 *
 * @param {*} aggregate
 * @param {Object[]} chain
 * @returns {Promise<number>}
 */
function countDocuments(
  aggregate: OverwrittenAggregate,
  chain: ChainObject[]) {

  const PromiseClass = mongoose.Promise || Promise;

  chain.forEach((ch) => {
    (<OverwrittenAggregateFunction>aggregate[ch.method])(...ch.args);
  });

  return new PromiseClass(async function (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) {
    try {
      const cursor = aggregate.count('count').cursor({}).exec();
      let doc: {count: number};
      let count = 0;
      while ((doc = await cursor.next())) {
        count = doc.count || count;
      }
      await cursor.close();
      resolve(count);
    } catch (e) {
      reject(e);
    }
  });
}


export function WrapAggregation(model: Model<unknown, unknown>) {
  return function start<T = unknown>(): CustomAggregate<T> {
    let aggregate = <OverwrittenAggregate>model.aggregate();
    const chain: ChainObject[] = [];

    const aggregation = {
      addCursorFlag: wrap('addCursorFlag'), // => aggregate
      addFields: wrap('addFields'), // => aggregate
      allowDiskUse: wrap('allowDiskUse'), // => aggregate
      append: wrap('append'), // => aggregate
      catch: wrap('catch'), // => Promise<unknown[]>
      collation: wrap('collation'), // => aggregate
      count: wrap('count'), // => aggregate
      countDocuments: wrap('countDocuments'), // => Promise<number>
      cursor: wrap('cursor'), // => aggregate
      exec: wrap('exec'), // => unknown
      explain: wrap('explain'), // => Promise<unknown>
      facet: wrap('facet'), // => aggregate
      graphLookup: wrap('graphLookup'), // => aggregate
      group: wrap('group'), // => aggregate
      hint: wrap('hint'), // => aggregate
      limit: wrap('limit'), // => aggregate
      lookup: wrap('lookup'), // => aggregate
      match: wrap('match'), // => aggregate
      model: wrap('model'), // => aggregate | Model<T>
      near: wrap('near'), //$geoNear, // => aggregate
      option: wrap('option'), // => aggregate
      pipeline: wrap('pipeline'), // => unknown[]
      project: wrap('project'), // => aggregate
      read: wrap('read'), // => aggregate
      readConcern: wrap('readConcern'), // => aggregate
      redact: wrap('redact'), // => aggregate
      replaceRoot: wrap('replaceRoot'), // => aggregate
      sample: wrap('sample'), // => aggregate
      search: wrap('search'), // => aggregate
      session: wrap('session'), // => aggregate
      skip: wrap('skip'), // => aggregate
      sort: wrap('sort'), // => aggregate
      sortByCount: wrap('sortByCount'), // => aggregate
      then: wrap('then'), // => Promise<T[]>
      unwind: wrap('unwind') // => aggregate
    };

    function addChain<T = unknown>(method: string, args: unknown[]): T {
      chain.push({
        method,
        args,
      });
      return <T>(<OverwrittenAggregateFunction>aggregate[method])(...args);
    }

    function wrap(verb: string) {
      return function (...args: unknown[]) {
        if (['cursor', 'explain', 'pipeline'].indexOf(verb) > -1) {
          return (<OverwrittenAggregateFunction>aggregate[verb])(...args);
        }

        if (verb == 'model') {
          if (args.length) {
            aggregate.model(args[0]);
            return aggregation;
          } else {
            return aggregate.model();
          }
        }

        // add default 'cursor' and exec
        if (verb == 'exec') {
          let cursorOptions: CursorOptions | undefined;
          if (args && args.length && args[0] && typeof args[0] === 'object') {
            cursorOptions = args[0];
          }
          return execWithDefaultCursor(aggregate, cursorOptions);
        }

        // add default 'cursor', count and exec
        if (verb == 'countDocuments') {
          return countDocuments(<OverwrittenAggregate>aggregate.model().aggregate(), chain);
        }

        // add default 'cursor' and 'exec' if needed
        if (['catch', 'then'].indexOf(verb) > -1) {
          const promise = execWithDefaultCursor(aggregate);
          if(verb == 'then') {
            promise.then(...args);
          } else {
            promise.catch(...args);
          }
          return promise;
        }

        aggregate = addChain(verb, args);
        return aggregation;
      };
    }

    return aggregation;
  };
}