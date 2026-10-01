import { useState } from "react";
import Icon from "./Icon";

// Small "+ Add ..." control that expands into a one-field form with inline validation.
export default function InlineAdd({ itemName, placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!value.trim()) {
      setError(`${itemName} name is required.`);
      return;
    }
    onAdd(value.trim());
    setValue("");
    setError("");
  }

  function handleClose() {
    setOpen(false);
    setValue("");
    setError("");
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-link" onClick={() => setOpen(true)}>
        <Icon name="plus" size={16} />
        Add {itemName.toLowerCase()}
      </button>
    );
  }

  const errorId = `inline-error-${itemName}`;
  return (
    <form className="inline-add" onSubmit={handleSubmit} noValidate>
      <div className="inline-add-row">
        <label className="visually-hidden" htmlFor={`inline-${itemName}`}>
          {itemName} name
        </label>
        <input
          id={`inline-${itemName}`}
          type="text"
          autoFocus
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
        />
        <button type="submit" className="btn btn-primary">Add</button>
        <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancel</button>
      </div>
      {error && <p className="error" id={errorId}>{error}</p>}
    </form>
  );
}
