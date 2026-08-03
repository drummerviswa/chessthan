/* eslint-disable no-unused-vars */
import { useState } from "react";
import {
  IconSettings,
  IconClock,
  IconCpu,
  IconFlag,
  IconHelp,
  IconPlayerSkipBack,
  IconChevronLeft,
  IconChevronRight,
  IconPlayerSkipForward,
  IconRotateClockwise2,
  IconVolume,
  IconVolumeOff,
  IconPalette
} from "@tabler/icons-react";

interface Move {
  san: string;
  from: string;
  to: string;
  color: string;
}

interface BoardControlPanelProps {
  history: Move[];
  navIndex: number | null;
  navigateMove: (_index: number | null | "prev") => void;
  setBoardTheme: (_theme: { dark: string; light: string }) => void;
  settings: { sound: boolean; highlights: boolean; premoves: boolean };
  onToggleSetting: (_key: "sound" | "highlights" | "premoves") => void;
  aiExplanation?: string | null;
  aiLoading?: boolean;
  fetchAiExplanation?: () => void;
  onResign?: () => void;
  onOfferDraw?: () => void;
  onAbort?: () => void;
  onFlipBoard: () => void;
  currentOpening?: { name: string } | null;
}

const THEMES = [
  { id: "emerald", name: "Classic Emerald", dark: "#0e4a3b", light: "#eeeddf" },
  { id: "wood", name: "Tournament Wood", dark: "#b58863", light: "#f0d9b5" },
  { id: "glass", name: "Ice Glass", dark: "#5e81ac", light: "#eceff4" },
  { id: "slate", name: "Minimalist Slate", dark: "#475569", light: "#cbd5e1" },
  { id: "royal", name: "Royal Purple", dark: "#5b21b6", light: "#ede9fe" }
];

