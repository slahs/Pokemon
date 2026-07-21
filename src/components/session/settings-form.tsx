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
      <span className="text-sm text-[oklch(0.85_0.02_290)]">{props.label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={props.step ?? "0.01"}
          value={Number.isFinite(props.value) ? props.value : 0}
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value);
            props.onChange(Number.isFinite(v) && v >= 0 ? v : 0);
          }}
          className="min-h-11 w-32 rounded-xl border border-white/16 bg-input px-4 py-2.5 font-numeric outline-none focus:border-accent-cyan"
        />
        {props.suffix && <span className="text-sm text-text-dim">{props.suffix}</span>}
      </div>
      {props.hint && (
        <span className="mt-1 block text-xs leading-relaxed text-text-dim">{props.hint}</span>
      )}
    </label>
  );
}

function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-13 cursor-pointer items-center justify-between gap-4 border-b border-white/7 py-3 last:border-0">
      <span className="text-sm">{props.label}</span>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-[26px] w-11 shrink-0 rounded-full bg-[oklch(0.35_0.03_278)] transition peer-checked:bg-gradient-to-br peer-checked:from-accent-cyan peer-checked:to-accent-magenta peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-cyan">
        <span className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-[oklch(0.72_0.02_290)] transition-all peer-checked:left-[21px] peer-checked:bg-[oklch(0.98_0.01_290)]" />
      </span>
    </label>
  );
}

export function SettingsForm() {
  const { settings, updateSettings, hydrated } = useSettings();

  if (!hydrated) return <div className="panel h-64 animate-pulse" aria-busy="true" />;

  return (
    <div className="space-y-5">
      <section className="panel p-6">
        <h2 className="mb-5 font-display text-lg font-bold">Preise und Berechnung</h2>
        <label className="block">
          <span className="text-sm text-[oklch(0.85_0.02_290)]">Preisbasis</span>
          <select
            value={settings.priceMode}
            onChange={(e) => updateSettings({ priceMode: e.target.value as PriceMode })}
            className="mt-2 min-h-12 w-full rounded-xl border border-white/16 bg-input px-4 py-3 outline-none focus:border-accent-cyan"
          >
            {(Object.keys(PRICE_MODE_LABELS) as PriceMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {PRICE_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
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
            hint="Karten darunter können automatisch aufgedeckt werden."
          />
          <NumberField
            label="Standard-Boosterpreis"
            value={settings.defaultPackPrice}
            onChange={(v) => updateSettings({ defaultPackPrice: v })}
            suffix="€"
            hint="Gilt, solange für ein Set kein eigener Preis gespeichert ist."
          />
        </div>
      </section>

      <section className="panel px-6 pb-2 pt-5">
        <h2 className="mb-2 font-display text-lg font-bold">Darstellung und Verhalten</h2>
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
