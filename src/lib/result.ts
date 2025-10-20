/**
 * @author: Tung Vu <me@tungv.com>
 * @description: Result<Ok, Err> for error handling
 */

// helper types
type IsNever<T> = [T] extends [never] ? true : false;
type Or<A extends boolean, B extends boolean> = A extends true
	? true
	: B extends true
		? true
		: false;

type IsEmptyList<T> = [T] extends [never[]] ? true : false;

// biome-ignore lint/suspicious/noExplicitAny: any unary function
type UnaryFn<I> = (value: I) => any;

// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
type TooComplexOverloading = any;

// biome-ignore lint/suspicious/noExplicitAny: any result
type AnySync = Result<any, any>;

export interface Result<OkType, ErrType> {
	// Sync version - returns Result
	map<NextOk>(
		whenOk: (ok: OkType) => NextOk,
	): IsNever<OkType> extends true
		? Err<ErrType>
		: NextOk extends Promise<infer NextOkType>
			? FutureResult<NextOkType, ErrType>
			: Result<NextOk, ErrType>;

	// Sync version - returns Result
	flatMap<NextResult extends AnySync>(
		whenOk: (ok: OkType) => NextResult,
	): IsNever<OkType> extends true
		? Result<never, ErrType>
		: Result<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	// Async version - returns FutureResult
	flatMap<NextResult extends AnySync>(
		whenOk: (ok: OkType) => Promise<NextResult>,
	): IsNever<OkType> extends true
		? FutureErr<ErrOf<NextResult>>
		: FutureResult<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	mapErr<const NextErr>(
		whenErr: (err: ErrType) => NextErr,
	): IsNever<OkType> extends true ? Err<NextErr> : Result<OkType, NextErr>;

	getOrElse<HandleFn extends UnaryFn<ErrType>>(
		handle: HandleFn,
	): IsNever<OkType> extends true
		? ReturnType<HandleFn>
		: IsNever<ErrType> extends true
			? OkType
			: OkType | ReturnType<HandleFn>;
}

export interface FutureResult<OkType, ErrType>
	extends PromiseLike<Result<OkType, ErrType>> {
	// Sync version - returns FutureResult
	map<NextOk>(
		whenOk: (ok: OkType) => NextOk,
	): IsNever<OkType> extends true
		? Err<ErrType>
		: FutureResult<Awaited<NextOk>, ErrType>;

	// Sync version - returns FutureResult
	flatMap<NextResult extends AnySync>(
		whenOk: (ok: OkType) => NextResult,
	): IsNever<OkType> extends true
		? FutureErr<ErrOf<NextResult>>
		: FutureResult<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	// Async version - returns FutureResult
	flatMap<NextResult extends AnySync>(
		whenOk: (ok: OkType) => Promise<NextResult>,
	): IsNever<OkType> extends true
		? FutureErr<ErrOf<NextResult>>
		: FutureResult<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	mapErr<const NextErr>(
		whenErr: (err: ErrType) => NextErr,
	): IsNever<OkType> extends true
		? Err<NextErr>
		: FutureResult<OkType, NextErr>;

	getOrElse<HandleFn extends UnaryFn<ErrType>>(
		handle: HandleFn,
	): IsNever<OkType> extends true
		? Promise<ReturnType<HandleFn>>
		: [ErrType] extends [never]
			? Promise<OkType>
			: Promise<OkType | ReturnType<HandleFn>>;

	// Type guards for better type safety
	isOk(): this is Ok<OkType>;
	isErr(): this is Err<ErrType>;
}

type Err<ErrType> = Result<never, ErrType>;
type Ok<OkType> = Result<OkType, never>;
type ErrOf<ResultType> = ResultType extends Result<infer OkType, infer ErrType>
	? ErrType
	: never;
type OkOf<ResultType> = ResultType extends Result<infer OkType, infer ErrType>
	? OkType
	: never;

function createFutureResult<OkType, ErrType>(
	promise: Promise<Result<OkType, ErrType>>,
): FutureResult<OkType, ErrType> {
	const thenable = {
		// biome-ignore lint/suspicious/noThenProperty: Required for PromiseLike interface
		then: promise.then.bind(promise),

		map: <NextOk>(whenOk: (ok: OkType) => NextOk | Promise<NextOk>) => {
			// before we can do anything, we need to wait for the current result to be resolved
			const thenable = promise.then(async (currentResult) => {
				// once we have the current result, we can map
				const nextResult = currentResult.map((value) =>
					Promise.resolve(whenOk(value)),
				);

				return nextResult;
			});

			return createFutureResult(thenable as TooComplexOverloading);
		},

		flatMap: <NextResult extends AnySync>(
			whenOk: (ok: OkType) => NextResult | Promise<NextResult>,
		) => {
			const thenable = promise.then(async (currentResult) => {
				const nextResult = currentResult.flatMap((value) =>
					Promise.resolve(whenOk(value)),
				);
				return nextResult;
			});
			return createFutureResult(thenable as TooComplexOverloading);
		},

		mapErr: <NextErr>(whenErr: (err: ErrType) => NextErr) =>
			createFutureResult(promise.then((r) => r.mapErr(whenErr))),

		getOrElse: <HandleFn extends UnaryFn<ErrType>>(handle: HandleFn) =>
			promise.then((result) => result.getOrElse(handle)),
	};

	// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
	return thenable as any;
}

// helper function
const isDev = process.env.NODE_ENV === "development";
function freeze<T>(value: T): T {
	return isDev ? Object.freeze(value) : value;
}

// private map to store the value for internal access
// biome-ignore lint/suspicious/noExplicitAny: any result
type MapAnyResult = WeakMap<AnySync, any>;
const __privateOkMap: MapAnyResult = new WeakMap();
const __privateErrMap: MapAnyResult = new WeakMap();

