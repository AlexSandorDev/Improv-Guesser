import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { hasUniquePlayerNames, MIN_PLAYERS, normalizePlayerNames } from "../domain/situationModel";

function SetupPage() {
  const { startGame } = useOutletContext();
  const navigate = useNavigate();
  const [playerInputs, setPlayerInputs] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

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

  function handleStartGame() {
    if (normalizedPlayers.length < MIN_PLAYERS) {
      setError(`Minimum ${MIN_PLAYERS} players required.`);
      return;
    }

    if (!hasUniquePlayerNames(normalizedPlayers)) {
      setError("Player names must be unique (case-insensitive).");
      return;
    }

    const startError = startGame(normalizedPlayers);
    if (startError) {
      setError(startError);
      return;
    }

    navigate("/reveal");
  }

  return (
    <section className="d-grid gap-3 py-3">
      <p className="fs-5 text-body-secondary">
        Add player names, then pass one phone around to reveal each private role.
      </p>

      <div className="card">
        <div className="card-body d-grid gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <p className="fs-4 fw-bold mb-0">Players</p>
            <button type="button" onClick={addPlayerField} className="btn btn-lg btn-outline-secondary">
              + Add Player
            </button>
          </div>

          {playerInputs.map((name, index) => (
            <div key={`player-${index}`} className="d-flex gap-2">
              <input
                value={name}
                onChange={(event) => updatePlayerName(index, event.target.value)}
                placeholder={`Player ${index + 1}`}
                autoComplete="off"
                className="form-control form-control-lg"
              />
              <button
                type="button"
                onClick={() => removePlayerField(index)}
                disabled={playerInputs.length <= MIN_PLAYERS}
                className="btn btn-lg btn-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="alert alert-danger fs-5">{error}</p>}

      <button
        type="button"
        onClick={handleStartGame}
        className="btn btn-lg btn-primary"
        disabled={normalizedPlayerCount < MIN_PLAYERS}
      >
        Start Game
      </button>
    </section>
  );
}

export default SetupPage;
