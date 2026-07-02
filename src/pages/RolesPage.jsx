import { Link, Navigate, useOutletContext } from "react-router-dom";

function RolesPage() {
  const { round, revealedLiveRoles, toggleLiveRole } = useOutletContext();

  if (!round) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="d-grid gap-3 py-3">
      <p className="fs-4 fw-bold mb-0">All Player Roles</p>

      <div className="d-grid gap-3">
        {round.players.map((player) => {
          const card = round.cards[player];
          const isRevealed = Boolean(revealedLiveRoles[player]);

          return (
            <div key={`live-role-${player}`} className="card">
              <div className="card-body d-grid gap-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <p className="fs-5 fw-bold mb-0">{player}</p>
                    {player === round.guesser && <span className="badge text-bg-primary">Guesser</span>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-lg btn-outline-secondary"
                    onClick={() => toggleLiveRole(player)}
                  >
                    {isRevealed ? "Hide Role" : "Reveal Role"}
                  </button>
                </div>

                {isRevealed && (
                  <div className="d-grid gap-2">
                    <p className="fw-bold text-uppercase small mb-0">{card.rules}</p>
                    <h3 className="mb-0">{card.title}</h3>
                    <p className="fs-5 mb-0">{card.prompt}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Link to="/guess" className="btn btn-lg btn-primary">
        Back to Game
      </Link>
    </section>
  );
}

export default RolesPage;
