export type TabType = "Live" | "Ended";

interface TabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function Tabs({ activeTab, setActiveTab }: TabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
        <div className="flex">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "Live"
                ? "border-b-2 border-surface-on text-surface-on"
                : "text-surface-on-var mb-px"
            }`}
            onClick={() => setActiveTab("Live")}
          >
            Live
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "Ended"
                ? "border-b-2 border-surface-on text-surface-on"
                : "text-surface-on-var mb-px"
            }`}
            onClick={() => setActiveTab("Ended")}
          >
            Ended
          </button>
        </div>
      </div>
  );
}