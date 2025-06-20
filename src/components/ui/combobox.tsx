"use client";

import { cn } from "@/lib/utils";
import { createReducerContext } from "@/utils/reducer-context";
import { Slot } from "@radix-ui/react-slot";
import { createContext, useCallback, useContext, useRef } from "react";
import type {
	ChangeEvent,
	ComponentPropsWithoutRef,
	FocusEvent,
	FormEventHandler,
	SyntheticEvent,
} from "react";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import useEffectEvent from "./use-effect-event";
interface ComboboxState {
	name?: string;
	selected: string[];
	open: boolean;
	multiple: boolean;
	required?: boolean;
}

type ComboboxAction =
	| { type: "select"; value: string }
	| { type: "deselect"; value: string }
	| { type: "set_open"; open: boolean };

const defaultComboboxState: ComboboxState = {
	selected: [],
	open: false,
	multiple: false,
	required: false,
};

const [ComboboxProvider, useComboboxState, useComboboxDispatch] =
	createReducerContext(
		(state: ComboboxState, action: ComboboxAction): ComboboxState => {
			switch (action.type) {
				case "select":
					if (state.multiple) {
						return {
							...state,
							selected: [...state.selected, action.value],
						};
					}
					return {
						...state,
						selected: [action.value],
						open: false,
					};
				case "deselect":
					return {
						...state,
						selected: state.selected.filter((item) => item !== action.value),
					};
				case "set_open":
					return {
						...state,
						open: action.open,
					};

				default:
					return state;
			}
		},
		defaultComboboxState,
	);

interface ComboboxProps extends ComponentPropsWithoutRef<"select"> {
	onValueChange?: (value: string | string[]) => void;
}

function toArray(value: string | readonly string[] | number | undefined) {
	if (value === undefined) {
		return [];
	}
	return Array.isArray(value) ? value : [value];
}

function createSyntheticEvent(
	target: Element,
	nativeEvent: Event,
	isDefaultPrevented: () => boolean,
	isPropagationStopped: () => boolean,
	persist: () => void,
): SyntheticEvent {
	return {
		nativeEvent: nativeEvent,
		currentTarget: target,
		target: target,
		bubbles: nativeEvent.bubbles,
		cancelable: nativeEvent.cancelable,
		defaultPrevented: nativeEvent.defaultPrevented,
		eventPhase: nativeEvent.eventPhase,
		isTrusted: nativeEvent.isTrusted,
		preventDefault: nativeEvent.preventDefault,
		isDefaultPrevented: isDefaultPrevented,
		stopPropagation: nativeEvent.stopPropagation,
		isPropagationStopped: isPropagationStopped,
		persist: persist,
		timeStamp: nativeEvent.timeStamp,
		type: nativeEvent.type,
	};
}

function Combobox({
	name,
	multiple,
	value,
	onValueChange,
	defaultValue,
	required = false,
	children,
	onBlur,
	onChange,
	onInvalid,
}: ComboboxProps) {
	// cannot accept both value and defaultValue
	if (value !== undefined && defaultValue !== undefined) {
		throw new Error("Cannot accept both value and defaultValue");
	}

	const selectRef = useRef<HTMLSelectElement>(null);

	const selected = value
		? toArray(value)
		: defaultValue
			? toArray(defaultValue)
			: [];

	const onChangeEvent = useEffectEvent(() => {
		if (typeof onChange === "function" && selectRef.current) {
			// create a new synthetic change event and dispatch it
			const changeEvent = new Event("change", {
				bubbles: true,
				cancelable: true,
			});

			const syntheticChangeEvent = createSyntheticEvent(
				selectRef.current,
				changeEvent,
				() => false,
				() => false,
				() => {},
			) as ChangeEvent<HTMLSelectElement>;

			onChange(syntheticChangeEvent);
		}
	});

	const onBlurEvent = useEffectEvent(() => {
		if (typeof onBlur === "function" && selectRef.current) {
			// create a new synthetic focus event and dispatch it
			const focusEvent = new FocusEvent("focus", {
				bubbles: true,
				cancelable: true,
			});

			const syntheticBlurEvent = createSyntheticEvent(
				selectRef.current,
				focusEvent,
				() => false,
				() => false,
				() => {},
			) as FocusEvent<HTMLSelectElement>;

			onBlur(syntheticBlurEvent);
		}
	});

	const onValueChangeEvent = useEffectEvent((value: string | string[]) => {
		if (typeof onValueChange === "function") {
			onValueChange(value);
		}
	});

	const middleware = useCallback(
		(
			dispatch: ReturnType<typeof useComboboxDispatch>,
			getNextState: (action: ComboboxAction) => ComboboxState,
		) =>
			(action: ComboboxAction) => {
				dispatch(action);
				if (action.type === "select" || action.type === "deselect") {
					const state = getNextState(action);
					onValueChangeEvent(state.selected);
				}

				if (action.type === "select" || action.type === "deselect") {
					onChangeEvent();
				}

				if (action.type === "set_open" && !action.open) {
					onBlurEvent();
				}
			},
		[onValueChangeEvent, onChangeEvent, onBlurEvent],
	);

	return (
		<ComboboxProvider
			name={name}
			selected={selected}
			multiple={multiple ?? false}
			required={required}
			middleware={middleware}
		>
			<ComboboxImpl>
				{children}
				<HiddenInputs selectRef={selectRef} onInvalid={onInvalid} />
			</ComboboxImpl>
		</ComboboxProvider>
	);
}

