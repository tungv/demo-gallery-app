/**
 * @author: Tung Vu <me@tungv.com>
 * @description: Result<Ok, Err> for error handling
 */

export interface Result<OkType, ErrType> {
	map<NextOk>(
		whenOk: (ok: OkType) => NextOk,
	): [OkType] extends [never] ? Err<ErrType> : Result<NextOk, ErrType>;

	flatMap<NextResult extends Result.AnyResult>(
		whenOk: (ok: OkType) => NextResult,
	): [OkType] extends [never]
		? Result<never, ErrOf<NextResult>>
		: Result<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;

	mapErr<const NextErr>(
		whenErr: (err: ErrType) => NextErr,
	): [OkType] extends [never] ? Err<NextErr> : Result<OkType, NextErr>;

	getOrElse<HandleFn extends UnaryFn<ErrType>>(
		handle: HandleFn,
	): [OkType] extends [never]
		? ReturnType<HandleFn>
		: OkType | ReturnType<HandleFn>;

	// async
	mapAsync<NextOk>(
		whenOk: (ok: OkType) => Promise<NextOk>,
	): [OkType] extends [never] ? Err<ErrType> : ThenableResult<NextOk, ErrType>;

	flatMapAsync<NextResult extends Result.AnyResult>(
		whenOk: (ok: OkType) => Promise<NextResult>,
	): [OkType] extends [never]
		? ThenableResult<never, ErrOf<NextResult>>
		: ThenableResult<OkOf<NextResult>, ErrType | ErrOf<NextResult>>;
}

export interface ThenableResult<OkType, ErrType>
	extends Omit<Result<OkType, ErrType>, "getOrElse">,
		PromiseLike<Result<OkType, ErrType>> {
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
type ErrOf<ResultType> = ResultType extends Err<infer Err> ? Err : never;
type OkOf<ResultType> = ResultType extends Ok<infer OkType> ? OkType : never;

function createThenableResult<OkType, ErrType>(
	promise: Promise<Result<OkType, ErrType>>,
): ThenableResult<OkType, ErrType> {
	const thenable = {
		// biome-ignore lint/suspicious/noThenProperty: Required for PromiseLike interface
		then: promise.then.bind(promise),
		map: <NextOk>(whenOk: (ok: OkType) => NextOk) =>
			createThenableResult(promise.then((r) => r.map(whenOk))),

		flatMap: <NextResult extends Result.AnyResult>(
			whenOk: (ok: OkType) => NextResult,
		) => createThenableResult(promise.then((r) => r.flatMap(whenOk))),

		mapErr: <NextErr>(whenErr: (err: ErrType) => NextErr) =>
			createThenableResult(promise.then((r) => r.mapErr(whenErr))),

		getOrElse: <HandleFn extends UnaryFn<ErrType>>(handle: HandleFn) =>
			promise.then((result) => result.getOrElse(handle)),

		flatMapAsync: <NextResult extends Result.AnyResult>(
			whenOk: (ok: OkType) => Promise<NextResult>,
		) => createThenableResult(promise.then((r) => r.flatMapAsync(whenOk))),

		mapAsync: <NextOk>(whenOk: (ok: OkType) => Promise<NextOk>) =>
			createThenableResult(promise.then((r) => r.mapAsync(whenOk))),
	};

	// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
	return thenable as any;
}

export namespace Result {
	// biome-ignore lint/suspicious/noExplicitAny: any result
	export type AnyResult = Result<any, any>;

	export function Ok<OkType>(value: OkType): Ok<OkType> {
		const option: Ok<OkType> = {
			map: (whenOk) => {
				const nextOk = whenOk(value);
				// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
				return Result.Ok(nextOk) as any;
			},
			flatMap: (whenOk: (value: OkType) => AnyResult) =>
				// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
				whenOk(value) as any,
			// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
			mapErr: () => option as any,
			// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
			getOrElse: () => value as any,

			mapAsync: (whenOk) => {
				const promise = whenOk(value).then((result) => Result.Ok(result));

				// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
				return createThenableResult(promise) as any;
			},

			flatMapAsync: (whenOk) => {
				const promise = whenOk(value);

				// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
				return createThenableResult(promise) as any;
			},
		};

		return option as Ok<OkType>;
	}

	export function Err<const ErrType>(error: ErrType): Err<ErrType> {
		const errResult = {
			map: () => errResult,
			flatMap: () => errResult,
			mapErr: (whenErr) => Result.Err(whenErr(error)),
			getOrElse: (handle) => handle(error),
			flatMapAsync: () =>
				// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
				createThenableResult(Promise.resolve(errResult)) as any,
			mapAsync: () =>
				// biome-ignore lint/suspicious/noExplicitAny: this is very complicated to type
				createThenableResult(Promise.resolve(errResult)) as any,
		} as Err<ErrType>;
		return errResult;
	}
}
