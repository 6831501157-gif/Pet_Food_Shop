type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Layout and vertical padding, e.g. "flex-1 py-2" */
  className?: string;
};

export function SearchInput({ value, onChange, className = "" }: SearchInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="ค้นหาชื่อสินค้าหรือรหัส…"
      className={`rounded-lg border border-stone-300 bg-white px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 ${className}`}
    />
  );
}
