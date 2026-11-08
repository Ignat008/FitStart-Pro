import { useState } from 'react';
import {
  X,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import {
  getApiKey,
  saveApiKey,
  clearApiKey,
  getModel,
  saveModel,
  MODEL_OPTIONS,
  testConnection,
  type TestResult,
} from '@/openrouter';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const [key, setKey] = useState(() => getApiKey());
  const [model, setModel] = useState(() => getModel());
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  if (!open) return null;

  const handleSave = () => {
    saveApiKey(key);
    saveModel(model);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleClear = () => {
    clearApiKey();
    setKey('');
    setTestResult(null);
  };

  const handleTest = async () => {
    saveApiKey(key);
    saveModel(model);
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(key, model);
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="cyber-panel w-full max-w-lg p-6 animate-slide-up relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-px neon-divider" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text transition-colors"
          aria-label="Закрити"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/15 border border-neon-blue/40 flex items-center justify-center animate-glow-blue">
            <KeyRound size={20} className="text-neon-blue" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">API / Налаштування</h2>
            <p className="text-xs text-cyber-muted">OpenRouter — AI-тренер</p>
          </div>
        </div>

        <div className="neon-divider my-4" />

        {/* Model selector */}
        <label className="text-xs uppercase tracking-widest text-cyber-muted mb-2 flex items-center gap-2">
          <Cpu size={13} className="text-neon-pink" />
          Модель штучного інтелекту
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {MODEL_OPTIONS.map((m) => {
            const active = model === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setModel(m.id);
                  setTestResult(null);
                }}
                className={`text-left p-3 rounded-xl border transition-all ${
                  active
                    ? 'border-neon-blue bg-neon-blue/10 animate-glow-blue'
                    : 'border-cyber-border bg-cyber-bg/40 hover:border-cyber-muted/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate">{m.label}</span>
                  {m.free && (
                    <span className="shrink-0 text-[9px] uppercase tracking-wider text-neon-green border border-neon-green/40 px-1.5 py-0.5 rounded">
                      free
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-cyber-muted mt-0.5 leading-snug">{m.description}</p>
              </button>
            );
          })}
        </div>

        {/* API key */}
        <label className="text-xs uppercase tracking-widest text-cyber-muted mb-2 block">
          OpenRouter API Key
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="sk-or-v1-..."
            className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 pr-10 text-sm font-mono text-cyber-text focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/40 transition-all"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text"
            aria-label={show ? 'Сховати' : 'Показати'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Test connection result */}
        {testResult && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 animate-fade-in ${
              testResult.ok
                ? 'border-neon-green/40 bg-neon-green/5 text-neon-green'
                : 'border-neon-red/40 bg-neon-red/5 text-neon-red'
            }`}
          >
            {testResult.ok ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <XCircle size={15} className="shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{testResult.message}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={handleSave}
            className="flex-1 min-w-[140px] bg-neon-blue/15 hover:bg-neon-blue/25 border border-neon-blue/50 text-neon-blue font-semibold rounded-xl py-2.5 text-sm transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            {saved ? 'Збережено!' : 'Зберегти'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 min-w-[140px] bg-neon-green/15 hover:bg-neon-green/25 border border-neon-green/50 text-neon-green font-semibold rounded-xl py-2.5 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {testing ? 'Перевіряємо...' : 'Перевірити з\u2019єднання'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 border border-cyber-border hover:border-neon-red/50 hover:text-neon-red text-cyber-muted rounded-xl py-2.5 text-sm transition-all flex items-center gap-2"
          >
            <Trash2 size={16} />
            Очистити
          </button>
        </div>

        <div className="mt-5 p-3 rounded-xl bg-cyber-bg/60 border border-cyber-border text-xs text-cyber-muted leading-relaxed flex gap-2">
          <Cpu size={14} className="shrink-0 mt-0.5 text-neon-green" />
          <p>
            Ключ та обрана модель зберігаються лише у твоєму браузері (localStorage) і надсилаються напряму в OpenRouter.
            Без ключа застосунок працює у <span className="text-neon-green font-semibold">Fallback-режимі</span> —
            генерує плани через вбудовані алгоритмічні шаблони.
          </p>
        </div>
      </div>
    </div>
  );
}
