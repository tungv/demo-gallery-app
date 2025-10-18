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

	async(): Promise<Result<Awaited<OkType>, Awaited<ErrType>>>;
}

// biome-ignore lint/suspicious/noExplicitAny: any unary function
type UnaryFn<I> = (value: I) => any;

type Err<ErrType> = Result<never, ErrType>;
type Ok<OkType> = Result<OkType, never>;
type ErrOf<ResultType> = ResultType extends Err<infer Err> ? Err : never;
type OkOf<ResultType> = ResultType extends Ok<infer OkType> ? OkType : never;

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
			async async() {
				// at this point, what we have is a Result<Promise<NextOk>, Promise<NextErr>>
				// we need to return a Promise<Result<NextOk, NextErr>>

				const result = await value;
				return Result.Ok(result);
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
			async async() {
				const result = await error;
				return Result.Err(result);
			},
		} as Err<ErrType>;
		return errResult;
	}
}
