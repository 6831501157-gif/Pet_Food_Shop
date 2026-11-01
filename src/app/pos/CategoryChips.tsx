import type { Category } from "@/lib/products";

type CategoryChipsProps = {
  categories: Category[];
  /** null means "all" */
  selected: number | null;
  onSelect: (categoryId: number | null) => void;
};

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      <Chip active={selected === null} onClick={() => onSelect(null)}>
        ทั้งหมด
      </Chip>
      {categories.map((c) => (
        <Chip
          key={c.category_id}
          active={selected === c.category_id}
          onClick={() => onSelect(c.category_id)}
        >
          {c.category_name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
        active
          ? "bg-emerald-700 text-white"
          : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {children}
    </button>
  );
}
