import React from 'react';
import Header from "../components/layout/Header";
import OptionsVisualization from "../components/OptionsVisualization/OptionsVisualization";

export default function OptionsPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <OptionsVisualization />
      </main>
    </div>
  );
}
