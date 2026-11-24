/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationConfig, GlobalSettings } from '../types';
import Canvas from './Canvas';
import { Info, RefreshCw, Maximize2 } from 'lucide-react';

interface SimulationCardProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
  onSelect: (config: SimulationConfig) => void;
}

const SimulationCard: React.FC<SimulationCardProps> = ({
  config,
  globalSettings,
  onSelect,
}) => {
  const [resetKey, setResetKey] = React.useState(0);

  return (
    <div
      onClick={() => onSelect(config)}
      className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:border-cyan-500/50 active:scale-[0.99] transition-all duration-200 flex flex-col relative group w-full max-w-sm cursor-pointer"
    >
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-10 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-white/10 max-w-[65%]">
          <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider truncate">
            {config.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setResetKey((k) => k + 1);
            }}
            className="bg-black/70 backdrop-blur-sm p-2 rounded-lg border border-white/10 text-gray-300 hover:text-white active:bg-white/20 transition-colors cursor-pointer"
            title="Khởi động lại"
            aria-label="Khởi động lại"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(config);
            }}
            className="bg-black/70 backdrop-blur-sm p-2 rounded-lg border border-white/10 text-cyan-400 hover:text-cyan-300 active:bg-cyan-500/20 transition-colors cursor-pointer"
            title="Mở toàn màn hình"
            aria-label="Mở toàn màn hình"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow relative aspect-square bg-black">
        <Canvas key={resetKey} config={config} globalSettings={globalSettings} />
      </div>

      {/* Footer Info */}
      <div className="bg-gray-950 p-3 border-t border-gray-800">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {config.nuanceDescription}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
            Trọng lực: {config.gravity}x
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
            Bóng: {config.ballCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimulationCard;