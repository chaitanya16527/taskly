import { useState } from "react";

export default function CurriculumForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Curriculum name is required.");
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="cur-name">Curriculum name <span className="req" aria-hidden="true">*</span></label>
        <input
          id="cur-name"
          type="text"
          autoFocus
          placeholder="Frontend Development"
          value={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "cur-name-error" : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />
        {error && <p className="error" id="cur-name-error">{error}</p>}
      </div>
      <div className="field">
        <label htmlFor="cur-desc">Description</label>
        <textarea
          id="cur-desc"
          rows={3}
          placeholder="My roadmap for becoming a frontend developer."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Create curriculum</button>
      </div>
    </form>
  );
}
