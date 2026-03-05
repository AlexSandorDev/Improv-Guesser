import { useMemo, useState } from "react";
import {
  createRound,
  hasUniquePlayerNames,
  MIN_PLAYERS,
  normalizePlayerNames,
  SITUATIONS,
} from "./domain/situationModel";

function App() {
  const [playerInputs, setPlayerInputs] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [round, setRound] = useState(null);
  const [phase, setPhase] = useState("setup");
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnStage, setTurnStage] = useState("pass");
  const [showSolution, setShowSolution] = useState(false);
  const [revealedLiveRoles, setRevealedLiveRoles] = useState({});

  const currentMaxPlayers = useMemo(
    () => Math.max(...SITUATIONS.map((situation) => situation.roles.length + 1)),
    []
  );

  const normalizedPlayers = useMemo(() => normalizePlayerNames(playerInputs), [playerInputs]);
  const normalizedPlayerCount = normalizedPlayers.length;

  function updatePlayerName(index, name) {
    setPlayerInputs((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
    setError("");
  }

  function addPlayerField() {
    setPlayerInputs((prev) => [...prev, ""]);
    setError("");
  }

  function removePlayerField(index) {
    setPlayerInputs((prev) => {
      if (prev.length <= MIN_PLAYERS) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
    setError("");
  }

  function startRound(playersOverride = null) {
    const players = playersOverride ?? normalizedPlayers;

    if (players.length < MIN_PLAYERS) {
      setError(`Minimum ${MIN_PLAYERS} players required.`);
      return;
    }

    if (!hasUniquePlayerNames(players)) {
      setError("Player names must be unique (case-insensitive).");
      return;
    }

    try {
      const generatedRound = createRound(players, "random");
      setRound(generatedRound);
      setError("");
      setPhase("reveal");
      setTurnIndex(0);
      setTurnStage("pass");
      setShowSolution(false);
      setRevealedLiveRoles({});
    } catch (roundError) {
      setError(roundError.message);
    }
  }

  function moveToNextPlayer() {
    if (!round) {
      return;
    }

    if (turnIndex + 1 >= revealOrder.length) {
      setPhase("live");
      setShowSolution(false);
      return;
    }

    setTurnIndex((prev) => prev + 1);
    setTurnStage("pass");
  }

  function backToSetup() {
    setPhase("setup");
    setRound(null);
    setTurnIndex(0);
    setTurnStage("pass");
    setShowSolution(false);
    setRevealedLiveRoles({});
  }

  function toggleLiveRole(player) {
    setRevealedLiveRoles((prev) => ({
      ...prev,
      [player]: !prev[player],
    }));
  }

  const revealOrder = useMemo(() => {
    if (!round) {
      return [];
    }

    return [...round.players.filter((player) => player !== round.guesser), round.guesser];
  }, [round]);

  const currentPlayer = revealOrder[turnIndex] ?? "";
  const currentCard = round ? round.cards[currentPlayer] : null;

  return (
    <main className="page-shell">
      <section className="game-card">
        <header className="game-header">
          <p className="eyebrow">Pass & Reveal Party Game</p>
          <h1>Improv Guesser</h1>
        </header>

        {phase === "setup" && (
          <section className="stack">
            <p className="muted">
              Add player names, then pass one phone around to reveal each private role.
            </p>

            <div className="players-block">
              <div className="players-head">
                <p>Players</p>
                <button type="button" onClick={addPlayerField} className="btn ghost">
                  + Add Player
                </button>
              </div>

              {playerInputs.map((name, index) => (
                <div key={`player-${index}`} className="player-row">
                  <input
                    value={name}
                    onChange={(event) => updatePlayerName(index, event.target.value)}
                    placeholder={`Player ${index + 1}`}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => removePlayerField(index)}
                    disabled={playerInputs.length <= MIN_PLAYERS}
                    className="btn danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="status-grid">
              <p>
                <strong>Ready players:</strong> {normalizedPlayerCount}
              </p>
              <p>
                <strong>Minimum:</strong> {MIN_PLAYERS}
              </p>
              <p>
                <strong>Max for selection:</strong> {currentMaxPlayers}
              </p>
            </div>

            {error && <p className="error">{error}</p>}

            <button
              type="button"
              onClick={() => startRound()}
              className="btn primary"
              disabled={normalizedPlayerCount < MIN_PLAYERS}
            >
              Start Game
            </button>
          </section>
        )}

        {phase === "reveal" && round && currentCard && (
          <section className="stack">
            {turnStage === "pass" && (
              <div className="panel">
                <h2>Hand the phone to {currentPlayer}</h2>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setTurnStage("revealed")}
                >
                  Reveal Role
                </button>
              </div>
            )}

            {turnStage === "revealed" && (
              <div className="panel reveal">
                <p className="role-tag">{currentCard.rules}</p>
                <h2>{currentCard.title}</h2>
                <p className="prompt">{currentCard.prompt}</p>
                <button type="button" className="btn primary" onClick={moveToNextPlayer}>
                  Hide Role and Continue
                </button>
              </div>
            )}

            <button type="button" className="btn ghost" onClick={backToSetup}>
              Cancel Round
            </button>
          </section>
        )}

        {phase === "live" && round && (
          <section className="stack">
            <div className="panel">
              <h2>All Roles Assigned</h2>
              <p>Start the improv scene now.</p>
              <p className="muted">
                Guesser: <strong>{round.guesser}</strong>
              </p>
            </div>

            <div className="players-block role-review-list">
              <div className="players-head">
                <p>All Player Roles</p>
              </div>
              {round.players.map((player) => {
                const card = round.cards[player];
                const isRevealed = Boolean(revealedLiveRoles[player]);

                return (
                  <div key={`live-role-${player}`} className="role-review-item">
                    <div className="role-review-top">
                      <div className="role-review-player-row">
                        <p className="role-review-player">{player}</p>
                        {player === round.guesser && <span className="role-badge">Guesser</span>}
                      </div>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => toggleLiveRole(player)}
                      >
                        {isRevealed ? "Hide Role" : "Reveal Role"}
                      </button>
                    </div>

                    {isRevealed && (
                      <div className="role-review-details">
                        <p className="role-tag">{card.rules}</p>
                        <h3>{card.title}</h3>
                        <p className="prompt">{card.prompt}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn ghost"
              onClick={() => setShowSolution((prev) => !prev)}
            >
              {showSolution ? "Hide Situation Answer" : "Reveal Situation Answer"}
            </button>

            {showSolution && (
              <div className="panel answer">
                <p className="muted">Answer</p>
                <h3>{round.solution}</h3>
              </div>
            )}

            <button type="button" className="btn primary" onClick={() => startRound(round.players)}>
              New Round (Same Players)
            </button>

            <button type="button" className="btn ghost" onClick={backToSetup}>
              Back To Setup
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
