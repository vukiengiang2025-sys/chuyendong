/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { presets } from './utils/presets';
import SimulationCard from './components/SimulationCard';
import FocusSimulationModal from './components/FocusSimulationModal';
import { GlobalSettings, SimulationConfig } from './types';
import { Play, Pause, Activity, SlidersHorizontal, RotateCcw } from 'lucide-react';

type ShapeFilter = 'all' | SimulationConfig['shapeType'];

const SHAPE_FILTERS: { id: ShapeFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'triangle', label: 'Tam giác' },
  { id: 'square', label: 'Vuông' },
  { id: 'pentagon', label: 'Ngũ giác' },
  { id: 'hexagon', label: 'Lục giác' },
  { id: 'octagon', label: 'Bát giác' },
];

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  timeScale: 1.0,
  gravityMultiplier: 1.0,
  rotationMultiplier: 1.0,
  bouncinessMultiplier: 1.0,
};

const App: React.FC = () => {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(
    DEFAULT_GLOBAL_SETTINGS
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [shapeFilter, setShapeFilter] = useState<ShapeFilter>('all');
  const [selectedConfig, setSelectedConfig] = useState<SimulationConfig | null>(
    null
  );

  const filteredPresets = useMemo(() => {
    if (shapeFilter === 'all') return presets;
    return presets.filter((preset) => preset.shapeType === shapeFilter);
  }, [shapeFilter]);

  const togglePlay = () => {
    if (isPlaying) {
      setGlobalSettings((prev) => ({ ...prev, timeScale: 0 }));
    } else {
      setGlobalSettings((prev) => ({
        ...prev,
        timeScale: prev.timeScale > 0 ? prev.timeScale : 1,
      }));
    }
    setIsPlaying((prev) => !prev);
  };

  const resetGlobalSettings = () => {
    setGlobalSettings(DEFAULT_GLOBAL_SETTINGS);
    setIsPlaying(true);
  };

  // Handle Android hardware back button via browser history state
  useEffect(() => {
    const handlePopState = () => {
      setSelectedConfig(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openFocusModal = (config: SimulationConfig) => {
    window.history.pushState({ modal: config.id }, '');
    setSelectedConfig(config);
  };

  const closeFocusModal = () => {
    if (window.history.state?.modal) {
      window.history.back();
    } else {
      setSelectedConfig(null);
    }
  };

  const stepSelected = (delta: number) => {
    if (!selectedConfig) return;
    const list = filteredPresets.length > 0 ? filteredPresets : presets;
    const idx = list.findIndex((p) => p.id === selectedConfig.id);
    const nextIdx = (idx + delta + list.length) % list.length;
    setSelectedConfig(list[nextIdx]);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-cyan-500 selection:text-black pb-[env(safe-area-inset-bottom)]">
      {/* Sticky Header Controls */}
      <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 shadow-2xl pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">
            {/* Title & Mobile Quick Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <Activity className="text-cyan-400" size={20} />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                    Mô phỏng <span className="text-cyan-400">Vật lý</span>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={togglePlay}
                  className={`p-2 rounded-lg border ${
                    isPlaying
                      ? 'bg-gray-800 border-gray-700 text-red-400'
                      : 'bg-cyan-500 border-cyan-400 text-black'
                  }`}
                  aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileControlsOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium ${
                    mobileControlsOpen
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-gray-800 text-gray-200 border-gray-700'
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  <span>Điều khiển</span>
                </button>
              </div>
            </div>

            {/* Controls Grid (always visible on desktop, toggleable on mobile) */}
            <div
              className={`${
                mobileControlsOpen ? 'grid' : 'hidden lg:grid'
              } flex-1 grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end pt-2 lg:pt-0 border-t border-gray-800 lg:border-t-0`}
            >
              {/* Time/Speed Control */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 flex justify-between">
                  <span>Tốc độ Mô phỏng</span>
                  <span className="text-cyan-400">
                    {isPlaying ? globalSettings.timeScale.toFixed(1) + 'x' : 'TẠM DỪNG'}
                  </span>
                </label>
                <div className="flex items-center gap-2 h-7">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className={`hidden lg:flex p-1.5 rounded ${
                      isPlaying
                        ? 'bg-gray-800 hover:bg-gray-700 text-red-400'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                    }`}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={isPlaying ? globalSettings.timeScale : 1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isPlaying) setIsPlaying(true);
                      setGlobalSettings((p) => ({ ...p, timeScale: val }));
                    }}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Gravity Control */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 flex justify-between">
                  <span>Trọng lực</span>
                  <span className="text-cyan-400">
                    {globalSettings.gravityMultiplier.toFixed(1)}x
                  </span>
                </label>
                <div className="flex items-center h-7">
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={globalSettings.gravityMultiplier}
                    onChange={(e) =>
                      setGlobalSettings((p) => ({
                        ...p,
                        gravityMultiplier: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Rotation Control */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 flex justify-between">
                  <span>Tốc độ xoay</span>
                  <span className="text-cyan-400">
                    {globalSettings.rotationMultiplier.toFixed(1)}x
                  </span>
                </label>
                <div className="flex items-center h-7">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={globalSettings.rotationMultiplier}
                    onChange={(e) =>
                      setGlobalSettings((p) => ({
                        ...p,
                        rotationMultiplier: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Restitution Control */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 flex justify-between">
                  <span>Độ nảy</span>
                  <span className="text-cyan-400">
                    {globalSettings.bouncinessMultiplier.toFixed(1)}x
                  </span>
                </label>
                <div className="flex items-center gap-2 h-7">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={globalSettings.bouncinessMultiplier}
                    onChange={(e) =>
                      setGlobalSettings((p) => ({
                        ...p,
                        bouncinessMultiplier: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={resetGlobalSettings}
                    className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                    title="Đặt lại mặc định"
                    aria-label="Đặt lại mặc định"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Shape Filter Bar */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SHAPE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setShapeFilter(filter.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                  shapeFilter === filter.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 justify-items-center">
          {filteredPresets.map((preset) => (
            <SimulationCard
              key={preset.id}
              config={preset}
              globalSettings={globalSettings}
              onSelect={openFocusModal}
            />
          ))}
        </div>
      </main>

      {selectedConfig && (
        <FocusSimulationModal
          config={selectedConfig}
          globalSettings={globalSettings}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onClose={closeFocusModal}
          onPrev={() => stepSelected(-1)}
          onNext={() => stepSelected(1)}
        />
      )}
    </div>
  );
};

export default App;