"use client";
import {
  type Dispatch,
  type PropsWithChildren,
  type Reducer,
  createContext,
  useContext,
  useReducer,
} from "react";

export function createReducerContext<Action, State>(
  reducer: Reducer<State, Action>,
  initialState: State,
) {
  const stateCtx = createContext<State>(initialState);
  const dispatchCtx = createContext<Dispatch<Action>>(() => {});

  function Provider({
    children,
    ...values
  }: PropsWithChildren<Partial<State>>) {
    const [state, dispatch] = useReducer(
      reducer,
      initialState,
      (defaultState) => ({ ...defaultState, ...values }),
    );

    return (
      <stateCtx.Provider value={state}>
        <dispatchCtx.Provider value={dispatch}>{children}</dispatchCtx.Provider>
      </stateCtx.Provider>
    );
  }

  function useDispatch() {
    return useContext(dispatchCtx);
  }

  function useStateContext() {
    return useContext(stateCtx);
  }

  return [Provider, useStateContext, useDispatch] as const;
}
