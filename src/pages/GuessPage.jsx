import { useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext } from "react-router-dom";
import LivesTracker from "../components/LivesTracker";
import AnswerHistoryList from "../components/AnswerHistoryList";

function GuessPage() {
  const { round, roundNumber, lives, roundOver, history, submitGuess, startNewRound, backToSetup } =
    useOutletContext();
  const navigate = useNavigate();
  const [guessInput, setGuessInput] = useState("");
  const [feedback, setFeedback] = useState(null);

  if (!round) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = guessInput.trim();
    if (!trimmed) {
      return;
    }

    const correct = submitGuess(trimmed);
    setFeedback(correct ? "correct" : "wrong");
    setGuessInput("");
  }

  function handleNewRound() {
    startNewRound();
    setFeedback(null);
    navigate("/reveal");
  }

  function handleBackToSetup() {
    backToSetup();
    navigate("/");
  }

  return (
    <section className="d-grid gap-3 py-3">
      <div className="d-flex align-items-center justify-content-between">
        <p className="fs-5 fw-bold mb-0">Round {roundNumber}</p>
        <LivesTracker lives={lives} />
      </div>

      <AnswerHistoryList history={history} />

      {!roundOver && (
        <form onSubmit={handleSubmit} className="d-grid gap-3">
          {feedback === "wrong" && <p className="alert alert-danger fs-5 mb-0">Not quite — try again.</p>}
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
            <p className="fs-5 fw-bold mb-0">{feedback === "correct" ? "Correct!" : "Out of lives!"}</p>
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
