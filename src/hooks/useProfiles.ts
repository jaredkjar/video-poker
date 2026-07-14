import { useEffect, useRef, useState } from 'react';
import {
  defaultSave,
  deleteProfileData,
  emptyBjStats,
  emptyRouletteStats,
  emptyStats,
  loadProfile,
  loadRegistry,
  saveProfile,
  saveRegistry,
  type SaveData,
} from '../game/stats';

export const GUEST = '__guest__';

/** Everything a signed-in session exposes — game screens receive this whole bundle. */
export type Profiles = ReturnType<typeof useProfiles>;

/**
 * Player profiles: who is signed in, their persisted bankroll/settings/stats,
 * and the registry of known players. Guest sessions are never persisted.
 */
export function useProfiles() {
  // Resolve the remembered player (if any) once, before first render
  const bootRef = useRef<{ user: string | null; data: SaveData } | null>(null);
  if (bootRef.current === null) {
    const reg = loadRegistry();
    bootRef.current = {
      user: reg.last,
      data: reg.last ? loadProfile(reg.last) : defaultSave(),
    };
  }
  const boot = bootRef.current;

  const [user, setUser] = useState<string | null>(boot.user);
  const [usersList, setUsersList] = useState<string[]>(() => loadRegistry().names);

  const [credits, setCredits] = useState(boot.data.credits);
  const [bet, setBet] = useState(boot.data.bet);
  const [bjBet, setBjBet] = useState(boot.data.bjBet);
  const [soundOn, setSoundOn] = useState(boot.data.sound);
  const [dollars, setDollars] = useState(boot.data.dollars);
  const [denom, setDenom] = useState(boot.data.denom);
  const [trainer, setTrainer] = useState(boot.data.trainer);
  const [theme, setTheme] = useState(boot.data.theme);
  const [textSize, setTextSize] = useState(boot.data.textSize);
  const [stats, setStats] = useState(boot.data.stats);
  const [bjStats, setBjStats] = useState(boot.data.bjStats);
  const [rouletteStats, setRouletteStats] = useState(boot.data.rouletteStats);
  const [rouletteHistory, setRouletteHistory] = useState(boot.data.rouletteHistory);

  useEffect(() => {
    if (!user || user === GUEST) return;
    saveProfile(user, {
      credits,
      bet,
      bjBet,
      sound: soundOn,
      dollars,
      denom,
      trainer,
      theme,
      textSize,
      stats,
      bjStats,
      rouletteStats,
      rouletteHistory,
    });
  }, [user, credits, bet, bjBet, soundOn, dollars, denom, trainer, theme, textSize, stats, bjStats, rouletteStats, rouletteHistory]);

  const applyProfile = (data: SaveData) => {
    setCredits(data.credits);
    setBet(data.bet);
    setBjBet(data.bjBet);
    setSoundOn(data.sound);
    setDollars(data.dollars);
    setDenom(data.denom);
    setTrainer(data.trainer);
    setTheme(data.theme);
    setTextSize(data.textSize);
    setStats(data.stats);
    setBjStats(data.bjStats);
    setRouletteStats(data.rouletteStats);
    setRouletteHistory(data.rouletteHistory);
  };

  /** Sign in, creating the profile if needed. Returns the canonical name, or null if blank. */
  const login = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    // reuse an existing profile if the name only differs by case
    const existing = usersList.find((n) => n.toLowerCase() === trimmed.toLowerCase());
    const finalName = existing ?? trimmed;
    applyProfile(loadProfile(finalName));
    setUser(finalName);
    const names = existing ? usersList : [...usersList, finalName];
    setUsersList(names);
    saveRegistry({ names, last: finalName });
    return finalName;
  };

  const playAsGuest = () => {
    applyProfile(defaultSave());
    setUser(GUEST);
    saveRegistry({ names: usersList, last: null });
  };

  const signOut = () => {
    setUser(null);
    saveRegistry({ names: usersList, last: null });
  };

  // Destructive and unprompted — callers are expected to confirm with the user first
  const deleteProfile = (name: string) => {
    deleteProfileData(name);
    const names = usersList.filter((n) => n !== name);
    setUsersList(names);
    saveRegistry({ names, last: null });
  };

  const resetStats = () => {
    setStats(emptyStats());
    setBjStats(emptyBjStats());
    setRouletteStats(emptyRouletteStats());
    setRouletteHistory([]);
  };

  return {
    user,
    isGuest: user === GUEST,
    usersList,
    credits,
    setCredits,
    bet,
    setBet,
    bjBet,
    setBjBet,
    soundOn,
    setSoundOn,
    dollars,
    setDollars,
    denom,
    setDenom,
    trainer,
    setTrainer,
    theme,
    setTheme,
    textSize,
    setTextSize,
    stats,
    setStats,
    bjStats,
    setBjStats,
    rouletteStats,
    setRouletteStats,
    rouletteHistory,
    setRouletteHistory,
    login,
    playAsGuest,
    signOut,
    deleteProfile,
    resetStats,
  };
}
