import { useMemo, useState } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";

function RevealPage() {
  const { round, backToSetup } = useOutletContext();
  const navigate = useNavigate();
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnStage, setTurnStage] = useState("pass");

  const revealOrder = useMemo(() => {
    if (!round) {
      return [];
    }
    return [...round.players.filter((player) => player !== round.guesser), round.guesser];
  }, [round]);

  if (!round) {
    return <Navigate to="/" replace />;
  }

  const currentPlayer = revealOrder[turnIndex] ?? "";
  const currentCard = round.cards[currentPlayer];

  function moveToNextPlayer() {
    if (turnIndex + 1 >= revealOrder.length) {
      navigate("/guess");
      return;
    }
    setTurnIndex((prev) => prev + 1);
    setTurnStage("pass");
  }

  function cancelRound() {
    backToSetup();
    navigate("/");
  }

  return (
    <section className="d-grid gap-3 py-3">
      {turnStage === "pass" && (
        <div className="card">
          <div className="card-body text-center d-grid gap-3">
            <h2>Hand the phone to {currentPlayer}</h2>
            <button type="button" className="btn btn-lg btn-primary" onClick={() => setTurnStage("revealed")}>
              Reveal Role
            </button>
          </div>
        </div>
      )}

      {turnStage === "revealed" && currentCard && (
        <div className="card border-warning-subtle bg-warning-subtle">
          <div className="card-body text-center d-grid gap-3">
            <p className="fw-bold text-uppercase small mb-0">{currentCard.rules}</p>
            <h2>{currentCard.title}</h2>
            <p className="fs-5 mb-0">{currentCard.prompt}</p>
            <button type="button" className="btn btn-lg btn-primary" onClick={moveToNextPlayer}>
              Hide Role and Continue
            </button>
          </div>
        </div>
      )}

      <button type="button" className="btn btn-lg btn-outline-secondary" onClick={cancelRound}>
        Cancel Round
      </button>
    </section>
  );
}

export default RevealPage;
