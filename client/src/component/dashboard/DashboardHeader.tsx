import type { ReactNode } from "react";

type DashboardHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function DashboardHeader({ title, description, actions }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-gray-500 mt-2 max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
