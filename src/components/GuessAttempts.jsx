function GuessAttempts({ attempts, maxAttempts }) {
  const slots = Array.from({ length: maxAttempts }, (_, index) => attempts[index] ?? null);

  return (
    <div className="d-grid gap-2 mb-3">
      {slots.map((attempt, index) => {
        const isWrong = attempt != null && !attempt.correct;

        return (
          <div
            key={index}
            className={`d-flex justify-content-between align-items-center border rounded-3 px-3 py-2 fs-5 ${
              isWrong ? "border-danger bg-danger-subtle text-danger-emphasis" : ""
            }`}
          >
            <span>{attempt ? attempt.text : " "}</span>
            <span className="fs-3">{isWrong ? "💔" : "❤️"}</span>
          </div>
        );
      })}
    </div>
  );
}

export default GuessAttempts;
