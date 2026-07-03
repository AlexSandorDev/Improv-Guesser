import { useState } from "react";
import { getSupportedPlayerRange } from "../domain/situationModel";
import { normalizeSituation, validateSituationDraft } from "../domain/situationsMarkdown";
import { slugify } from "../domain/situationsFile";

function ScenarioForm({ initialSituation, existingIds, onSave, onCancel }) {
  const [name, setName] = useState(initialSituation?.name ?? "");
  const [id, setId] = useState(initialSituation?.id ?? "");
  const [idManuallyEdited, setIdManuallyEdited] = useState(Boolean(initialSituation));
  const [guesserPrompt, setGuesserPrompt] = useState(initialSituation?.guesserPrompt ?? "");
  const [solutionPrompt, setSolutionPrompt] = useState(initialSituation?.solutionPrompt ?? "");
  const [acceptedAnswers, setAcceptedAnswers] = useState(initialSituation?.acceptedAnswers ?? []);
  const [roles, setRoles] = useState(
    initialSituation?.roles ?? [{ name: "", prompt: "", mandatory: true }]
  );
  const [error, setError] = useState("");

  const { min: minPlayers, max: maxPlayers } = getSupportedPlayerRange(roles);

  function handleNameChange(event) {
    const nextName = event.target.value;
    setName(nextName);
    if (!initialSituation && !idManuallyEdited) {
      setId(slugify(nextName));
    }
  }

  function handleIdChange(event) {
    setId(event.target.value);
    setIdManuallyEdited(true);
  }

  function updateAcceptedAnswer(index, value) {
    setAcceptedAnswers((prev) => prev.map((answer, i) => (i === index ? value : answer)));
  }

  function addAcceptedAnswer() {
    setAcceptedAnswers((prev) => [...prev, ""]);
  }

  function removeAcceptedAnswer(index) {
    setAcceptedAnswers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRole(index, field, value) {
    setRoles((prev) => prev.map((role, i) => (i === index ? { ...role, [field]: value } : role)));
  }

  function addRole() {
    setRoles((prev) => [...prev, { name: "", prompt: "", mandatory: true }]);
  }

  function removeRole(index) {
    setRoles((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedAcceptedAnswers = acceptedAnswers.map((answer) => answer.trim()).filter(Boolean);
    const draft = {
      id: id.trim(),
      name: name.trim(),
      guesserPrompt: guesserPrompt.trim(),
      solutionPrompt: solutionPrompt.trim(),
      roles: roles.map((role) => ({
        name: role.name.trim(),
        prompt: role.prompt.trim(),
        mandatory: role.mandatory,
      })),
    };
    if (trimmedAcceptedAnswers.length > 0) {
      draft.acceptedAnswers = trimmedAcceptedAnswers;
    }

    try {
      validateSituationDraft(draft, existingIds);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setError("");
    onSave(normalizeSituation(draft));
  }

  return (
    <form onSubmit={handleSubmit} className="d-grid gap-3">
      <div className="card">
        <div className="card-body d-grid gap-3">
          <div>
            <label className="form-label fw-bold" htmlFor="scenario-name">
              Name
            </label>
            <input
              id="scenario-name"
              value={name}
              onChange={handleNameChange}
              className="form-control form-control-lg"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="form-label fw-bold" htmlFor="scenario-id">
              Id
            </label>
            <input
              id="scenario-id"
              value={id}
              onChange={handleIdChange}
              className="form-control"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="form-label fw-bold" htmlFor="scenario-question">
              Question
            </label>
            <p className="form-text mt-0">
              Shown to the guesser. Use <code>[Player]</code> or <code>_</code> for blanks, e.g.{" "}
              <code>[Player] _ a _ from the _ _.</code>
            </p>
            <textarea
              id="scenario-question"
              value={guesserPrompt}
              onChange={(event) => setGuesserPrompt(event.target.value)}
              className="form-control"
              rows={2}
            />
          </div>

          <div>
            <label className="form-label fw-bold" htmlFor="scenario-solution">
              Solution
            </label>
            <p className="form-text mt-0">
              The answer, revealed when the round ends. Supports <code>{"{focusPlayer}"}</code>{" "}
              and <code>{"{guesser}"}</code> tokens.
            </p>
            <textarea
              id="scenario-solution"
              value={solutionPrompt}
              onChange={(event) => setSolutionPrompt(event.target.value)}
              className="form-control"
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body d-grid gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <p className="fs-5 fw-bold mb-0">Accepted Answers</p>
            <button type="button" onClick={addAcceptedAnswer} className="btn btn-outline-secondary">
              + Add Answer
            </button>
          </div>
          <p className="form-text mt-0">
            Alternate phrasings that also count as correct. Leave empty to only accept the
            Solution text.
          </p>

          {acceptedAnswers.map((answer, index) => (
            <div key={`accepted-answer-${index}`} className="d-flex gap-2">
              <input
                value={answer}
                onChange={(event) => updateAcceptedAnswer(index, event.target.value)}
                className="form-control"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => removeAcceptedAnswer(index)}
                className="btn btn-outline-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-body d-grid gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <p className="fs-5 fw-bold mb-0">Roles</p>
            <button type="button" onClick={addRole} className="btn btn-outline-secondary">
              + Add Role
            </button>
          </div>

          {roles.map((role, index) => (
            <div key={`role-${index}`} className="card border-secondary-subtle">
              <div className="card-body d-grid gap-2">
                <div>
                  <label className="form-label fw-bold" htmlFor={`role-title-${index}`}>
                    Title
                  </label>
                  <input
                    id={`role-title-${index}`}
                    value={role.name}
                    onChange={(event) => updateRole(index, "name", event.target.value)}
                    className="form-control"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="form-label fw-bold" htmlFor={`role-description-${index}`}>
                    Description
                  </label>
                  <p className="form-text mt-0">
                    Instructions shown to this player. <code>{"{player}"}</code> and{" "}
                    <code>{"{focusPlayer}"}</code> tokens are available.
                  </p>
                  <textarea
                    id={`role-description-${index}`}
                    value={role.prompt}
                    onChange={(event) => updateRole(index, "prompt", event.target.value)}
                    className="form-control"
                    rows={2}
                  />
                </div>

                <div className="form-check">
                  <input
                    id={`role-optional-${index}`}
                    type="checkbox"
                    checked={!role.mandatory}
                    onChange={(event) => updateRole(index, "mandatory", !event.target.checked)}
                    className="form-check-input"
                  />
                  <label className="form-check-label" htmlFor={`role-optional-${index}`}>
                    Optional role (added only for bigger groups)
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => removeRole(index)}
                  disabled={roles.length <= 1}
                  className="btn btn-outline-danger"
                >
                  Remove Role
                </button>
              </div>
            </div>
          ))}

          <p className="text-body-secondary mb-0">
            Supports {minPlayers}–{maxPlayers} players
          </p>
        </div>
      </div>

      {error && <p className="alert alert-danger fs-5">{error}</p>}

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-lg btn-primary">
          Save Scenario
        </button>
        <button type="button" onClick={onCancel} className="btn btn-lg btn-outline-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ScenarioForm;
