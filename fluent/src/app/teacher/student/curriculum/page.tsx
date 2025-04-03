"use client"

import { useState } from "react";

const components = {
  Home: () => <div className="p-4">🏠 Welcome to the Home Page</div>,
  Profile: () => <div className="p-4">👤 This is the Profile Section</div>,
  Settings: () => <div className="p-4">⚙️ Adjust your Settings here</div>,
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<keyof typeof components>("Home");

  const ActiveComponent = components[activeTab];

  return (
    <div className="flex h-screen">
      {/* Left Column */}
      <div className="w-1/4 bg-gray-200 p-4">
        {Object.keys(components).map((key) => (
          <button
            key={key}
            className={`block w-full text-left p-2 my-2 rounded ${
              activeTab === key ? "bg-gray-400 text-white" : "bg-gray-300"
            }`}
            onClick={() => setActiveTab(key as keyof typeof components)}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Right Content */}
      <div className="w-3/4 p-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
