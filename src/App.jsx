import { useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { isAnswerCorrect } from "./domain/answerMatch";
import { createRound, getNextGuesserIndex, SITUATIONS } from "./domain/situationModel";
import GuessPage from "./pages/GuessPage";
import RevealPage from "./pages/RevealPage";
import RolesPage from "./pages/RolesPage";
import SetupPage from "./pages/SetupPage";

const INITIAL_LIVES = 6;

function GameLayout() {
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [roundOver, setRoundOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [revealedLiveRoles, setRevealedLiveRoles] = useState({});

  function startGame(nextPlayers) {
    try {
      const generatedRound = createRound(nextPlayers, "random");
      setPlayers(nextPlayers);
      setRound(generatedRound);
      setRoundNumber(1);
      setLives(INITIAL_LIVES);
      setRoundOver(false);
      setHistory([]);
      setRevealedLiveRoles({});
      return null;
    } catch (roundError) {
      return roundError.message;
    }
  }

  function submitGuess(guessText) {
    const correct = isAnswerCorrect(guessText, round.matchAnswers);

    if (correct) {
      setHistory((prev) => [...prev, { roundNumber, guesser: round.guesser, answer: guessText, correct: true }]);
      setRoundOver(true);
      return true;
    }

    const remainingLives = lives - 1;
    if (remainingLives <= 0) {
      setLives(0);
      setHistory((prev) => [...prev, { roundNumber, guesser: round.guesser, answer: guessText, correct: false }]);
      setRoundOver(true);
      return false;
    }

    setLives(remainingLives);
    return false;
  }

  function startNewRound() {
    const nextIndex = getNextGuesserIndex(round.guesserIndex, players.length);
    const nextRound = createRound(players, "random", Math.random, SITUATIONS, nextIndex);
    setRound(nextRound);
    setRoundNumber((prev) => prev + 1);
    setLives(INITIAL_LIVES);
    setRoundOver(false);
    setRevealedLiveRoles({});
  }

  function backToSetup() {
    setPlayers([]);
    setRound(null);
    setRoundNumber(0);
    setLives(INITIAL_LIVES);
    setRoundOver(false);
    setHistory([]);
    setRevealedLiveRoles({});
  }

  function toggleLiveRole(player) {
    setRevealedLiveRoles((prev) => ({ ...prev, [player]: !prev[player] }));
  }

  return (
    <Outlet
      context={{
        players,
        round,
        roundNumber,
        lives,
        roundOver,
        history,
        revealedLiveRoles,
        startGame,
        submitGuess,
        startNewRound,
        backToSetup,
        toggleLiveRole,
      }}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <main className="page-shell">
        <header className="game-header text-center py-3">
          <h1>Improv Guesser</h1>
        </header>
        <div className="container">
          <Routes>
            <Route element={<GameLayout />}>
              <Route path="/" element={<SetupPage />} />
              <Route path="/reveal" element={<RevealPage />} />
              <Route path="/guess" element={<GuessPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}

export default App;
