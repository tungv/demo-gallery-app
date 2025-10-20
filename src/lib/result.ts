/**
 * @author: Tung Vu <me@tungv.com>
 * @description: Result<Ok, Err> for error handling
 */

export interface Result<OkType, ErrType> {
	// Sync version - returns Result
	map<NextOk>(
		whenOk: (ok: OkType) => NextOk,
	): [OkType] extends [never]
		? Err<ErrType>
		: NextOk extends Promise<infer NextOkType>
			? ThenableResult<NextOkType, ErrType>
			: Result<NextOk, ErrType>;

	// Sync version - returns Result
	flatMap<NextResult extends Result.AnyResult>(
		whenOk: (ok: OkType) => NextResult,
	): [OkType] extends [never]
		? Result<never, ErrType>
		: Result<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	// Async version - returns ThenableResult
	flatMap<NextResult extends Result.AnyResult>(
		whenOk: (ok: OkType) => Promise<NextResult>,
	): [OkType] extends [never]
		? ThenableResult<never, ErrOf<NextResult>>
		: ThenableResult<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	mapErr<const NextErr>(
		whenErr: (err: ErrType) => NextErr,
	): [OkType] extends [never] ? Err<NextErr> : Result<OkType, NextErr>;

	getOrElse<HandleFn extends UnaryFn<ErrType>>(
		handle: HandleFn,
	): [OkType] extends [never]
		? ReturnType<HandleFn>
		: OkType | ReturnType<HandleFn>;
}

export interface ThenableResult<OkType, ErrType>
	extends PromiseLike<Result<OkType, ErrType>> {
	// Sync version - returns ThenableResult
	map<NextOk>(
		whenOk: (ok: OkType) => NextOk,
	): [OkType] extends [never]
		? Err<ErrType>
		: ThenableResult<Awaited<NextOk>, ErrType>;

	// Sync version - returns ThenableResult
	flatMap<NextResult extends Result.AnyResult>(
		whenOk: (ok: OkType) => NextResult,
	): [OkType] extends [never]
		? ThenableResult<never, ErrOf<NextResult>>
		: ThenableResult<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	// Async version - returns ThenableResult
	flatMap<NextResult extends Result.AnyResult>(
		whenOk: (ok: OkType) => Promise<NextResult>,
	): [OkType] extends [never]
		? ThenableResult<never, ErrOf<NextResult>>
		: ThenableResult<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	mapErr<const NextErr>(
		whenErr: (err: ErrType) => NextErr,
	): [OkType] extends [never] ? Err<NextErr> : ThenableResult<OkType, NextErr>;

	getOrElse<HandleFn extends UnaryFn<ErrType>>(
		handle: HandleFn,
	): [OkType] extends [never]
		? Promise<ReturnType<HandleFn>>
		: Promise<OkType | ReturnType<HandleFn>>;
}

// biome-ignore lint/suspicious/noExplicitAny: any unary function
type UnaryFn<I> = (value: I) => any;

type Err<ErrType> = Result<never, ErrType>;
type Ok<OkType> = Result<OkType, never>;
type ErrOf<ResultType> = ResultType extends Result<infer OkType, infer ErrType>
	? ErrType
	: never;
type OkOf<ResultType> = ResultType extends Result<infer OkType, infer ErrType>
	? OkType
	: never;

function createThenableResult<OkType, ErrType>(
	promise: Promise<Result<OkType, ErrType>>,
): ThenableResult<OkType, ErrType> {
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

			return createThenableResult(thenable as TooComplex);
		},

		flatMap: <NextResult extends Result.AnyResult>(
			whenOk: (ok: OkType) => NextResult | Promise<NextResult>,
		) => {
			const thenable = promise.then(async (currentResult) => {
				const nextResult = currentResult.flatMap((value) =>
					Promise.resolve(whenOk(value)),
				);
				return nextResult;
			});
			return createThenableResult(thenable as TooComplex);
		},

		mapErr: <NextErr>(whenErr: (err: ErrType) => NextErr) =>
			createThenableResult(promise.then((r) => r.mapErr(whenErr))),

		getOrElse: <HandleFn extends UnaryFn<ErrType>>(handle: HandleFn) =>
			promise.then((result) => result.getOrElse(handle)),
	};

	// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
	return thenable as any;
}

// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
type TooComplex = any;

// helper function
const isDev = process.env.NODE_ENV === "development";
function freeze<T>(value: T): T {
	return isDev ? Object.freeze(value) : value;
}

// private map to store the value for internal access
// biome-ignore lint/suspicious/noExplicitAny: any result
type MapAnyResult = WeakMap<Result.AnyResult, any>;
const __privateOkMap: MapAnyResult = new WeakMap();
const __privateErrMap: MapAnyResult = new WeakMap();

function __getOkValue<OkType>(result: Result.AnyResult): OkType | null {
	if (!__privateOkMap.has(result)) {
		return null;
	}

	return __privateOkMap.get(result) as OkType;
}

function __getErrValue<ErrType>(result: Result.AnyResult): ErrType | null {
	if (!__privateErrMap.has(result)) {
		return null;
	}

	return __privateErrMap.get(result) as ErrType;
}

export namespace Result {
	// biome-ignore lint/suspicious/noExplicitAny: any result
	export type AnyResult = Result<any, any>;
	export type Thenable<OkType, ErrType> = ThenableResult<OkType, ErrType>;

	export type MustOk<OkType> = OkType extends Promise<infer NextOkType>
		? ThenableResult<NextOkType, never>
		: Ok<OkType>;
	export type MustErr<ErrType> = ErrType extends Promise<infer NextErrType>
		? ThenableResult<never, NextErrType>
		: Err<ErrType>;

	export function Ok<const OkType>(value: OkType): Ok<OkType> {
		const option: Ok<OkType> = {
			map: (whenOk: (value: OkType) => unknown | Promise<unknown>) => {
				const result = whenOk(value);
				// Check if result is a Promise
				if (result instanceof Promise) {
					return createThenableResult(
						result.then((nextOk) => Result.Ok(nextOk)),
					) as TooComplex;
				}

				return Result.Ok(result) as TooComplex;
			},
			flatMap: (whenOk: (value: OkType) => AnyResult | Promise<AnyResult>) => {
				const result = whenOk(value);
				// Check if result is a Promise
				if (result instanceof Promise) {
					return createThenableResult(result) as TooComplex;
				}

				return result as TooComplex;
			},

			mapErr: () => option as TooComplex,
			getOrElse: () => value as TooComplex,
		};

		// freeze the option to prevent mutation
		freeze(option);
		__privateOkMap.set(option, value);

		return option;
	}

	export function Err<const ErrType>(error: ErrType): Err<ErrType> {
		const errResult: Err<ErrType> = {
			map: () => errResult,
			flatMap: () => errResult as TooComplex,
			mapErr: (whenErr: UnaryFn<ErrType>) => Result.Err(whenErr(error)),
			getOrElse: (handle: UnaryFn<ErrType>) => handle(error),
		};

		freeze(errResult);
		__privateErrMap.set(errResult, error);

		return errResult;
	}

	export function tryCatch<RetType, ErrType = Error>(
		fn: () => RetType,
	): Result<RetType, ErrType> {
		try {
			return Result.Ok(fn());
		} catch (error) {
			return Result.Err(error as ErrType);
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

	export function all<const Results extends Result.AnyResult[]>(
		results: Results,
	): Result<
		OkOf<Results[number]>[],
		AggregatedResultError<ErrOf<Results[number]>>
	> {
		const okValues = results.map((result) => __getOkValue(result));

		// if some value is not OK, return the first error
		if (okValues.some((value) => value === null)) {
			const errors = results.flatMap((result) => {
				const err = __getErrValue(result) as ErrOf<Results[number]>;
				if (err === null) {
					return [];
				}
				return [err];
			});

			const aggregatedErr = Result.Err(new AggregatedResultError(errors));

			return aggregatedErr;
		}

		// everything is OK, return the values
		return Result.Ok(okValues.map((value) => value as OkOf<Results[number]>));
	}
}
