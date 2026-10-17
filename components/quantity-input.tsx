"use client";

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
  const parsedValue = value === "" ? Number.NaN : Number(value);
  const currentValue = Number.isSafeInteger(parsedValue) ? parsedValue : min;
  const atMinimum = value !== "" && currentValue <= min;
  const atMaximum =
    max !== undefined && value !== "" && currentValue >= max;

  const adjust = (amount: number) => {
    const nextValue = Math.max(min, currentValue + amount);
    const adjustedValue =
      max === undefined ? nextValue : Math.min(max, nextValue);
    onChange(String(adjustedValue));
    onStep?.(adjustedValue);
  };

  return (
    <div
      className={`flex min-h-12 items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        disabled={disabled || atMinimum}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => adjust(-1)}
        className="w-12 shrink-0 border-r border-slate-200 text-xl font-semibold text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:text-slate-300"
        aria-label={`Decrease ${ariaLabel}`}
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
        aria-label={`Increase ${ariaLabel}`}
      >
        +
      </button>
    </div>
  );
}
