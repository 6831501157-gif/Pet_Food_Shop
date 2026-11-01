type StepperButtonProps = {
  step: -1 | 1;
  /** Accessible name, e.g. "ลดสต็อก" */
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/** Small square −/+ button */
export function StepperButton({ step, label, onClick, disabled }: StepperButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-7 w-7 shrink-0 rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
    >
      {step < 0 ? "−" : "+"}
    </button>
  );
}
