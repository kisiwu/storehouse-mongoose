import { IManager, ManagerArg } from '@storehouse/core/lib/manager';
import { Registry } from '@storehouse/core/lib/registry';
import  mongoose, { 
  ConnectOptions, 
  Document,
  Model, 
  Connection,
  Schema,
  Types as MongooseTypes
} from 'mongoose';
import { ObjectIdLike } from 'bson';
import Logger from '@novice1/logger';

import { CustomAggregate, WrapAggregation } from './aggregation';

const Log = Logger.debugger('@storehouse/mongoose:manager');

export interface CustomModel<T = unknown, TQueryHelpers = unknown, TMethods = unknown> extends Model<T, TQueryHelpers, TMethods> {
  aggregation<ResultElementType>(): CustomAggregate<ResultElementType>;
}

export interface ModelSettings {
  name: string, 
  schema: Schema, 
  collection?: string
}

export interface MongooseManagerArg extends ManagerArg {
  config?: {
    database: string;
    models: ModelSettings[],
    options?: ConnectOptions
  },
}

/**
 * 
 * @param registry 
 * @param manager Manager name or model name
 * @param modelName Model name
 * @returns 
 */
export function getModel<T extends Document = Document, TQueryHelpers = unknown, TMethods = unknown>(registry: Registry, managerName: string, modelName?: string): CustomModel<T,TQueryHelpers,TMethods> {
  const model = registry.getModel<CustomModel<T,TQueryHelpers,TMethods>>(managerName, modelName);
  if (!model) {
    throw new ReferenceError(`Could not find model "${modelName || managerName}"`);
  }
  return model;
}

export function getManager<M extends MongooseManager = MongooseManager>(registry: Registry, managerName?: string): M {
  const manager = registry.getManager<M>(managerName);
  if (!manager) {
    throw new ReferenceError(`Could not find manager "${managerName || registry.defaultManager}"`);
  }
  if (!(manager instanceof MongooseManager)) {
    throw new TypeError(`Manager "${managerName || registry.defaultManager}" is not instance of MongooseManager`);
  }
  return manager;
}

export function getConnection<T extends Connection = Connection>(registry: Registry, managerName?: string): T {
  const conn = registry.getConnection<T>(managerName);
  if (!conn) {
    throw new ReferenceError(`Could not find connection "${managerName || registry.defaultManager}"`);
  }
  return conn;
}

export class MongooseManager implements IManager {
  static readonly type = '@storehouse/mongoose';

  #uri: string;
  #connection?: Connection;
  #connectOptions?: ConnectOptions;
  #modelSettings: Record<string, ModelSettings>;

  protected name: string;

  constructor(settings: MongooseManagerArg) {
    this.name = settings.name || `Yungoos ${Date.now()}_${Math.ceil(Math.random() * 10000) + 10}`;
    this.#uri = settings.config?.database || '';
    this.#connectOptions = settings.config?.options;
    this.#modelSettings = {};

    if (!this.#uri) {
      throw new TypeError('Missing database uri');
    }
    
    settings.config?.models
      .filter((im) => im && im.name && im.schema)
      .forEach((im) => {
        this.#modelSettings[im.name] = im;
      });

    this._createConnection();
  }

  private _createConnection(): Connection {
    Log.info('Create connection [%s]', this.name);
    this.closeConnection();
    this.#connection = mongoose.createConnection(this.#uri, this.#connectOptions);
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

    // add wrapper properties
    if (!model.aggregation) {
      const aggregation = WrapAggregation(model);
      model.aggregation = aggregation;
    }

    Log('[%s] added model \'%s\'', this.name, m.name);

    return model;
  }

  connect(): Promise<Connection> {
    return this.getConnection().asPromise();
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

  getModel<M extends Model<Document> = CustomModel<Document>>(name: string): M {
    const c = this.getConnection();
    return c.model<Document, M>(name);
  }

  toObjectId(value?: string | number | MongooseTypes.ObjectId | Buffer | ObjectIdLike | undefined): MongooseTypes.ObjectId | undefined {
    let r: MongooseTypes.ObjectId | undefined;
    try {
      r = new MongooseTypes.ObjectId(value);
    } catch (e) {
      Log.warn(e);
    }
    return r;
  }
}