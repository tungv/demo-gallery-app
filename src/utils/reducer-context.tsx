"use client";
import {
  type Dispatch,
  type PropsWithChildren,
  type Reducer,
  createContext,
  memo,
  useContext,
  useMemo,
  useReducer,
} from "react";

export function createReducerContext<Action, State>(
  reducer: Reducer<State, Action>,
  initialState: State,
  displayName = "ReducerContext",
) {
  const stateCtx = createContext<State>(initialState);
  const dispatchCtx = createContext<Dispatch<Action>>(() => {});

  function Provider({
    children,
    middleware,
    ...values
  }: PropsWithChildren<Partial<State>> & {
    middleware?: (
      dispatch: Dispatch<Action>,
      getNextState: (action: Action) => State,
    ) => Dispatch<Action>;
  }) {
    const [state, dispatch] = useReducer(
      reducer,
      initialState,
      (defaultState) => ({ ...defaultState, ...values }),
    );

    const wrapped = useMemo(() => {
      return middleware
        ? middleware(dispatch, (action) => reducer(state, action))
        : dispatch;
    }, [middleware, state, reducer]);

    return (
      <stateCtx.Provider value={state}>
        <dispatchCtx.Provider value={wrapped}>{children}</dispatchCtx.Provider>
      </stateCtx.Provider>
    );
  }

  function useDispatch() {
    return useContext(dispatchCtx);
  }

  function useStateContext() {
    return useContext(stateCtx);
  }

  Provider.displayName = displayName;

  return [memo(Provider), useStateContext, useDispatch] as const;
}
