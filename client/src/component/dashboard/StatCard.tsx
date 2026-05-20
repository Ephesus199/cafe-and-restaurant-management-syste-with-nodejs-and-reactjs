type StatTone = "blue" | "green" | "purple" | "amber" | "red" | "orange";

const toneStyles: Record<StatTone, { card: string; label: string; value: string }> = {
  blue: {
    card: "bg-blue-50 border-blue-100",
    label: "text-blue-700",
    value: "text-blue-900",
  },
  green: {
    card: "bg-green-50 border-green-100",
    label: "text-green-700",
    value: "text-green-900",
  },
  purple: {
    card: "bg-purple-50 border-purple-100",
    label: "text-purple-700",
    value: "text-purple-900",
  },
  amber: {
    card: "bg-amber-50 border-amber-100",
    label: "text-amber-700",
    value: "text-amber-900",
  },
  red: {
    card: "bg-red-50 border-red-100",
    label: "text-red-700",
    value: "text-red-900",
  },
  orange: {
    card: "bg-orange-50 border-orange-100",
    label: "text-orange-700",
    value: "text-orange-900",
  },
};

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: StatTone;
};

export default function StatCard({ label, value, tone = "blue" }: StatCardProps) {
  const styles = toneStyles[tone];
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${styles.card}`}>
      <p className={`text-sm font-semibold ${styles.label}`}>{label}</p>
      <p className={`text-3xl font-extrabold mt-2 tracking-tight ${styles.value}`}>{value}</p>
    </div>
  );
}
