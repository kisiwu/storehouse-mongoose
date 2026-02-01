## Health check

```ts
export class MongooseManager implements IManager {
  // ... existing code ...

  isConnected(): boolean {
    return this.#connection?.readyState === 1; // 1 = connected
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    const timestamp = start;

    if (!this.#connection) {
      return {
        healthy: false,
        message: 'No connection available',
        details: {
          name: this.name
        },
        timestamp
      };
    }

    try {
      // Check connection state
      const readyState = this.#connection.readyState;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      
      if (readyState !== 1) {
        return {
          healthy: false,
          message: `Connection state: ${states[readyState] || 'unknown'}`,
          details: {
            name: this.name,
            readyState,
            readyStateLabel: states[readyState] || 'unknown'
          },
          timestamp
        };
      }

      // Ping the database
      await this.#connection.db.admin().ping();
      
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        message: 'Mongoose connection is healthy',
        details: {
          name: this.name,
          databaseName: this.#connection.name,
          host: this.#connection.host,
          port: this.#connection.port,
          models: Object.keys(this.#connection.models),
          modelCount: Object.keys(this.#connection.models).length,
          readyState: states[readyState],
          latency: `${latency}ms`
        },
        latency,
        timestamp
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Mongoose health check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          name: this.name,
          readyState: this.#connection?.readyState,
          error: error instanceof Error ? error.stack : String(error)
        },
        latency: Date.now() - start,
        timestamp
      };
    }
  }
}
```

## Import Custom Error Classes

```ts
import { 
  IManager, 
  ManagerArg,
  HealthCheckResult 
} from '@storehouse/core/lib/manager';
import { Registry } from '@storehouse/core/lib/registry';
import { 
  ModelNotFoundError,
  ManagerNotFoundError,
  InvalidManagerConfigError
} from '@storehouse/core/lib/errors';
import mongoose, { 
  ConnectOptions,
  Model, 
  Connection,
  Schema,
  Types as MongooseTypes,
  DefaultSchemaOptions
} from 'mongoose';
import { ObjectIdLike } from 'bson';
import Logger from '@novice1/logger';

import { WrapAggregation } from './aggregation';
import { WithAggregationMethod } from './definitions';
export { CustomModel, Aggregation, WithAggregationMethod } from './definitions';

export function getModel<
  T = NonNullable<unknown>,
  TModel extends Model<T> = Model<T>
>
(registry: Registry, modelName: string): TModel & WithAggregationMethod;
export function getModel<
  T = NonNullable<unknown>,
  TModel extends Model<T> = Model<T>
>
(registry: Registry, managerName: string, modelName: string): TModel & WithAggregationMethod;
export function getModel<
  T = NonNullable<unknown>,
  TModel extends Model<T> = Model<T>
>
(registry: Registry, managerName: string, modelName?: string): TModel & WithAggregationMethod {
  const model = registry.getModel<TModel & WithAggregationMethod>(managerName, modelName);
  if (!model) {
    throw new ModelNotFoundError(
      modelName || managerName,
      modelName ? managerName : undefined
    );
  }
  return model;
}

export function getManager<M extends MongooseManager = MongooseManager>(
  registry: Registry, 
  managerName?: string
): M {
  const manager = registry.getManager<M>(managerName);
  if (!manager) {
    throw new ManagerNotFoundError(managerName || registry.defaultManager);
  }
  if (!(manager instanceof MongooseManager)) {
    throw new InvalidManagerConfigError(
      `Manager "${managerName || registry.defaultManager}" is not instance of MongooseManager`
    );
  }
  return manager;
}

export function getConnection<T extends Connection = Connection>(
  registry: Registry, 
  managerName?: string
): T {
  const conn = registry.getConnection<T>(managerName);
  if (!conn) {
    throw new ManagerNotFoundError(managerName || registry.defaultManager);
  }
  return conn;
}

constructor(settings: MongooseManagerArg) {
  this.name = settings.name || `Yungoos ${Date.now()}_${Math.ceil(Math.random() * 10000) + 10}`;
  this.#uri = settings.config?.database || '';
  this.#connectOptions = settings.config?.options;
  this.#modelSettings = {};

  if (!this.#uri) {
    throw new InvalidManagerConfigError('Missing database uri');
  }
  
  // ... rest of constructor
}
```
