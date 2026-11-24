/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SimulationConfig, GlobalSettings, Vector2 } from '../types';
import Canvas from './Canvas';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Pause,
  Play,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface FocusSimulationModalProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const FocusSimulationModal: React.FC<FocusSimulationModalProps> = ({
  config,
  globalSettings,
  isPlaying,
  onTogglePlay,
  onClose,
  onPrev,
  onNext,
}) => {
  const [localConfig, setLocalConfig] = useState<SimulationConfig>(config);
  const [resetKey, setResetKey] = useState(0);
  const [showTuner, setShowTuner] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [tiltGravity, setTiltGravity] = useState<Vector2 | null>(null);
  const [sensorError, setSensorError] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(config);
    setResetKey((k) => k + 1);
  }, [config]);

  useEffect(() => {
    if (!tiltEnabled) {
      setTiltGravity(null);
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      // gamma: left/right tilt (-90..90), beta: front/back tilt (-180..180)
      const gx = Math.max(-1, Math.min(1, event.gamma / 45));
      const gy = Math.max(-1, Math.min(1, event.beta / 45));
      setTiltGravity({ x: gx, y: gy });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [tiltEnabled]);

  const toggleTiltSensor = async () => {
    setSensorError(null);
    if (tiltEnabled) {
      setTiltEnabled(false);
      return;
    }

    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setSensorError('Thiết bị không hỗ trợ cảm biến nghiêng.');
      return;
    }

    const DeviceOrientationAny = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientationAny.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationAny.requestPermission();
        if (res !== 'granted') {
          setSensorError('Chưa được cấp quyền cảm biến nghiêng.');
          return;
        }
      } catch {
        setSensorError('Không thể kích hoạt cảm biến nghiêng.');
        return;
      }
    }

    setTiltEnabled(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Top Android App Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-950/90 border-b border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-200 active:bg-gray-800"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-cyan-400 truncate">
              {localConfig.name}
            </h2>
            <p className="text-[11px] text-gray-400 truncate">
              Chạm vào hình để đẩy bóng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={toggleTiltSensor}
            className={`p-2 rounded-lg border transition-colors ${
              tiltEnabled
                ? 'bg-cyan-500 text-black border-cyan-400'
                : 'bg-gray-900 text-gray-300 border-gray-800 active:bg-gray-800'
            }`}
            title="Trọng lực theo độ nghiêng máy"
            aria-label="Trọng lực theo độ nghiêng máy"
          >
            <Compass size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowTuner((s) => !s)}
            className={`p-2 rounded-lg border transition-colors ${
              showTuner
                ? 'bg-cyan-500 text-black border-cyan-400'
                : 'bg-gray-900 text-gray-300 border-gray-800 active:bg-gray-800'
            }`}
            title="Tùy chỉnh thông số"
            aria-label="Tùy chỉnh thông số"
          >
            <SlidersHorizontal size={18} />
          </button>
          <button
            type="button"
            onClick={() => setResetKey((k) => k + 1)}
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-200 active:bg-gray-800"
            title="Khởi động lại"
            aria-label="Khởi động lại"
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className={`p-2 rounded-lg border ${
              isPlaying
                ? 'bg-gray-900 border-gray-800 text-red-400'
                : 'bg-cyan-500 border-cyan-400 text-black'
            }`}
            title={isPlaying ? 'Tạm dừng' : 'Tiếp tục'}
            aria-label={isPlaying ? 'Tạm dừng' : 'Tiếp tục'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>
      </div>

      {sensorError && (
        <div className="px-4 py-1.5 bg-amber-950/70 border-b border-amber-800/50 text-amber-300 text-xs text-center">
          {sensorError}
        </div>
      )}

      {/* Main Interactive Canvas */}
      <div className="flex-1 relative min-h-0 flex items-center justify-center bg-black p-2">
        <div className="w-full h-full max-w-[640px] max-h-[640px] aspect-square mx-auto">
          <Canvas
            key={resetKey}
            config={localConfig}
            globalSettings={globalSettings}
            interactive
            tiltGravity={tiltGravity}
          />
        </div>
      </div>

      {/* Optional Local Parameter Tuner */}
      {showTuner && (
        <div className="bg-gray-950 border-t border-gray-800 px-4 py-3 grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-gray-400">
            <span className="flex justify-between">
              <span>Số lượng bóng</span>
              <span className="text-cyan-400">{localConfig.ballCount}</span>
            </span>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={localConfig.ballCount}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  ballCount: parseInt(e.target.value, 10),
                }))
              }
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none accent-cyan-400"
            />
          </label>

          <label className="space-y-1 text-xs text-gray-400">
            <span className="flex justify-between">
              <span>Kích thước bóng</span>
              <span className="text-cyan-400">{localConfig.ballSize}px</span>
            </span>
            <input
              type="range"
              min="2"
              max="28"
              step="1"
              value={localConfig.ballSize}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  ballSize: parseInt(e.target.value, 10),
                }))
              }
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none accent-cyan-400"
            />
          </label>

          <label className="space-y-1 text-xs text-gray-400">
            <span className="flex justify-between">
              <span>Trọng lực riêng</span>
              <span className="text-cyan-400">{localConfig.gravity.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min="-0.3"
              max="0.6"
              step="0.02"
              value={localConfig.gravity}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  gravity: parseFloat(e.target.value),
                }))
              }
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none accent-cyan-400"
            />
          </label>

          <label className="space-y-1 text-xs text-gray-400">
            <span className="flex justify-between">
              <span>Tốc độ xoay riêng</span>
              <span className="text-cyan-400">
                {localConfig.rotationSpeed.toFixed(3)}
              </span>
            </span>
            <input
              type="range"
              min="-0.05"
              max="0.05"
              step="0.002"
              value={localConfig.rotationSpeed}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  rotationSpeed: parseFloat(e.target.value),
                }))
              }
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none accent-cyan-400"
            />
          </label>
        </div>
      )}

      {/* Bottom Preset Switcher */}
      <div className="bg-gray-950 border-t border-gray-800 px-3 py-2.5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs font-medium text-gray-200 active:bg-gray-800"
        >
          <ChevronLeft size={16} />
          <span>Trước</span>
        </button>
        <p className="text-xs text-gray-400 text-center line-clamp-2 flex-1">
          {localConfig.nuanceDescription}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs font-medium text-gray-200 active:bg-gray-800"
        >
          <span>Sau</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default FocusSimulationModal;
