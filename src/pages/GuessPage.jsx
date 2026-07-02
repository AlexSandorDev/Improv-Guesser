import { useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext } from "react-router-dom";
import GuessAttempts from "../components/GuessAttempts";

function GuessPage() {
  const { round, roundNumber, roundOver, attempts, submitGuess, startNewRound, backToSetup } =
    useOutletContext();
  const navigate = useNavigate();
  const [guessInput, setGuessInput] = useState("");

  if (!round) {
    return <Navigate to="/" replace />;
  }

  const lastAttempt = attempts[attempts.length - 1];
  const wasCorrect = Boolean(lastAttempt && lastAttempt.correct);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = guessInput.trim();
    if (!trimmed) {
      return;
    }

    submitGuess(trimmed);
    setGuessInput("");
  }

  function handleNewRound() {
    startNewRound();
    navigate("/reveal");
  }

  function handleBackToSetup() {
    backToSetup();
    navigate("/");
  }

  return (
    <section className="d-grid gap-3 py-3">
      <p className="fs-5 fw-bold mb-0">Round {roundNumber}</p>

      <GuessAttempts attempts={attempts} />

      {!roundOver && (
        <form onSubmit={handleSubmit} className="d-grid gap-3">
          <input
            value={guessInput}
            onChange={(event) => setGuessInput(event.target.value)}
            placeholder="What's the situation?"
            autoComplete="off"
            autoFocus
            className="form-control form-control-lg"
          />
          <button type="submit" className="btn btn-lg btn-primary">
            Guess
          </button>
        </form>
      )}

      {roundOver && (
        <div className="card border-success-subtle bg-success-subtle">
          <div className="card-body text-center d-grid gap-3">
            <p className="fs-5 fw-bold mb-0">{wasCorrect ? "Correct!" : "Out of lives!"}</p>
            <p className="text-body-secondary mb-0">Answer</p>
            <h3 className="mb-0">{round.solution}</h3>
          </div>
        </div>
      )}

      <Link to="/roles" className="btn btn-lg btn-outline-secondary">
        View Player Roles
      </Link>

      {roundOver && (
        <button type="button" className="btn btn-lg btn-primary" onClick={handleNewRound}>
          New Round
        </button>
      )}

      <button type="button" className="btn btn-lg btn-outline-danger" onClick={handleBackToSetup}>
        Back to Setup
      </button>
    </section>
  );
}

export default GuessPage;
