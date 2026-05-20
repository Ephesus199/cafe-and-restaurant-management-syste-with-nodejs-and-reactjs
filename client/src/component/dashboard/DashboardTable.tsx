import type { ReactNode } from "react";

type DashboardTableProps = {
  children: ReactNode;
};

export default function DashboardTable({ children }: DashboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm divide-y divide-gray-200">{children}</table>
    </div>
  );
}

export function DashboardTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function DashboardTableBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>;
}

export function DashboardTh({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );
}

export function DashboardTd({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-gray-700 ${className}`.trim()}>{children}</td>;
}
