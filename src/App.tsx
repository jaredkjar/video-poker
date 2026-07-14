import { useCallback, useEffect, useState } from 'react';
import { savePrefs } from './game/prefs';
import { defaultSave, loadProfile } from './game/stats';
import * as sounds from './game/sounds';
import { useProfiles } from './hooks/useProfiles';
import { AccountMenu } from './components/AccountMenu';
import { BackIcon, GearIcon } from './components/icons';
import { CreditsModal } from './components/CreditsModal';
import { LoginScreen, type ProfileSummary } from './components/LoginScreen';
import { ConfirmModal } from './components/ConfirmModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { FeedbackModal } from './components/FeedbackModal';
import { GameSelect, type GameId } from './components/GameSelect';
import { PokerGame } from './games/poker/PokerGame';
import { BlackjackGame } from './games/blackjack/BlackjackGame';
import { BlackjackHelpModal } from './games/blackjack/BlackjackHelpModal';
import { RouletteGame } from './games/roulette/RouletteGame';
import { RouletteHelpModal } from './games/roulette/RouletteHelpModal';

export default function App() {
  const profiles = useProfiles();
  const { credits, setCredits, dollars, denom, soundOn, stats, bjStats, rouletteStats } =
    profiles;

  // null = lobby (game select); shown only while signed in
  const [game, setGame] = useState<GameId | null>(null);
  // True while a wager is unresolved in the current game (reported by the game screens)
  const [roundLive, setRoundLive] = useState(false);

  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsNote, setCreditsNote] = useState('');
  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState<GameId | null>(null);
  const [confirmReq, setConfirmReq] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);

  const fmt = useCallback(
    (amount: number) => (dollars ? `$${(amount * denom).toFixed(2)}` : String(amount)),
    [dollars, denom],
  );
  const fmtEV = (v: number) => (dollars ? `$${(v * denom).toFixed(2)}` : v.toFixed(2));
  const creditsWord = (amount: number) =>
    dollars ? fmt(amount) : `${amount} credit${amount === 1 ? '' : 's'}`;

  useEffect(() => {
    sounds.setEnabled(soundOn);
  }, [soundOn]);

  // Apply the signed-in player's look, and mirror it to device prefs so the
  // login screen (and brand-new profiles) match the last look used.
  useEffect(() => {
    document.documentElement.dataset.theme = profiles.theme;
    document.documentElement.dataset.textsize = profiles.textSize;
    savePrefs({ theme: profiles.theme, textSize: profiles.textSize });
  }, [profiles.theme, profiles.textSize]);

  const anyModalOpen =
    creditsOpen ||
    statsOpen ||
    settingsOpen ||
    feedbackOpen ||
    howToOpen !== null ||
    confirmReq !== null;

  const handleLogin = (name: string) => {
    if (!profiles.login(name)) return;
    setGame(null);
  };

  const handleGuest = () => {
    profiles.playAsGuest();
    setGame(null);
  };

  const handleSignOut = () => {
    profiles.signOut();
    setGame(null);
    setStatsOpen(false);
    setCreditsOpen(false);
  };

  /** Run `action` immediately, or confirm first when a wager would be forfeited. */
  const guardRound = (title: string, action: () => void) => {
    if (!roundLive) {
      action();
      return;
    }
    setConfirmReq({
      title,
      message: 'You have a hand in play — leaving now forfeits your bet.',
      confirmLabel: 'Leave anyway',
      action: () => {
        setRoundLive(false);
        action();
      },
    });
  };

  const openCredits = () => {
    setCreditsNote('');
    setCreditsOpen(true);
  };

  const onInsufficient = (betAmount: number) => {
    setCreditsNote(`You need ${creditsWord(betAmount)} to play this bet.`);
    setCreditsOpen(true);
  };

  const addCredits = (amount: number) => {
    setCredits((c) => c + amount);
    setCreditsOpen(false);
    setCreditsNote('');
    sounds.blip();
  };

  const startingBalance = defaultSave().credits;

  const resetBalance = () => {
    const label = creditsWord(startingBalance);
    setCreditsOpen(false);
    setConfirmReq({
      title: 'Clear balance?',
      message: `Your balance will start over at ${label}. This can't be undone.`,
      confirmLabel: 'Clear balance',
      action: () => {
        setCredits(startingBalance);
        setCreditsNote('');
        sounds.blip();
      },
    });
  };

  const requestDeleteProfile = (name: string) =>
    setConfirmReq({
      title: 'Delete profile?',
      message: `"${name}" and all their credits and stats will be permanently deleted.`,
      confirmLabel: 'Delete profile',
      action: () => profiles.deleteProfile(name),
    });

  const confirmModal = confirmReq && (
    <ConfirmModal
      title={confirmReq.title}
      message={confirmReq.message}
      confirmLabel={confirmReq.confirmLabel}
      onConfirm={() => {
        confirmReq.action();
        setConfirmReq(null);
      }}
      onClose={() => setConfirmReq(null)}
    />
  );

  const settingsModal = settingsOpen && (
    <SettingsModal
      prefs={{ theme: profiles.theme, textSize: profiles.textSize }}
      denom={denom}
      onPrefs={(p) => {
        profiles.setTheme(p.theme);
        profiles.setTextSize(p.textSize);
      }}
      onDenom={profiles.setDenom}
      onClose={() => setSettingsOpen(false)}
    />
  );

  const howToModal =
    howToOpen === 'poker' ? (
      <HowToPlayModal onClose={() => setHowToOpen(null)} />
    ) : howToOpen === 'blackjack' ? (
      <BlackjackHelpModal onClose={() => setHowToOpen(null)} />
    ) : howToOpen === 'roulette' ? (
      <RouletteHelpModal onClose={() => setHowToOpen(null)} />
    ) : null;

  if (!profiles.user) {
    // Balances shown on the landing page — read fresh each time it renders
    const profileSummaries: ProfileSummary[] = profiles.usersList.map((name) => {
      const data = loadProfile(name);
      return {
        name,
        balanceLabel: `${data.credits.toLocaleString()} credits · $${(data.credits * data.denom).toFixed(2)}`,
      };
    });

    return (
      <div className="app">
        <LoginScreen
          users={profileSummaries}
          onLogin={handleLogin}
          onGuest={handleGuest}
          onDelete={requestDeleteProfile}
          onSettings={() => setSettingsOpen(true)}
        />
        {settingsModal}
        {confirmModal}
      </div>
    );
  }

  const userLabel = profiles.isGuest ? 'Guest' : profiles.user;
  const totalPlays = stats.hands + bjStats.hands + rouletteStats.spins;
  const statsSummary = totalPlays > 0 ? `${totalPlays} plays · ${fmt(credits)} balance` : undefined;

  const topbar = (
    <>
      <div className="topbar-left">
        {game !== null && (
          <button
            type="button"
            className="icon-btn"
            title="Back to games"
            aria-label="Back to games"
            onClick={() => guardRound('Leave the table?', () => setGame(null))}
          >
            <BackIcon />
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          title="Settings"
          aria-label="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <GearIcon />
        </button>
      </div>
      <AccountMenu
        userLabel={userLabel}
        isGuest={profiles.isGuest}
        statsSummary={statsSummary}
        onStats={() => setStatsOpen(true)}
        onHowTo={game !== null ? () => setHowToOpen(game) : undefined}
        onFeedback={() => setFeedbackOpen(true)}
        onSignOut={() =>
          guardRound(profiles.isGuest ? 'Sign in?' : 'Sign out?', handleSignOut)
        }
      />
    </>
  );

  return (
    <div className="app">
      {game === null && (
        <GameSelect
          topbar={topbar}
          balanceLabel={fmt(credits)}
          onPick={setGame}
          onAddCredits={openCredits}
        />
      )}
      {game === 'poker' && (
        <PokerGame
          profiles={profiles}
          topbar={topbar}
          keyboardActive={!anyModalOpen}
          fmt={fmt}
          fmtEV={fmtEV}
          onInsufficient={onInsufficient}
          onAddCredits={openCredits}
          onRoundLive={setRoundLive}
        />
      )}
      {game === 'blackjack' && (
        <BlackjackGame
          profiles={profiles}
          topbar={topbar}
          fmt={fmt}
          onInsufficient={onInsufficient}
          onAddCredits={openCredits}
          onRoundLive={setRoundLive}
        />
      )}
      {game === 'roulette' && (
        <RouletteGame
          profiles={profiles}
          topbar={topbar}
          fmt={fmt}
          onAddCredits={openCredits}
        />
      )}

      {creditsOpen && (
        <CreditsModal
          note={creditsNote}
          format={fmt}
          startingBalance={startingBalance}
          onAdd={addCredits}
          onReset={resetBalance}
          onClose={() => setCreditsOpen(false)}
        />
      )}

      {settingsModal}
      {confirmModal}
      {howToModal}

      {feedbackOpen && (
        <FeedbackModal user={userLabel} onClose={() => setFeedbackOpen(false)} />
      )}

      {statsOpen && (
        <StatsModal
          user={userLabel}
          stats={stats}
          bjStats={bjStats}
          rouletteStats={rouletteStats}
          format={fmt}
          onReset={() => {
            profiles.resetStats();
            setStatsOpen(false);
          }}
          onClose={() => setStatsOpen(false)}
        />
      )}
    </div>
  );
}
