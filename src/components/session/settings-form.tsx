"use client";

import { useSettings } from "@/components/settings-context";
import { PRICE_MODE_LABELS } from "@/lib/pricing/resolve-card-price";
import type { PriceMode } from "@/types";

function NumberField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-mist-300">{props.label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={props.step ?? "0.01"}
          value={Number.isFinite(props.value) ? props.value : 0}
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value);
            props.onChange(Number.isFinite(v) && v >= 0 ? v : 0);
          }}
          className="w-36 rounded-lg bg-ink-900 border border-ink-700 px-3 py-2.5 min-h-11 num"
        />
        {props.suffix && <span className="text-mist-500 text-sm">{props.suffix}</span>}
      </div>
      {props.hint && <span className="text-xs text-mist-500">{props.hint}</span>}
    </label>
  );
}

function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2.5 min-h-11 cursor-pointer">
      <span className="text-sm">{props.label}</span>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="h-5 w-5 accent-[#8fb6ff]"
      />
    </label>
  );
}

export function SettingsForm() {
  const { settings, updateSettings, hydrated } = useSettings();

  if (!hydrated) {
    return <div className="panel h-64 animate-pulse" aria-busy="true" />;
  }

  return (
    <div className="space-y-8">
      <section className="panel p-5 space-y-5">
        <h2 className="font-semibold">Preise und Berechnung</h2>
        <label className="block">
          <span className="text-sm text-mist-300">Preisbasis</span>
          <select
            value={settings.priceMode}
            onChange={(e) => updateSettings({ priceMode: e.target.value as PriceMode })}
            className="mt-1 w-full rounded-lg bg-ink-900 border border-ink-700 px-3 py-2.5 min-h-11"
          >
            {(Object.keys(PRICE_MODE_LABELS) as PriceMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {PRICE_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>
        <NumberField
          label="Verkaufsgebühr"
          value={settings.sellingFeePercent}
          onChange={(v) => updateSettings({ sellingFeePercent: Math.min(v, 100) })}
          step="0.1"
          suffix="%"
        />
        <NumberField
          label="Fixe Verkaufskosten"
          value={settings.fixedSellingCosts}
          onChange={(v) => updateSettings({ fixedSellingCosts: v })}
          suffix="€"
        />
        <NumberField
          label="Bulk-Schwellenwert"
          value={settings.bulkThreshold}
          onChange={(v) => updateSettings({ bulkThreshold: v })}
          suffix="€"
          hint="Karten unterhalb dieses Werts können automatisch aufgedeckt werden."
        />
        <NumberField
          label="Standard-Boosterpreis"
          value={settings.defaultPackPrice}
          onChange={(v) => updateSettings({ defaultPackPrice: v })}
          suffix="€"
          hint="Wird verwendet, solange für ein Set noch kein eigener Preis gespeichert ist."
        />
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold mb-2">Darstellung und Verhalten</h2>
        <Toggle
          label="Animationen"
          checked={settings.animationsEnabled}
          onChange={(v) => updateSettings({ animationsEnabled: v })}
        />
        <Toggle
          label="Reduzierte Animationen"
          checked={settings.reducedAnimations}
          onChange={(v) => updateSettings({ reducedAnimations: v })}
        />
        <Toggle
          label="Sound"
          checked={settings.soundEnabled}
          onChange={(v) => updateSettings({ soundEnabled: v })}
        />
        <Toggle
          label="Automatische Kartenaufdeckung"
          checked={settings.autoReveal}
          onChange={(v) => updateSettings({ autoReveal: v })}
        />
        <Toggle
          label="Dark Mode als Standard"
          checked={settings.darkMode}
          onChange={(v) => updateSettings({ darkMode: v })}
        />
        <Toggle
          label="Session automatisch speichern"
          checked={settings.autoSaveSession}
          onChange={(v) => updateSettings({ autoSaveSession: v })}
        />
      </section>
    </div>
  );
}
