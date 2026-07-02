function AnswerHistoryList({ history }) {
  if (history.length === 0) {
    return null;
  }

  return (
    <ul className="list-group mb-3">
      {history.map((entry, index) => (
        <li
          key={`${entry.roundNumber}-${index}`}
          className="list-group-item d-flex justify-content-between align-items-center gap-3"
        >
          <span>
            <strong>Round {entry.roundNumber}</strong> — {entry.guesser}: &quot;{entry.answer}&quot;
          </span>
          <span className={`badge ${entry.correct ? "text-bg-success" : "text-bg-danger"}`}>
            {entry.correct ? "Correct" : "Wrong"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default AnswerHistoryList;
