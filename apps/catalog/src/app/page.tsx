"use client";
import { useState } from "react";

type Flag = { name: string; enabled: boolean };

/** Flag that exists on every fresh load. */
const SEEDED: Flag[] = [{ name: "new-checkout", enabled: true }];

export default function Home() {
  const [flags, setFlags] = useState<Flag[]>(SEEDED);
  const [input, setInput] = useState("");

  const addFlag = (e: React.FormEvent) => {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    if (flags.some((f) => f.name === name)) return;
    setFlags([...flags, { name, enabled: false }]);
    setInput("");
  };

  const toggleFlag = (name: string) => {
    setFlags(flags.map((f) => (f.name === name ? { ...f, enabled: !f.enabled } : f)));
  };

  const removeFlag = (name: string) => {
    setFlags(flags.filter((f) => f.name !== name));
  };

  const enabledCount = flags.filter((f) => f.enabled).length;

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-md text-black">
      <h1 className="text-2xl font-bold mb-2">Feature Flags</h1>
      <p className="text-sm text-gray-600 mb-4" aria-label="Enabled summary">
        {enabledCount} of {flags.length} enabled
      </p>
      <form onSubmit={addFlag} className="flex gap-2 mb-6">
        <input
          aria-label="Flag Name"
          type="text"
          placeholder="Add a feature flag..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Flag
        </button>
      </form>
      <ul className="space-y-2">
        {flags.map((flag) => (
          <li key={flag.name} className="flex justify-between items-center border p-2 rounded">
            <span>{flag.name}</span>
            <span className="flex gap-3 items-center">
              <button
                onClick={() => toggleFlag(flag.name)}
                aria-label={`Toggle ${flag.name}`}
                aria-pressed={flag.enabled}
                className={flag.enabled ? "text-green-600 font-semibold" : "text-gray-400 font-semibold"}
              >
                {flag.enabled ? "On" : "Off"}
              </button>
              <button
                onClick={() => removeFlag(flag.name)}
                aria-label={`Remove ${flag.name}`}
                className="text-red-600 text-sm font-semibold"
              >
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
