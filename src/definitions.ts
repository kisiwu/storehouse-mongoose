import {
    Aggregate,
    Model,
    HydratedDocument
} from 'mongoose';

export interface ExtendedAggregate<ResultType> extends Aggregate<ResultType> {
    countDocuments(): Promise<number>;
    exec(cursorOptions?: Record<string, unknown> | undefined): Promise<ResultType>
}

export interface CustomAggregate<A = unknown> extends Omit<ExtendedAggregate<A[]>, 'model'> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model(model: Model<any>): Aggregate<A[]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model(): CustomModel<any>;
    [key: string]: unknown;
}

export interface ModelWithAggregation {
    aggregation<ResultElementType>(): CustomAggregate<ResultElementType>;
}

export interface CustomModel<
    TRawDocType = unknown,
    TQueryHelpers = unknown,
    TInstanceMethods = unknown,
    TVirtuals = unknown,
    THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods, TQueryHelpers>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TSchema = any
> extends Model<
    TRawDocType,
    TQueryHelpers,
    TInstanceMethods,
    TVirtuals,
    THydratedDocumentType,
    TSchema
>, ModelWithAggregation {
}