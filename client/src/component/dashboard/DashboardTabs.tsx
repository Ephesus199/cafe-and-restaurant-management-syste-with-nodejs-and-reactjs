type Tab<T extends string> = {
  id: T;
  label: string;
};

type DashboardTabsProps<T extends string> = {
  tabs: Tab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
};

export default function DashboardTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: DashboardTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
