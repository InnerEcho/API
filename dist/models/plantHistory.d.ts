import { Sequelize, DataTypes, Model, Optional } from "sequelize";
interface PlantHistoryAttributes {
    history_id: BigInt;
    content: Text;
    user_id: BigInt;
    plant_id: BigInt;
    timestamp: Date;
}
interface PlantHistoryCreationAttributes extends Optional<PlantHistoryAttributes, 'history_id'> {
}
export default function (sequelize: Sequelize): {
    new (values?: Optional<PlantHistoryCreationAttributes, "history_id"> | undefined, options?: import("sequelize").BuildOptions): {
        _attributes: PlantHistoryAttributes;
        dataValues: PlantHistoryAttributes;
        _creationAttributes: PlantHistoryCreationAttributes;
        isNewRecord: boolean;
        sequelize: Sequelize;
        where(): object;
        getDataValue<K extends keyof PlantHistoryAttributes>(key: K): PlantHistoryAttributes[K];
        setDataValue<K extends keyof PlantHistoryAttributes>(key: K, value: PlantHistoryAttributes[K]): void;
        get(options?: {
            plain?: boolean;
            clone?: boolean;
        }): PlantHistoryAttributes;
        get<K extends keyof any>(key: K, options?: {
            plain?: boolean;
            clone?: boolean;
        }): any[K];
        get(key: string, options?: {
            plain?: boolean;
            clone?: boolean;
        }): unknown;
        set<K extends keyof PlantHistoryAttributes>(key: K, value: PlantHistoryAttributes[K], options?: import("sequelize").SetOptions): any;
        set(keys: Partial<PlantHistoryAttributes>, options?: import("sequelize").SetOptions): any;
        setAttributes<K extends keyof PlantHistoryAttributes>(key: K, value: PlantHistoryAttributes[K], options?: import("sequelize").SetOptions): any;
        setAttributes(keys: Partial<PlantHistoryAttributes>, options?: import("sequelize").SetOptions): any;
        changed<K extends keyof any>(key: K): boolean;
        changed<K extends keyof any>(key: K, dirty: boolean): void;
        changed(): false | string[];
        previous(): Partial<PlantHistoryAttributes>;
        previous<K extends keyof PlantHistoryAttributes>(key: K): PlantHistoryAttributes[K] | undefined;
        save(options?: import("sequelize").SaveOptions<PlantHistoryAttributes> | undefined): Promise<any>;
        reload(options?: import("sequelize").FindOptions<PlantHistoryAttributes> | undefined): Promise<any>;
        validate(options?: import("sequelize/types/instance-validator").ValidationOptions): Promise<void>;
        update<K extends keyof PlantHistoryAttributes>(key: K, value: import("sequelize/types/utils").Fn | import("sequelize/types/utils").Col | import("sequelize/types/utils").Literal | PlantHistoryAttributes[K], options?: import("sequelize").InstanceUpdateOptions<PlantHistoryAttributes> | undefined): Promise<any>;
        update(keys: {
            history_id?: BigInt | import("sequelize/types/utils").Fn | import("sequelize/types/utils").Col | import("sequelize/types/utils").Literal | undefined;
            content?: import("sequelize/types/utils").Fn | import("sequelize/types/utils").Col | import("sequelize/types/utils").Literal | Text | undefined;
            user_id?: BigInt | import("sequelize/types/utils").Fn | import("sequelize/types/utils").Col | import("sequelize/types/utils").Literal | undefined;
            plant_id?: BigInt | import("sequelize/types/utils").Fn | import("sequelize/types/utils").Col | import("sequelize/types/utils").Literal | undefined;
            timestamp?: Date | import("sequelize/types/utils").Fn | import("sequelize/types/utils").Col | import("sequelize/types/utils").Literal | undefined;
        }, options?: import("sequelize").InstanceUpdateOptions<PlantHistoryAttributes> | undefined): Promise<any>;
        destroy(options?: import("sequelize").InstanceDestroyOptions): Promise<void>;
        restore(options?: import("sequelize").InstanceRestoreOptions): Promise<void>;
        increment<K extends keyof PlantHistoryAttributes>(fields: Partial<PlantHistoryAttributes> | K | readonly K[], options?: import("sequelize").IncrementDecrementOptionsWithBy<PlantHistoryAttributes> | undefined): Promise<any>;
        decrement<K extends keyof PlantHistoryAttributes>(fields: Partial<PlantHistoryAttributes> | K | readonly K[], options?: import("sequelize").IncrementDecrementOptionsWithBy<PlantHistoryAttributes> | undefined): Promise<any>;
        equals(other: any): boolean;
        equalsOneOf(others: readonly any[]): boolean;
        toJSON<T extends PlantHistoryAttributes>(): T;
        toJSON(): object;
        isSoftDeleted(): boolean;
        _model: Model<PlantHistoryAttributes, PlantHistoryCreationAttributes>;
        addHook<K extends keyof import("sequelize/types/hooks").SequelizeHooks<Model<PlantHistoryAttributes, PlantHistoryCreationAttributes>, PlantHistoryAttributes, PlantHistoryCreationAttributes>>(hookType: K, name: string, fn: import("sequelize/types/hooks").SequelizeHooks<Model<any, any>, PlantHistoryAttributes, PlantHistoryCreationAttributes>[K]): any;
        addHook<K extends keyof import("sequelize/types/hooks").SequelizeHooks<Model<PlantHistoryAttributes, PlantHistoryCreationAttributes>, PlantHistoryAttributes, PlantHistoryCreationAttributes>>(hookType: K, fn: import("sequelize/types/hooks").SequelizeHooks<Model<PlantHistoryAttributes, PlantHistoryCreationAttributes>, PlantHistoryAttributes, PlantHistoryCreationAttributes>[K]): any;
        removeHook<K extends keyof import("sequelize/types/hooks").SequelizeHooks<Model<PlantHistoryAttributes, PlantHistoryCreationAttributes>, PlantHistoryAttributes, PlantHistoryCreationAttributes>>(hookType: K, name: string): any;
        hasHook<K extends keyof import("sequelize/types/hooks").SequelizeHooks<Model<PlantHistoryAttributes, PlantHistoryCreationAttributes>, PlantHistoryAttributes, PlantHistoryCreationAttributes>>(hookType: K): boolean;
        hasHooks<K extends keyof import("sequelize/types/hooks").SequelizeHooks<Model<PlantHistoryAttributes, PlantHistoryCreationAttributes>, PlantHistoryAttributes, PlantHistoryCreationAttributes>>(hookType: K): boolean;
    };
    associate(models: any): void;
    readonly tableName: string;
    readonly primaryKeyAttribute: string;
    readonly primaryKeyAttributes: readonly string[];
    readonly associations: {
        [key: string]: import("sequelize").Association;
    };
    readonly options: import("sequelize").InitOptions;
    readonly rawAttributes: {
        [attribute: string]: import("sequelize").ModelAttributeColumnOptions;
    };
    getAttributes<M extends Model>(this: import("sequelize").ModelStatic<M>): { readonly [Key in keyof import("sequelize").Attributes<M>]: import("sequelize").ModelAttributeColumnOptions; };
    readonly sequelize?: Sequelize;
    init<MS extends import("sequelize").ModelStatic<Model>, M extends InstanceType<MS>>(this: MS, attributes: import("sequelize").ModelAttributes<M, Optional<import("sequelize").Attributes<M>, (import("sequelize").Attributes<M> extends infer T_3 ? { [P in keyof T_3]-?: (keyof NonNullable<import("sequelize").Attributes<M>[P]> extends Exclude<keyof NonNullable<import("sequelize").Attributes<M>[P]>, unique symbol> ? false : true) extends true ? P : never; } : never)[keyof import("sequelize").Attributes<M>]>>, options: import("sequelize").InitOptions<M>): MS;
    removeAttribute(attribute: string): void;
    sync<M extends Model>(options?: import("sequelize").SyncOptions): Promise<M>;
    drop(options?: import("sequelize").DropOptions): Promise<void>;
    schema<M extends Model>(this: import("sequelize").ModelStatic<M>, schema: string, options?: import("sequelize").SchemaOptions): import("sequelize").ModelCtor<M>;
    getTableName(): string | {
        tableName: string;
        schema: string;
        delimiter: string;
    };
    scope<M extends Model>(this: import("sequelize").ModelStatic<M>, options?: string | import("sequelize").ScopeOptions | readonly (string | import("sequelize").ScopeOptions)[] | import("sequelize").WhereAttributeHash<M>): import("sequelize").ModelCtor<M>;
    addScope<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, scope: import("sequelize").FindOptions<import("sequelize").Attributes<M>>, options?: import("sequelize").AddScopeOptions): void;
    addScope<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, scope: (...args: readonly any[]) => import("sequelize").FindOptions<import("sequelize").Attributes<M>>, options?: import("sequelize").AddScopeOptions): void;
    findAll<M extends Model>(this: import("sequelize").ModelStatic<M>, options?: import("sequelize").FindOptions<import("sequelize").Attributes<M>>): Promise<M[]>;
    findByPk<M extends Model>(this: import("sequelize").ModelStatic<M>, identifier: import("sequelize").Identifier, options: Omit<import("sequelize").NonNullFindOptions<import("sequelize").Attributes<M>>, "where">): Promise<M>;
    findByPk<M extends Model>(this: import("sequelize").ModelStatic<M>, identifier?: import("sequelize").Identifier, options?: Omit<import("sequelize").FindOptions<import("sequelize").Attributes<M>>, "where">): Promise<M | null>;
    findOne<M extends Model>(this: import("sequelize").ModelStatic<M>, options: import("sequelize").NonNullFindOptions<import("sequelize").Attributes<M>>): Promise<M>;
    findOne<M extends Model>(this: import("sequelize").ModelStatic<M>, options?: import("sequelize").FindOptions<import("sequelize").Attributes<M>>): Promise<M | null>;
    aggregate<T, M extends Model>(this: import("sequelize").ModelStatic<M>, field: keyof import("sequelize").Attributes<M> | "*", aggregateFunction: string, options?: import("sequelize").AggregateOptions<T, import("sequelize").Attributes<M>>): Promise<T>;
    count<M extends Model>(this: import("sequelize").ModelStatic<M>, options: import("sequelize").CountWithOptions<import("sequelize").Attributes<M>>): Promise<import("sequelize").GroupedCountResultItem[]>;
    count<M extends Model>(this: import("sequelize").ModelStatic<M>, options?: Omit<import("sequelize").CountOptions<import("sequelize").Attributes<M>>, "group">): Promise<number>;
    findAndCountAll<M extends Model>(this: import("sequelize").ModelStatic<M>, options?: Omit<import("sequelize").FindAndCountOptions<import("sequelize").Attributes<M>>, "group">): Promise<{
        rows: M[];
        count: number;
    }>;
    findAndCountAll<M extends Model>(this: import("sequelize").ModelStatic<M>, options: import("sequelize/types/utils/set-required").SetRequired<import("sequelize").FindAndCountOptions<import("sequelize").Attributes<M>>, "group">): Promise<{
        rows: M[];
        count: import("sequelize").GroupedCountResultItem[];
    }>;
    max<T extends DataTypes.DataType | unknown, M extends Model>(this: import("sequelize").ModelStatic<M>, field: keyof import("sequelize").Attributes<M>, options?: import("sequelize").AggregateOptions<T, import("sequelize").Attributes<M>>): Promise<T>;
    min<T extends DataTypes.DataType | unknown, M extends Model>(this: import("sequelize").ModelStatic<M>, field: keyof import("sequelize").Attributes<M>, options?: import("sequelize").AggregateOptions<T, import("sequelize").Attributes<M>>): Promise<T>;
    sum<T extends DataTypes.DataType | unknown, M extends Model>(this: import("sequelize").ModelStatic<M>, field: keyof import("sequelize").Attributes<M>, options?: import("sequelize").AggregateOptions<T, import("sequelize").Attributes<M>>): Promise<number>;
    build<M extends Model>(this: import("sequelize").ModelStatic<M>, record?: import("sequelize").CreationAttributes<M>, options?: import("sequelize").BuildOptions): M;
    bulkBuild<M extends Model>(this: import("sequelize").ModelStatic<M>, records: ReadonlyArray<import("sequelize").CreationAttributes<M>>, options?: import("sequelize").BuildOptions): M[];
    create<M extends Model, O extends import("sequelize").CreateOptions<import("sequelize").Attributes<M>> = import("sequelize").CreateOptions<import("sequelize").Attributes<M>>>(this: import("sequelize").ModelStatic<M>, values?: import("sequelize").CreationAttributes<M>, options?: O): Promise<O extends {
        returning: false;
    } | {
        ignoreDuplicates: true;
    } ? void : M>;
    findOrBuild<M extends Model>(this: import("sequelize").ModelStatic<M>, options: import("sequelize").FindOrBuildOptions<import("sequelize").Attributes<M>, import("sequelize").CreationAttributes<M>>): Promise<[M, boolean]>;
    findOrCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, options: import("sequelize").FindOrCreateOptions<import("sequelize").Attributes<M>, import("sequelize").CreationAttributes<M>>): Promise<[M, boolean]>;
    findCreateFind<M extends Model>(this: import("sequelize").ModelStatic<M>, options: import("sequelize").FindOrCreateOptions<import("sequelize").Attributes<M>, import("sequelize").CreationAttributes<M>>): Promise<[M, boolean]>;
    upsert<M extends Model>(this: import("sequelize").ModelStatic<M>, values: import("sequelize").CreationAttributes<M>, options?: import("sequelize").UpsertOptions<import("sequelize").Attributes<M>>): Promise<[M, boolean | null]>;
    bulkCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, records: ReadonlyArray<import("sequelize").CreationAttributes<M>>, options?: import("sequelize").BulkCreateOptions<import("sequelize").Attributes<M>>): Promise<M[]>;
    truncate<M extends Model>(this: import("sequelize").ModelStatic<M>, options?: import("sequelize").TruncateOptions<import("sequelize").Attributes<M>>): Promise<void>;
    destroy<M extends Model>(this: import("sequelize").ModelStatic<M>, options?: import("sequelize").DestroyOptions<import("sequelize").Attributes<M>>): Promise<number>;
    restore<M extends Model>(this: import("sequelize").ModelStatic<M>, options?: import("sequelize").RestoreOptions<import("sequelize").Attributes<M>>): Promise<void>;
    update<M extends Model>(this: import("sequelize").ModelStatic<M>, values: { [key in keyof import("sequelize").Attributes<M>]?: import("sequelize").Attributes<M>[key] | import("sequelize/types/utils").Fn | import("sequelize/types/utils").Col | import("sequelize/types/utils").Literal; }, options: Omit<import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>, "returning"> & {
        returning: Exclude<import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>["returning"], undefined | false>;
    }): Promise<[affectedCount: number, affectedRows: M[]]>;
    update<M extends Model>(this: import("sequelize").ModelStatic<M>, values: { [key in keyof import("sequelize").Attributes<M>]?: import("sequelize").Attributes<M>[key] | import("sequelize/types/utils").Fn | import("sequelize/types/utils").Col | import("sequelize/types/utils").Literal; }, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>): Promise<[affectedCount: number]>;
    increment<M extends Model>(this: import("sequelize").ModelStatic<M>, fields: import("sequelize").AllowReadonlyArray<keyof import("sequelize").Attributes<M>>, options: import("sequelize").IncrementDecrementOptionsWithBy<import("sequelize").Attributes<M>>): Promise<[affectedRows: M[], affectedCount?: number]>;
    increment<M extends Model>(this: import("sequelize").ModelStatic<M>, fields: { [key in keyof import("sequelize").Attributes<M>]?: number; }, options: import("sequelize").IncrementDecrementOptions<import("sequelize").Attributes<M>>): Promise<[affectedRows: M[], affectedCount?: number]>;
    decrement<M extends Model>(this: import("sequelize").ModelStatic<M>, fields: import("sequelize").AllowReadonlyArray<keyof import("sequelize").Attributes<M>>, options: import("sequelize").IncrementDecrementOptionsWithBy<import("sequelize").Attributes<M>>): Promise<[affectedRows: M[], affectedCount?: number]>;
    decrement<M extends Model>(this: import("sequelize").ModelStatic<M>, fields: { [key in keyof import("sequelize").Attributes<M>]?: number; }, options: import("sequelize").IncrementDecrementOptions<import("sequelize").Attributes<M>>): Promise<[affectedRows: M[], affectedCount?: number]>;
    describe(): Promise<object>;
    unscoped<M extends import("sequelize").ModelType>(this: M): M;
    beforeValidate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize/types/instance-validator").ValidationOptions) => import("sequelize/types/hooks").HookReturn): void;
    beforeValidate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize/types/instance-validator").ValidationOptions) => import("sequelize/types/hooks").HookReturn): void;
    afterValidate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize/types/instance-validator").ValidationOptions) => import("sequelize/types/hooks").HookReturn): void;
    afterValidate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize/types/instance-validator").ValidationOptions) => import("sequelize/types/hooks").HookReturn): void;
    beforeCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize").CreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize").CreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize").CreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize").CreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeDestroy<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize").InstanceDestroyOptions) => import("sequelize/types/hooks").HookReturn): void;
    beforeDestroy<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize").InstanceDestroyOptions) => import("sequelize/types/hooks").HookReturn): void;
    afterDestroy<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize").InstanceDestroyOptions) => import("sequelize/types/hooks").HookReturn): void;
    afterDestroy<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize").InstanceDestroyOptions) => import("sequelize/types/hooks").HookReturn): void;
    beforeUpdate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeUpdate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterUpdate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterUpdate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeSave<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>> | import("sequelize").SaveOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeSave<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>> | import("sequelize").SaveOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterSave<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instance: M, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>> | import("sequelize").SaveOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterSave<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instance: M, options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>> | import("sequelize").SaveOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeBulkCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instances: M[], options: import("sequelize").BulkCreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeBulkCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instances: M[], options: import("sequelize").BulkCreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterBulkCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instances: readonly M[], options: import("sequelize").BulkCreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterBulkCreate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instances: readonly M[], options: import("sequelize").BulkCreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeBulkDestroy<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (options: import("sequelize").BulkCreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeBulkDestroy<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (options: import("sequelize").BulkCreateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterBulkDestroy<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (options: import("sequelize").DestroyOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterBulkDestroy<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (options: import("sequelize").DestroyOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeBulkUpdate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeBulkUpdate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterBulkUpdate<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterBulkUpdate<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (options: import("sequelize").UpdateOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeFind<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (options: import("sequelize").FindOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeFind<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (options: import("sequelize").FindOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeCount<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (options: import("sequelize").CountOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeCount<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (options: import("sequelize").CountOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeFindAfterExpandIncludeAll<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (options: import("sequelize").FindOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeFindAfterExpandIncludeAll<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (options: import("sequelize").FindOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeFindAfterOptions<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (options: import("sequelize").FindOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeFindAfterOptions<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (options: import("sequelize").FindOptions<import("sequelize").Attributes<M>>) => void): import("sequelize/types/hooks").HookReturn;
    afterFind<M extends Model>(this: import("sequelize").ModelStatic<M>, name: string, fn: (instancesOrInstance: readonly M[] | M | null, options: import("sequelize").FindOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    afterFind<M extends Model>(this: import("sequelize").ModelStatic<M>, fn: (instancesOrInstance: readonly M[] | M | null, options: import("sequelize").FindOptions<import("sequelize").Attributes<M>>) => import("sequelize/types/hooks").HookReturn): void;
    beforeBulkSync(name: string, fn: (options: import("sequelize").SyncOptions) => import("sequelize/types/hooks").HookReturn): void;
    beforeBulkSync(fn: (options: import("sequelize").SyncOptions) => import("sequelize/types/hooks").HookReturn): void;
    afterBulkSync(name: string, fn: (options: import("sequelize").SyncOptions) => import("sequelize/types/hooks").HookReturn): void;
    afterBulkSync(fn: (options: import("sequelize").SyncOptions) => import("sequelize/types/hooks").HookReturn): void;
    beforeSync(name: string, fn: (options: import("sequelize").SyncOptions) => import("sequelize/types/hooks").HookReturn): void;
    beforeSync(fn: (options: import("sequelize").SyncOptions) => import("sequelize/types/hooks").HookReturn): void;
    afterSync(name: string, fn: (options: import("sequelize").SyncOptions) => import("sequelize/types/hooks").HookReturn): void;
    afterSync(fn: (options: import("sequelize").SyncOptions) => import("sequelize/types/hooks").HookReturn): void;
    hasOne<M extends Model, T extends Model>(this: import("sequelize").ModelStatic<M>, target: import("sequelize").ModelStatic<T>, options?: import("sequelize").HasOneOptions): import("sequelize").HasOne<M, T>;
    belongsTo<M extends Model, T extends Model>(this: import("sequelize").ModelStatic<M>, target: import("sequelize").ModelStatic<T>, options?: import("sequelize").BelongsToOptions): import("sequelize").BelongsTo<M, T>;
    hasMany<M extends Model, T extends Model>(this: import("sequelize").ModelStatic<M>, target: import("sequelize").ModelStatic<T>, options?: import("sequelize").HasManyOptions): import("sequelize").HasMany<M, T>;
    belongsToMany<M extends Model, T extends Model>(this: import("sequelize").ModelStatic<M>, target: import("sequelize").ModelStatic<T>, options: import("sequelize").BelongsToManyOptions): import("sequelize").BelongsToMany<M, T>;
    addHook<H extends import("sequelize/types/hooks").Hooks, K extends keyof import("sequelize/types/hooks").SequelizeHooks<H["_model"], import("sequelize").Attributes<H>, import("sequelize").CreationAttributes<H>>>(this: import("sequelize/types/hooks").HooksStatic<H>, hookType: K, name: string, fn: import("sequelize/types/hooks").SequelizeHooks<H["_model"], import("sequelize").Attributes<H>, import("sequelize").CreationAttributes<H>>[K]): import("sequelize/types/hooks").HooksCtor<H>;
    addHook<H extends import("sequelize/types/hooks").Hooks, K extends keyof import("sequelize/types/hooks").SequelizeHooks<H["_model"], import("sequelize").Attributes<H>, import("sequelize").CreationAttributes<H>>>(this: import("sequelize/types/hooks").HooksStatic<H>, hookType: K, fn: import("sequelize/types/hooks").SequelizeHooks<H["_model"], import("sequelize").Attributes<H>, import("sequelize").CreationAttributes<H>>[K]): import("sequelize/types/hooks").HooksCtor<H>;
    removeHook<H extends import("sequelize/types/hooks").Hooks>(this: import("sequelize/types/hooks").HooksStatic<H>, hookType: keyof import("sequelize/types/hooks").SequelizeHooks<H["_model"], import("sequelize").Attributes<H>, import("sequelize").CreationAttributes<H>>, name: string): import("sequelize/types/hooks").HooksCtor<H>;
    hasHook<H extends import("sequelize/types/hooks").Hooks>(this: import("sequelize/types/hooks").HooksStatic<H>, hookType: keyof import("sequelize/types/hooks").SequelizeHooks<H["_model"], import("sequelize").Attributes<H>, import("sequelize").CreationAttributes<H>>): boolean;
    hasHooks<H extends import("sequelize/types/hooks").Hooks>(this: import("sequelize/types/hooks").HooksStatic<H>, hookType: keyof import("sequelize/types/hooks").SequelizeHooks<H["_model"], import("sequelize").Attributes<H>, import("sequelize").CreationAttributes<H>>): boolean;
};
export {};