export default function BoardControlPanel({
  history,
  navIndex,
  navigateMove,
  setBoardTheme,
  settings,
  onToggleSetting,
  aiExplanation = null,
  aiLoading = false,
  fetchAiExplanation,
  onResign,
  onOfferDraw,
  onAbort,
  onFlipBoard,
  currentOpening = null
}: BoardControlPanelProps) {
  const [tab, setTab] = useState<"moves" | "settings" | "ai">("moves");

  // Format move pairs for notation table
  const movePairs: Move[][] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]].filter(Boolean) as Move[]);
  }

  const handleThemeChange = (themeId: string) => {
    const selected = THEMES.find((t) => t.id === themeId);
    if (selected) {
      setBoardTheme({ dark: selected.dark, light: selected.light });
      localStorage.setItem("chessthan:boardTheme", themeId);
    }
  };

  return (
    <div className="flex flex-col w-full h-[480px] bg-base-200 border border-base-300 rounded-xl overflow-hidden shadow-md">
      {/* Tab Selectors */}
      <div className="tabs tabs-boxed grid grid-cols-3 p-1 rounded-none border-b border-base-300">
        <button
          onClick={() => setTab("moves")}
          className={`tab tab-xs font-bold gap-1 ${tab === "moves" ? "tab-active" : ""}`}
        >
          <IconClock size={14} /> Moves
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`tab tab-xs font-bold gap-1 ${tab === "settings" ? "tab-active" : ""}`}
        >
          <IconSettings size={14} /> Options
        </button>
        <button
          onClick={() => setTab("ai")}
          className={`tab tab-xs font-bold gap-1 ${tab === "ai" ? "tab-active" : ""}`}
        >
          <IconCpu size={14} /> AI Coach
        </button>
      </div>

      {/* Chapter opening banner */}
      {currentOpening && (
        <div className="bg-base-300/40 px-3 py-1.5 border-b border-base-300 text-[10px] font-bold text-primary flex items-center gap-1">
          📖 {currentOpening.name}
        </div>
      )}

      {/* Main Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "moves" && (
          <div className="h-full flex flex-col justify-between">
            <div className="overflow-y-auto flex-1 max-h-[290px] pr-1">
              {movePairs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-base-content/40">
                  No moves played yet.
                </div>
              ) : (
                <table className="table table-compact w-full text-xs">
                  <tbody>
                    {movePairs.map((pair, idx) => {
                      const whiteIdx = idx * 2;
                      const blackIdx = idx * 2 + 1;
                      const isWhiteActive =
                        navIndex === whiteIdx ||
                        (navIndex === null && history.length - 1 === whiteIdx);
                      const isBlackActive =
                        navIndex === blackIdx ||
                        (navIndex === null && history.length - 1 === blackIdx);

                      return (
                        <tr key={idx} className="hover:bg-base-300/20">
                          <td className="w-12 text-base-content/40 font-mono text-[10px]">
                            {idx + 1}.
                          </td>
                          <td
                            onClick={() => navigateMove(whiteIdx)}
                            className={`cursor-pointer px-2 py-1 rounded font-medium ${
                              isWhiteActive ? "bg-primary text-primary-content font-bold" : "hover:bg-base-300"
                            }`}
                          >
                            {pair[0].san}
                          </td>
                          <td className="w-6"></td>
                          {pair[1] ? (
                            <td
                              onClick={() => navigateMove(blackIdx)}
                              className={`cursor-pointer px-2 py-1 rounded font-medium ${
                                isBlackActive ? "bg-primary text-primary-content font-bold" : "hover:bg-base-300"
                              }`}
                            >
                              {pair[1].san}
                            </td>
                          ) : (
                            <td></td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex justify-center gap-1 border-t border-base-300 pt-3 mt-2 shrink-0">
              <button
                title="First move"
                disabled={history.length === 0 || navIndex === 0}
                onClick={() => navigateMove(0)}
                className="btn btn-xs btn-ghost btn-square"
              >
                <IconPlayerSkipBack size={16} />
              </button>
              <button
                title="Previous move"
                disabled={history.length === 0 || navIndex === 0}
                onClick={() => navigateMove(navIndex === null ? "prev" : navIndex - 1)}
                className="btn btn-xs btn-ghost btn-square"
              >
                <IconChevronLeft size={16} />
              </button>
              <button
                title="Next move"
                disabled={history.length === 0 || navIndex === null}
                onClick={() => navigateMove(navIndex === null ? null : navIndex + 1)}
                className="btn btn-xs btn-ghost btn-square"
              >
                <IconChevronRight size={16} />
              </button>
              <button
                title="Last move"
                disabled={history.length === 0 || navIndex === null}
                onClick={() => navigateMove(null)}
                className="btn btn-xs btn-ghost btn-square"
              >
                <IconPlayerSkipForward size={16} />
              </button>
              <div className="divider divider-horizontal mx-0.5"></div>
              <button
                title="Flip board orientation"
                onClick={onFlipBoard}
                className="btn btn-xs btn-ghost btn-square text-accent"
              >
                <IconRotateClockwise2 size={16} />
              </button>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
              Board Customization
            </h4>

            {/* Theme selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                <IconPalette size={16} className="text-primary" /> Board Texture
              </label>
              <select
                onChange={(e) => handleThemeChange(e.target.value)}
                className="select select-bordered select-xs w-full"
                defaultValue={
                  typeof window !== "undefined"
                    ? localStorage.getItem("chessthan:boardTheme") || "emerald"
                    : "emerald"
                }
              >
                {THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="divider my-1"></div>

            <h4 className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
              Gameplay Rules
            </h4>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                {settings.sound ? (
                  <IconVolume size={16} className="text-success" />
                ) : (
                  <IconVolumeOff size={16} className="text-base-content/40" />
                )}{" "}
                Sound Warnings
              </span>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={() => onToggleSetting("sound")}
                className="toggle toggle-xs toggle-primary"
              />
            </div>

            {/* Premove Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">⚡ Enable Premoves</span>
              <input
                type="checkbox"
                checked={settings.premoves}
                onChange={() => onToggleSetting("premoves")}
                className="toggle toggle-xs toggle-primary"
              />
            </div>

            {/* Highlight legal moves toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">💡 Move Target Indicators</span>
              <input
                type="checkbox"
                checked={settings.highlights}
                onChange={() => onToggleSetting("highlights")}
                className="toggle toggle-xs toggle-primary"
              />
            </div>
          </div>
        )}

        {tab === "ai" && (
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
              AI Coach Tutor
            </h4>

            {navIndex === null && history.length === 0 ? (
              <p className="text-xs text-base-content/50">
                Play some moves to get interactive explanations.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-primary flex justify-between">
                  <span>
                    Selected Move:{" "}
                    <span className="badge badge-sm badge-neutral">
                      {navIndex === null
                        ? history[history.length - 1]?.san || "None"
                        : history[navIndex]?.san}
                    </span>
                  </span>
                </div>

                {aiExplanation ? (
                  <div className="p-3 bg-base-100 rounded border border-base-300 text-xs leading-relaxed animate__animated animate__fadeIn">
                    {aiExplanation}
                  </div>
                ) : fetchAiExplanation ? (
                  <button
                    onClick={fetchAiExplanation}
                    className={`btn btn-xs btn-primary w-full ${aiLoading ? "loading" : ""}`}
                    disabled={aiLoading}
                  >
                    Explain Selected Move
                  </button>
                ) : (
                  <p className="text-xs text-base-content/50">
                    AI Analysis is only active inside Archived Replays or Analysis boards.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Actions Footer (Only if actions are provided) */}
      {(onResign || onOfferDraw || onAbort) && (
        <div className="bg-base-300 p-2.5 flex gap-2 border-t border-base-300 shrink-0">
          {onAbort && (
            <button onClick={onAbort} className="btn btn-xs btn-ghost flex-1 text-error text-[10px]">
              <IconFlag size={14} /> Abort
            </button>
          )}
          {onResign && (
            <button onClick={onResign} className="btn btn-xs btn-outline btn-error flex-1 text-[10px]">
              <IconFlag size={14} /> Resign
            </button>
          )}
          {onOfferDraw && (
            <button onClick={onOfferDraw} className="btn btn-xs btn-outline flex-1 text-[10px]">
              <IconHelp size={14} /> Offer Draw
            </button>
          )}
        </div>
      )}
    </div>
  );
}
