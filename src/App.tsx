import { useCallback, useEffect, useState } from 'react';
import { MAX_BET } from './game/cards';
import { defaultSave, loadProfile } from './game/stats';
import * as sounds from './game/sounds';
import { useCountUp } from './hooks/useCountUp';
import { usePrefs } from './hooks/usePrefs';
import { useProfiles } from './hooks/useProfiles';
import { useStrategyWorker } from './hooks/useStrategyWorker';
import { useGameRound } from './hooks/useGameRound';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { Marquee } from './components/Marquee';
import { CardView } from './components/CardView';
import { Paytable } from './components/Paytable';
import { Console } from './components/Console';
import { StatusBar } from './components/StatusBar';
import { AccountMenu } from './components/AccountMenu';
import { WinOverlay } from './components/WinOverlay';
import { GearIcon } from './components/icons';
import { CreditsModal } from './components/CreditsModal';
import { LoginScreen, type ProfileSummary } from './components/LoginScreen';
import { ConfirmModal } from './components/ConfirmModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { FeedbackModal } from './components/FeedbackModal';

export default function App() {
  const profiles = useProfiles();
  const { credits, setCredits, bet, setBet, dollars, denom, soundOn, stats } = profiles;

  const [prefs, setPrefs] = usePrefs();
  // Deliberately not persisted — the trainer starts off every session
  const [trainer, setTrainer] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState('');
  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
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

  const strategy = useStrategyWorker();

  const game = useGameRound({
    bet,
    trainer,
    strategy,
    formatMoney: fmt,
    formatEV: fmtEV,
    tryDeduct: (amount) => {
      if (credits < amount) return false;
      setCredits((c) => c - amount);
      return true;
    },
    addWinnings: (amount) => setCredits((c) => c + amount),
    onInsufficient: (betAmount) => {
      setModalNote(`You need ${creditsWord(betAmount)} to play this bet.`);
      setModalOpen(true);
    },
    onHandComplete: ({ rank, amount, bet: wager, strategyKnown, wasOptimal }) =>
      profiles.setStats((s) => ({
        ...s,
        hands: s.hands + 1,
        handsWon: s.handsWon + (amount > 0 ? 1 : 0),
        wagered: s.wagered + wager,
        won: s.won + amount,
        biggestWin: Math.max(s.biggestWin, amount),
        perfectHolds: s.perfectHolds + (wasOptimal ? 1 : 0),
        holdsEvaluated: s.holdsEvaluated + (strategyKnown ? 1 : 0),
        handCounts:
          rank >= 0 ? s.handCounts.map((c, i) => (i === rank ? c + 1 : c)) : s.handCounts,
      })),
  });

  const creditsDisplay = useCountUp(credits);

  const betOne = () => {
    if (game.phase === 'holding' || game.busy) return;
    setBet((b) => (b % MAX_BET) + 1);
    sounds.blip();
  };

  const betMax = () => {
    if (game.phase === 'holding' || game.busy) return;
    setBet(MAX_BET);
    void game.deal(MAX_BET);
  };

  const dealOrDraw = () => (game.phase === 'holding' ? void game.draw() : void game.deal(bet));

  useKeyboardControls({
    active:
      !!profiles.user &&
      !modalOpen &&
      !statsOpen &&
      !settingsOpen &&
      !feedbackOpen &&
      !howToOpen &&
      !confirmReq,
    onHold: game.toggleHold,
    onPrimary: dealOrDraw,
    onHint: game.showHint,
  });

  const handleLogin = (name: string) => {
    const finalName = profiles.login(name);
    if (!finalName) return;
    setTrainer(false);
    game.resetRound(`Welcome, ${finalName} — press DEAL to play`);
  };

  const handleGuest = () => {
    profiles.playAsGuest();
    setTrainer(false);
    game.resetRound('Guest mode — press DEAL to play');
  };

  const handleSignOut = () => {
    profiles.signOut();
    setStatsOpen(false);
    setModalOpen(false);
  };

  const addCredits = (amount: number) => {
    setCredits((c) => c + amount);
    setModalOpen(false);
    setModalNote('');
    game.setMessage(`Added ${creditsWord(amount)} — good luck!`);
    sounds.blip();
  };

  const startingBalance = defaultSave().credits;

  const resetBalance = () => {
    const label = creditsWord(startingBalance);
    setModalOpen(false);
    setConfirmReq({
      title: 'Clear balance?',
      message: `Your balance will start over at ${label}. This can't be undone.`,
      confirmLabel: 'Clear balance',
      action: () => {
        setCredits(startingBalance);
        setModalNote('');
        game.setMessage(`Balance reset to ${label}`);
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

  const howToModal = howToOpen && <HowToPlayModal onClose={() => setHowToOpen(false)} />;

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
      prefs={prefs}
      denom={denom}
      onPrefs={setPrefs}
      onDenom={profiles.setDenom}
      onClose={() => setSettingsOpen(false)}
    />
  );

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
          onHowTo={() => setHowToOpen(true)}
        />
        {settingsModal}
        {confirmModal}
        {howToModal}
      </div>
    );
  }

  const userLabel = profiles.isGuest ? 'Guest' : profiles.user;
  const statsSummary =
    stats.hands > 0
      ? `${stats.hands} hands · ${((stats.handsWon / stats.hands) * 100).toFixed(1)}% won`
      : undefined;

  return (
    <div className="app">
      <main className="machine">
        <div className="topbar">
          <button
            type="button"
            className="icon-btn"
            title="Settings"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
          <AccountMenu
            userLabel={userLabel}
            isGuest={profiles.isGuest}
            statsSummary={statsSummary}
            onStats={() => setStatsOpen(true)}
            onHowTo={() => setHowToOpen(true)}
            onFeedback={() => setFeedbackOpen(true)}
            onSignOut={handleSignOut}
          />
        </div>

        <Marquee />

        <Paytable bet={bet} winRank={game.winRank} />

        <div className="message-area">
          <div className={`message${game.win > 0 ? ' win' : ''}`}>{game.message || ' '}</div>
          <div className="trainer-note">{game.trainerNote || ' '}</div>
        </div>

        <div className="cards">
          {game.hand.map((c, i) => (
            <CardView
              key={i}
              card={c}
              faceUp={game.faceUp[i]}
              held={game.held[i]}
              hinted={game.hintMask !== null && (game.hintMask & (1 << i)) !== 0}
              clickable={game.phase === 'holding' && !game.busy}
              onClick={() => game.toggleHold(i)}
            />
          ))}
        </div>

        <Console
          balanceLabel={fmt(creditsDisplay)}
          betLabel={fmt(bet)}
          winLabel={fmt(game.win)}
          dollars={dollars}
          phase={game.phase}
          busy={game.busy}
          onToggleDollars={() => profiles.setDollars((d) => !d)}
          onAddCredits={() => {
            setModalNote('');
            setModalOpen(true);
          }}
          onBetOne={betOne}
          onBetMax={betMax}
          onHint={game.showHint}
          onPrimary={dealOrDraw}
        />

        <StatusBar
          soundOn={soundOn}
          trainer={trainer}
          dollars={dollars}
          onToggleSound={() => profiles.setSoundOn((v) => !v)}
          onToggleTrainer={() => setTrainer((v) => !v)}
          onToggleDollars={() => profiles.setDollars((v) => !v)}
        />

        <p className="disclaimer">
          For entertainment &amp; practice only — play money, no real wagering. Cards are dealt
          from a full 52-card deck with a cryptographic shuffle; the 9/6 paytable returns 99.54%
          with optimal play.
        </p>

        {game.celebration && <WinOverlay {...game.celebration} />}
      </main>

      {modalOpen && (
        <CreditsModal
          note={modalNote}
          format={fmt}
          startingBalance={startingBalance}
          onAdd={addCredits}
          onReset={resetBalance}
          onClose={() => setModalOpen(false)}
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
