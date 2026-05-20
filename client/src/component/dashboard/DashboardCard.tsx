import type { ReactNode } from "react";

type DashboardCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function DashboardCard({
  title,
  description,
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <section
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`.trim()}
    >
      {title ? (
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
        </div>
      ) : null}
      <div className={title ? "p-5" : "p-5"}>{children}</div>
    </section>
  );
}
