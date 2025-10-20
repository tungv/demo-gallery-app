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

		return option as Ok<OkType>;
	}

	export function Err<const ErrType>(error: ErrType): Err<ErrType> {
		const errResult = {
			map: () => errResult,
			flatMap: () => errResult,
			mapErr: (whenErr: UnaryFn<ErrType>) => Result.Err(whenErr(error)),
			getOrElse: (handle: UnaryFn<ErrType>) => handle(error),
		};
		return errResult as TooComplex;
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
}
