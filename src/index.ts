import { IManager, ManagerSettings } from '@storehouse/core/lib/manager';
import  mongoose, { 
  ConnectOptions, 
  Document,
  Model, 
  Connection, 
  ConnectionOptions,
  Schema,
  Types as MongooseTypes
} from 'mongoose';
import Logger from '@novice1/logger';

import { CustomAggregate, WrapAggregation } from './aggregation';

const Log = Logger.debugger('@storehouse/mongoose:manager');

export interface CustomModel<T = unknown, TQueryHelpers = unknown, TMethods = unknown> extends Model<T, TQueryHelpers, TMethods> {
  aggregation<A>(): CustomAggregate<A>;
}

export interface ModelSettings {
  name: string, 
  schema: Schema<unknown, Model<unknown, unknown, unknown>, undefined, unknown>, 
  collection?: string
}

export interface YungoosSettings extends ManagerSettings {
  database: string;
  models: ModelSettings[],
  options?: ConnectOptions
}

export type ModelType<T = unknown> = Map<string, T>;

export class Yungoos implements IManager {
  static readonly type = '@storehouse/mongoose';

  #uri: string;
  #connection?: Connection;
  #connectionOptions?: ConnectionOptions;
  #modelSettings: Record<string, ModelSettings>;

  protected name: string;

  constructor(settings: YungoosSettings) {
    this.name = 'Yungoos';
    this.#uri = settings.database;
    this.#connectionOptions = settings.options;
    this.#modelSettings = {};
    
    settings.models
      .filter((im) => im && im.name && im.schema)
      .forEach((im) => {
        this.#modelSettings[im.name] = im;
      });

    this._createConnection();
  }

  private _createConnection(): Connection {
    Log.info('Create connection "%s"', this.name);
    this.closeConnection();
    this.#connection = mongoose.createConnection(this.#uri, this.#connectionOptions);

    this._registerConnectionEvents(this.#connection);

    for (const key in this.#modelSettings) {
      this._addModel(this.#modelSettings[key]);
    }

    return this.#connection;
  }

  private _registerConnectionEvents(connection: Connection) {
    connection.on('connecting', () => {
      Log.warn('Connecting [%s] ...', this.name);
    });
    connection.on('connected', () => {
      Log.info('[%s] connected!', this.name);
    });
    connection.on('disconnecting', () => {
      Log.warn('Disconnecting [%s] ...', this.name);
    });
    connection.on('disconnected', () => {
      Log.warn('[%s] has been disconnected!', this.name);
    });
    connection.on('close', () => {
      Log.info('[%s] has been closed!', this.name);
    });
    connection.on('reconnected', () => {
      Log.warn('[%s] has been reconnected!', this.name);
    });
    connection.on('error', (err) => {
      Log.error('[%s] %O', this.name, err);
    });
    connection.on('fullsetup', () => {
      Log.info('[%s] connected to the primary and one secondary server', this.name);
    });
    connection.on('all', () => {
      Log.info('[%s] connected to all servers', this.name);
    });
    connection.on('reconnectFailed', () => {
      Log.error('[%s] failed to reconnect', this.name);
    });
  }

  private _addModel(m: ModelSettings) {
    const connection = this.getConnection();

    const model = <CustomModel>connection.model(m.name, m.schema, m.collection);

    model.aggregation().collation()

    // add wrapper properties
    if (!model.aggregation) {
      const aggregation = WrapAggregation(model);
      Object.defineProperties(model, {
        aggregation: {
          enumerable: true,
          get: () => aggregation(),
        },
      });
    }

    Log('[%s] added model \'%s\'', this.name, m.name);

    return model;
  }

  getConnection(): Connection {
    let r: Connection;
    if (
      !this.#connection ||
      (this.#connection.readyState != 1 && this.#connection.readyState != 2)
    ) {
      r = this._createConnection();
    } else {
      r = this.#connection;
    }
    return r;
  }

  async closeConnection(): Promise<void> {
    if (this.#connection) {
      await this.#connection.close();
    }
    this.#connection = undefined;
  }

  getModel<U extends Model<Document>>(name: string): U {
    const c = this.getConnection();
    return c.model<Document, U>(name);
  }

  toObjectId(value?: string | number | undefined): MongooseTypes.ObjectId | undefined {
    let r: MongooseTypes.ObjectId | undefined;
    try {
      r = MongooseTypes.ObjectId(value);
    } catch (e) {
      Log.warn(e);
    }
    return r;
  }
}