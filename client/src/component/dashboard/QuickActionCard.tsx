import { Link } from "react-router-dom";

type QuickActionCardProps = {
  title: string;
  description: string;
  to: string;
  tone?: "blue" | "green" | "purple" | "amber";
};

const toneStyles = {
  blue: "border-blue-100 hover:border-blue-300 hover:bg-blue-50/50",
  green: "border-green-100 hover:border-green-300 hover:bg-green-50/50",
  purple: "border-purple-100 hover:border-purple-300 hover:bg-purple-50/50",
  amber: "border-amber-100 hover:border-amber-300 hover:bg-amber-50/50",
};

export default function QuickActionCard({
  title,
  description,
  to,
  tone = "blue",
}: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border bg-white p-5 shadow-sm transition-colors ${toneStyles[tone]}`}
    >
      <h3 className="font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </Link>
  );
}