function ComboboxImpl({ children }: { children: React.ReactNode }) {
	const dispatch = useComboboxDispatch();
	const state = useComboboxState();

	return (
		<Popover
			open={state.open}
			onOpenChange={(open) => {
				dispatch({ type: "set_open", open });
			}}
		>
			{children}
		</Popover>
	);
}

function HiddenInputs({
	selectRef,
	onInvalid,
}: {
	selectRef: React.RefObject<HTMLSelectElement | null>;
	onInvalid?: FormEventHandler<HTMLSelectElement>;
}) {
	const { selected, name, required, multiple } = useComboboxState();

	return (
		<select
			hidden
			ref={selectRef}
			name={name}
			multiple={multiple}
			value={selected}
			onChange={() => {}}
			onInvalid={onInvalid}
			required={required}
			tabIndex={-1}
			aria-hidden="true"
		>
			{selected.map((value) => (
				<option key={value} value={value}>
					{value}
				</option>
			))}
		</select>
	);
}

function ComboboxTrigger({
	className,
	children,
	asChild = false,
	...props
}: React.ComponentPropsWithoutRef<typeof PopoverTrigger> & {
	asChild?: boolean;
}) {
	return (
		<PopoverTrigger
			asChild={asChild}
			className={cn("flex w-full justify-between", className)}
			{...props}
		>
			{children}
		</PopoverTrigger>
	);
}

function ComboboxContent({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof PopoverContent>) {
	return (
		<PopoverContent className="w-[200px] p-0" {...props}>
			<Command className={cn("max-h-[300px] overflow-y-auto p-1", className)}>
				{children}
			</Command>
		</PopoverContent>
	);
}

function ComboboxInput({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof CommandInput>) {
	return (
		<div className="flex items-center border-b px-3">
			<CommandInput
				className={cn(
					"placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

function ComboboxOptions({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof CommandList>) {
	return (
		<CommandList
			className={cn("max-h-[300px] overflow-y-auto p-1", className)}
			{...props}
		>
			{children}
		</CommandList>
	);
}

const comboboxOptionValueContext = createContext<string | undefined>(undefined);

function ComboboxOption({
	className,
	children,
	value,
	...props
}: React.ComponentPropsWithoutRef<typeof CommandItem> & {
	value: string;
}) {
	const state = useComboboxState();
	const dispatch = useComboboxDispatch();
	const selected = state.selected.includes(value);

	return (
		<CommandItem
			className={cn(
				"flex flex-row justify-between gap-2",
				{
					"bg-accent text-accent-foreground": selected,
				},
				className,
			)}
			value={value}
			onSelect={(currentValue) => {
				if (selected) {
					dispatch({ type: "deselect", value: currentValue });
				} else {
					dispatch({ type: "select", value: currentValue });
				}
			}}
			{...props}
		>
			<comboboxOptionValueContext.Provider value={value}>
				{children}
			</comboboxOptionValueContext.Provider>
		</CommandItem>
	);
}

function ComboboxIndicator({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<"span">) {
	const state = useComboboxState();
	const value = useContext(comboboxOptionValueContext);

	if (value === undefined) {
		return null;
	}

	const selected = state.selected.includes(value);

	return (
		<Slot
			className={cn({
				"opacity-100": selected,
				"opacity-0": !selected,
			})}
			aria-hidden={!selected}
			{...props}
		>
			{children}
		</Slot>
	);
}

function ComboboxEmpty({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof CommandEmpty>) {
	return (
		<CommandEmpty
			className={cn("py-6 text-center text-sm", className)}
			{...props}
		>
			{children}
		</CommandEmpty>
	);
}

export function ComboboxValues({
	placeholder,
	locale,
}: {
	placeholder: string;
	locale?: string;
}) {
	const state = useComboboxState();
	if (state.selected.length === 0) {
		return placeholder;
	}

	const listFormat = new Intl.ListFormat(locale, {
		style: "long",
		type: "conjunction",
	});

	const parts = listFormat.formatToParts(state.selected);

	return (
		<span className="truncate">
			{parts.map((part, index) => {
				if (part.type === "element") {
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: just a span without state
						<span className="font-semibold" key={index}>
							{part.value}
						</span>
					);
				}
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: just a span without state
					<span className="text-muted-foreground" key={index}>
						{part.value}
					</span>
				);
			})}
		</span>
	);
}

export function useSelectedValues() {
	const state = useComboboxState();
	return state.selected;
}

export {
	Combobox,
	ComboboxTrigger,
	ComboboxContent,
	ComboboxInput,
	ComboboxOptions,
	ComboboxOption,
	ComboboxIndicator,
	ComboboxEmpty,
};
