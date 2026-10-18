"use client";

import { useState } from "react";

type QuantityInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  onBlur?: () => void;
  onStep?: (value: number) => void;
  ariaLabel: string;
};

export function QuantityInput({
  id,
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  onBlur,
  onStep,
  ariaLabel,
}: QuantityInputProps) {
  const [stepSize, setStepSize] = useState("1");
  const parsedValue = value === "" ? Number.NaN : Number(value);
  const currentValue = Number.isSafeInteger(parsedValue) ? parsedValue : min;
  const parsedStep = Number(stepSize);
  const amount =
    Number.isSafeInteger(parsedStep) && parsedStep > 0
      ? parsedStep
      : 1;
  const atMinimum = value === "" || currentValue <= min;
  const atMaximum =
    max !== undefined && value !== "" && currentValue >= max;

  const adjust = (direction: -1 | 1) => {
    const startingValue = value === "" && direction > 0 ? min - amount : currentValue;
    const nextValue = Math.max(min, startingValue + direction * amount);
    const adjustedValue =
      max === undefined ? nextValue : Math.min(max, nextValue);
    onChange(String(adjustedValue));
    onStep?.(adjustedValue);
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div
        className={`flex min-h-12 min-w-36 flex-1 items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <button
          type="button"
          disabled={disabled || atMinimum}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => adjust(-1)}
          className="w-12 shrink-0 border-r border-slate-200 text-xl font-semibold text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label={`Decrease ${ariaLabel} by ${amount}`}
        >
          −
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          onBlur={onBlur}
          className="min-w-0 flex-1 bg-transparent px-2 text-center text-base font-semibold text-slate-900 outline-none disabled:cursor-not-allowed"
          aria-label={ariaLabel}
        />
        <button
          type="button"
          disabled={disabled || atMaximum}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => adjust(1)}
          className="w-12 shrink-0 border-l border-slate-200 text-xl font-semibold text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label={`Increase ${ariaLabel} by ${amount}`}
        >
          +
        </button>
      </div>
      <label className="grid w-20 shrink-0 gap-1 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Change by
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={stepSize}
          disabled={disabled}
          onChange={(event) =>
            setStepSize(event.target.value.replace(/\D/g, "").slice(0, 10))
          }
          onBlur={() => {
            if (!Number.isSafeInteger(Number(stepSize)) || Number(stepSize) < 1) {
              setStepSize("1");
            }
          }}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-2 text-center text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed"
          aria-label={`Amount to change ${ariaLabel} by`}
        />
      </label>
    </div>
  );
}
