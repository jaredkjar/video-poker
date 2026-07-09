import { useEffect, useRef, useState } from 'react';
import {
  defaultSave,
  deleteProfileData,
  emptyStats,
  loadProfile,
  loadRegistry,
  saveProfile,
  saveRegistry,
  type SaveData,
} from '../game/stats';

export const GUEST = '__guest__';

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
  const [soundOn, setSoundOn] = useState(boot.data.sound);
  const [dollars, setDollars] = useState(boot.data.dollars);
  const [denom, setDenom] = useState(boot.data.denom);
  const [stats, setStats] = useState(boot.data.stats);

  useEffect(() => {
    if (!user || user === GUEST) return;
    saveProfile(user, { credits, bet, sound: soundOn, dollars, denom, stats });
  }, [user, credits, bet, soundOn, dollars, denom, stats]);

  const applyProfile = (data: SaveData) => {
    setCredits(data.credits);
    setBet(data.bet);
    setSoundOn(data.sound);
    setDollars(data.dollars);
    setDenom(data.denom);
    setStats(data.stats);
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

  const deleteProfile = (name: string) => {
    if (!window.confirm(`Delete profile "${name}" and all its stats?`)) return;
    deleteProfileData(name);
    const names = usersList.filter((n) => n !== name);
    setUsersList(names);
    saveRegistry({ names, last: null });
  };

  const resetStats = () => setStats(emptyStats());

  return {
    user,
    isGuest: user === GUEST,
    usersList,
    credits,
    setCredits,
    bet,
    setBet,
    soundOn,
    setSoundOn,
    dollars,
    setDollars,
    denom,
    setDenom,
    stats,
    setStats,
    login,
    playAsGuest,
    signOut,
    deleteProfile,
    resetStats,
  };
}
