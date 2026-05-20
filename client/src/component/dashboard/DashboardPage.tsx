import type { ReactNode } from "react";

type DashboardPageProps = {
  children: ReactNode;
  className?: string;
};

export default function DashboardPage({ children, className = "" }: DashboardPageProps) {
  return <div className={`p-6 lg:p-8 max-w-7xl mx-auto w-full ${className}`.trim()}>{children}</div>;
}