function __getOkValue<OkType>(result: AnySync): OkType | null {
	if (!__privateOkMap.has(result)) {
		return null;
	}

	return __privateOkMap.get(result) as OkType;
}

function __getErrValue<ErrType>(result: AnySync): ErrType | null {
	if (!__privateErrMap.has(result)) {
		return null;
	}

	return __privateErrMap.get(result) as ErrType;
}

// Type aliases for FutureResult specializations
export type FutureOk<OkType> = FutureResult<OkType, never>;
export type FutureErr<ErrType> = FutureResult<never, ErrType>;

export namespace Result {
	export type AnyResult = AnySync;

	export type Future<OkType, ErrType> = FutureResult<OkType, ErrType>;

	export type MustOk<OkType> = OkType extends Promise<infer NextOkType>
		? FutureOk<NextOkType>
		: Ok<OkType>;
	export type MustErr<ErrType> = ErrType extends Promise<infer NextErrType>
		? FutureErr<NextErrType>
		: Err<ErrType>;

	export function Ok<const OkType>(value: OkType): Result.MustOk<OkType> {
		// If value is a promise, return a FutureResult
		if (value instanceof Promise) {
			const thenablePromise = value.then((resolvedValue) =>
				Result.Ok(resolvedValue),
			);
			return createFutureResult(thenablePromise) as TooComplexOverloading;
		}

		const option: Ok<OkType> = {
			map: (whenOk: (value: OkType) => unknown | Promise<unknown>) => {
				const result = whenOk(value);
				// Check if result is a Promise
				if (result instanceof Promise) {
					return createFutureResult(
						result.then((nextOk) => Result.Ok(nextOk)),
					) as TooComplexOverloading;
				}

				return Result.Ok(result) as TooComplexOverloading;
			},
			flatMap: (whenOk: (value: OkType) => AnySync | Promise<AnySync>) => {
				const result = whenOk(value);
				// Check if result is a Promise
				if (result instanceof Promise) {
					return createFutureResult(result) as TooComplexOverloading;
				}

				return result as TooComplexOverloading;
			},

			mapErr: () => option as TooComplexOverloading,
			getOrElse: () => value as TooComplexOverloading,
		};

		// freeze the option to prevent mutation
		freeze(option);
		__privateOkMap.set(option, value);

		return option as TooComplexOverloading;
	}

	export function Err<const ErrType>(error: ErrType): Result.MustErr<ErrType> {
		// If error is a promise, return a FutureResult
		if (error instanceof Promise) {
			const thenablePromise = error.then((resolvedError) =>
				Result.Err(resolvedError),
			);
			return createFutureResult(thenablePromise) as TooComplexOverloading;
		}

		const errResult: Err<ErrType> = {
			map: () => errResult,
			flatMap: () => errResult as TooComplexOverloading,
			mapErr: (whenErr: UnaryFn<ErrType>) =>
				Result.Err(whenErr(error)) as TooComplexOverloading,
			getOrElse: (handle: UnaryFn<ErrType>) => handle(error),
		};

		freeze(errResult);
		__privateErrMap.set(errResult, error);

		return errResult as TooComplexOverloading;
	}

	export function tryCatch<RetType, ErrType = Error>(
		fn: () => RetType,
	): Result<RetType, ErrType> {
		try {
			return Result.Ok(fn()) as TooComplexOverloading;
		} catch (error) {
			return Result.Err(error as ErrType) as TooComplexOverloading;
		}
	}

	export class AggregatedResultError<ErrorTypes> extends Error {
		constructor(private errors: ErrorTypes[]) {
			super("AggregatedResultError");
		}

		public getErrors(): unknown[] {
			return this.errors;
		}
	}

	type ListOk<T extends readonly AnyResult[]> = {
		[K in keyof T]: OkOf<T[K]>;
	};
	type ListErrors<T extends readonly AnyResult[]> = {
		[K in keyof T]: ErrOf<T[K]>;
	};

	type IsNarrowed<R> = R extends Result<infer Ok, infer Err>
		? Or<IsNever<Ok>, IsNever<Err>>
		: false;

	type AllNarrowed<T extends readonly AnyResult[]> = {
		[K in keyof T]: IsNarrowed<T[K]>;
	}[number];

	export function all<T extends readonly AnySync[]>(
		results: T,
	): AllNarrowed<T> extends true
		? IsEmptyList<ListErrors<T>> extends true
			? Ok<ListOk<T>>
			: Err<AggregatedResultError<ListErrors<T>[number]>>
		: Result<ListOk<T>, AggregatedResultError<ListErrors<T>[number]>> {
		const okValues = results.map((result) => __getOkValue(result));

		// if some value is not OK, return the first error
		if (okValues.some((value) => value === null)) {
			const errors = results.flatMap((result) => {
				const err = __getErrValue(result);
				if (err === null) {
					return [];
				}
				return [err];
			}) as ListErrors<T>[];

			const aggregatedErr = Result.Err(new AggregatedResultError(errors));

			return aggregatedErr as TooComplexOverloading;
		}

		// everything is OK, return the values
		return Result.Ok(okValues as ListOk<T>) as TooComplexOverloading;
	}

	export function every<T extends readonly AnySync[]>(
		results: T,
	): [ListErrors<T>] extends [never[]] ? true : boolean {
		const okValues = results.map((result) => __getOkValue(result));
		return okValues.every((value) => value !== null) as TooComplexOverloading;
	}

	export function some<T extends readonly AnySync[]>(
		results: T,
	): [ListErrors<T>] extends [never[]] ? true : boolean {
		const okValues = results.map((result) => __getOkValue(result));
		return okValues.some((value) => value !== null) as TooComplexOverloading;
	}
}
