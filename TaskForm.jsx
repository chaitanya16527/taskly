import { useState } from "react";
import Modal from "./Modal";

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.startDate) errors.startDate = "Start date is required.";
  if (!values.endDate) errors.endDate = "End date is required.";
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = "End date must be after or equal to start date.";
  }
  if (values.hasTime) {
    if (!values.startTime) errors.startTime = "Start time is required.";
    if (!values.endTime) errors.endTime = "End time is required.";
    if (values.startTime && values.endTime && values.endTime < values.startTime) {
      errors.endTime = "Please enter a valid time range.";
    }
  }
  return errors;
}

function Field({ id, label, required, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p className="error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

// Used for both "Add task" (task = null) and "Edit task" (task = existing task).
export default function TaskForm({ task, defaults = {}, curriculum, today, onSave, onCancel }) {
  const isEdit = Boolean(task);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({
    title: task?.title ?? defaults.title ?? "",
    description: task?.description ?? "",
    startDate: task?.startDate ?? defaults.startDate ?? today,
    endDate: task?.endDate ?? defaults.startDate ?? today,
    hasTime: task?.hasTime ?? false,
    startTime: task?.startTime || "09:00",
    endTime: task?.endTime || "10:00",
    priority: task?.priority ?? "Medium",
    topicId: task?.topicId ?? defaults.topicId ?? null,
  });

  // After the first submit attempt, errors update live as the user fixes the fields.
  const errors = submitted ? validate(values) : {};

  function setField(name, value) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Keep the end date from falling behind a newly chosen start date
      if (name === "startDate" && value && next.endDate < value) next.endDate = value;
      return next;
    });
  }

  // Only offer topics that are free, or already linked to this task
  const topicGroups = (curriculum ? curriculum.subjects : [])
    .map((subject) => ({
      subject,
      topics: subject.topics.filter(
        (topic) =>
          !topic.scheduledTaskId ||
          topic.scheduledTaskId === task?.id ||
          topic.id === defaults.topicId
      ),
    }))
    .filter((group) => group.topics.length > 0);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(values)).length > 0) return;

    onSave({
      id: task?.id,
      title: values.title.trim(),
      description: values.description.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      hasTime: values.hasTime,
      startTime: values.hasTime ? values.startTime : "",
      endTime: values.hasTime ? values.endTime : "",
      priority: values.priority,
      topicId: values.topicId,
    });
  }

  const describe = (name) => (errors[name] ? `${name}-error` : undefined);

  return (
    <Modal title={isEdit ? "Edit task" : "Add task"} onClose={onCancel}>
      <form onSubmit={handleSubmit} noValidate>
        <Field id="title" label="Task title" required error={errors.title}>
          <input
            id="title"
            type="text"
            autoFocus
            placeholder="What needs to be done?"
            value={values.title}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describe("title")}
            onChange={(event) => setField("title", event.target.value)}
          />
        </Field>

        <Field id="description" label="Description">
          <textarea
            id="description"
            rows={3}
            placeholder="Add some details..."
            value={values.description}
            onChange={(event) => setField("description", event.target.value)}
          />
        </Field>

        <div className="form-grid">
          <Field id="startDate" label="Start date" required error={errors.startDate}>
            <input
              id="startDate"
              type="date"
              value={values.startDate}
              aria-invalid={Boolean(errors.startDate)}
              aria-describedby={describe("startDate")}
              onChange={(event) => setField("startDate", event.target.value)}
            />
          </Field>
          <Field id="endDate" label="End date" required error={errors.endDate}>
            <input
              id="endDate"
              type="date"
              value={values.endDate}
              min={values.startDate || undefined}
              aria-invalid={Boolean(errors.endDate)}
              aria-describedby={describe("endDate")}
              onChange={(event) => setField("endDate", event.target.value)}
            />
          </Field>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={values.hasTime}
            onChange={(event) => setField("hasTime", event.target.checked)}
          />
          {values.hasTime ? "Specific time" : "No specific time"}
        </label>

        {values.hasTime && (
          <div className="form-grid">
            <Field id="startTime" label="Start time" required error={errors.startTime}>
              <input
                id="startTime"
                type="time"
                value={values.startTime}
                aria-invalid={Boolean(errors.startTime)}
                aria-describedby={describe("startTime")}
                onChange={(event) => setField("startTime", event.target.value)}
              />
            </Field>
            <Field id="endTime" label="End time" required error={errors.endTime}>
              <input
                id="endTime"
                type="time"
                value={values.endTime}
                aria-invalid={Boolean(errors.endTime)}
                aria-describedby={describe("endTime")}
                onChange={(event) => setField("endTime", event.target.value)}
              />
            </Field>
          </div>
        )}

        <div className="form-grid">
          <Field id="priority" label="Priority">
            <select id="priority" value={values.priority} onChange={(event) => setField("priority", event.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </Field>

          {topicGroups.length > 0 && (
            <Field id="topicId" label="Curriculum topic (optional)">
              <select
                id="topicId"
                value={values.topicId ?? ""}
                onChange={(event) => setField("topicId", event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">None</option>
                {topicGroups.map((group) => (
                  <optgroup key={group.subject.id} label={group.subject.name}>
                    {group.topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {group.subject.name} → {topic.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">{isEdit ? "Save changes" : "Add task"}</button>
        </div>
      </form>
    </Modal>
  );
}
