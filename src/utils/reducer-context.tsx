"use client";

import React, {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useReducer,
} from "react";

export function createReducerContext<State, Action>(
  reducer: (state: State, action: Action) => State,
  defaultValue: State,
) {
  const StateContext = createContext<State | undefined>(undefined);
  const DispatchContext = createContext<
    React.Dispatch<Action> | undefined
  >(undefined);

  function Provider({
    children,
    ...initialState
  }: { children: ReactNode } & Partial<State>) {
    const initialStateWithDefaults = {
      ...defaultValue,
      ...initialState,
    } as State;

    const [state, dispatch] = useReducer(reducer, initialStateWithDefaults);

    return (
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
  }

  function useState() {
    const context = useContext(StateContext);
    if (context === undefined) {
      throw new Error("useState must be used within a Provider");
    }
    return context;
  }

  function useDispatch() {
    const context = useContext(DispatchContext);
    if (context === undefined) {
      throw new Error("useDispatch must be used within a Provider");
    }
    return context;
  }

  return [Provider, useState, useDispatch] as const;
}
