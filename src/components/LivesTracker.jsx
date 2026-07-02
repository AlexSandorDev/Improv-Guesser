function LivesTracker({ lives, maxLives = 6 }) {
  return (
    <div className="d-flex gap-2 fs-2" role="status" aria-label={`${lives} of ${maxLives} lives remaining`}>
      {Array.from({ length: maxLives }, (_, index) => (
        <span key={index}>{index < lives ? "❤️" : "🤍"}</span>
      ))}
    </div>
  );
}

export default LivesTracker;
