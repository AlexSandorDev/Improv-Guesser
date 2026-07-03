import { useState } from "react";
import ScenarioForm from "../components/ScenarioForm";
import {
  extractPreamble,
  isFileSystemAccessSupported,
  openSituationsFile,
  serializeSituationsMarkdown,
  writeSituationsFile,
} from "../domain/situationsFile";
import { parseSituationsMarkdown } from "../domain/situationsMarkdown";

const VIEW_LIST = "list";
const VIEW_ADD = "add";
const VIEW_EDIT = "edit";

function ScenarioEditorPage() {
  const [fileHandle, setFileHandle] = useState(null);
  const [preamble, setPreamble] = useState("");
  const [situations, setSituations] = useState([]);
  const [view, setView] = useState(VIEW_LIST);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const supported = isFileSystemAccessSupported();

  async function handleOpen() {
    try {
      const { handle, text } = await openSituationsFile();
      const parsed = parseSituationsMarkdown(text);
      setFileHandle(handle);
      setPreamble(extractPreamble(text));
      setSituations(parsed);
      setError("");
    } catch (openError) {
      if (openError && openError.name === "AbortError") {
        return;
      }
      setError(openError.message);
    }
  }

  async function persist(nextSituations) {
    const markdown = serializeSituationsMarkdown(preamble, nextSituations);
    await writeSituationsFile(fileHandle, markdown);
    setSituations(nextSituations);
  }

  async function handleSave(situation) {
    try {
      const index = situations.findIndex((existing) => existing.id === editingId);
      const nextSituations =
        index === -1
          ? [...situations, situation]
          : situations.map((existing, i) => (i === index ? situation : existing));
      await persist(nextSituations);
      setView(VIEW_LIST);
      setEditingId(null);
      setError("");
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function handleDelete(id) {
    const target = situations.find((situation) => situation.id === id);
    if (!target || !window.confirm(`Delete "${target.name}"?`)) {
      return;
    }
    try {
      await persist(situations.filter((situation) => situation.id !== id));
      setError("");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function handleCancel() {
    setView(VIEW_LIST);
    setEditingId(null);
  }

  if (!supported) {
    return (
      <section className="d-grid gap-3 py-3">
        <p className="alert alert-warning fs-5">
          This page needs a Chromium-based browser (Chrome or Edge) for File System access.
        </p>
      </section>
    );
  }

  if (!fileHandle) {
    return (
      <section className="d-grid gap-3 py-3">
        <p className="fs-4 fw-bold mb-0">Scenario Editor</p>
        <button type="button" onClick={handleOpen} className="btn btn-lg btn-primary">
          Open situations.md
        </button>
        {error && <p className="alert alert-danger fs-5">{error}</p>}
      </section>
    );
  }

  if (view === VIEW_ADD || view === VIEW_EDIT) {
    const editingSituation = view === VIEW_EDIT ? situations.find((s) => s.id === editingId) : null;
    const existingIds = situations.map((s) => s.id).filter((sid) => sid !== editingId);

    return (
      <section className="d-grid gap-3 py-3">
        <p className="fs-4 fw-bold mb-0">{view === VIEW_ADD ? "Add Scenario" : "Edit Scenario"}</p>
        {error && <p className="alert alert-danger fs-5">{error}</p>}
        <ScenarioForm
          initialSituation={editingSituation}
          existingIds={existingIds}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </section>
    );
  }

  return (
    <section className="d-grid gap-3 py-3">
      <div className="d-flex align-items-center justify-content-between">
        <p className="fs-4 fw-bold mb-0">Scenario Editor</p>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setView(VIEW_ADD);
          }}
          className="btn btn-lg btn-primary"
        >
          + Add Scenario
        </button>
      </div>

      {error && <p className="alert alert-danger fs-5">{error}</p>}

      <div className="list-group">
        {situations.map((situation) => (
          <div
            key={situation.id}
            className="list-group-item d-flex align-items-center justify-content-between"
          >
            <div>
              <p className="mb-0 fw-bold">{situation.name}</p>
              <p className="mb-0 text-body-secondary small">{situation.id}</p>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(situation.id);
                  setView(VIEW_EDIT);
                }}
                className="btn btn-outline-secondary"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(situation.id)}
                className="btn btn-outline-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ScenarioEditorPage;
