import { useState } from "react";

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("") || "?";
}

// Prototype profile: stored in this browser only. There is no real account yet.
export default function Profile({ profile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");

  function startEditing() {
    setDraft(profile);
    setError("");
    setEditing(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    onSave({
      name: draft.name.trim(),
      bio: draft.bio.trim(),
      learningFocus: draft.learningFocus.trim(),
    });
    setEditing(false);
  }

  return (
    <>
      <section className="card">
        <div className="row">
          <h2 className="card-title">Profile</h2>
          {!editing && (
            <button type="button" className="btn btn-ghost" onClick={startEditing}>Edit profile</button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="p-name">Name <span className="req" aria-hidden="true">*</span></label>
              <input
                id="p-name"
                type="text"
                autoFocus
                value={draft.name}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "p-name-error" : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value });
                  setError("");
                }}
              />
              {error && <p className="error" id="p-name-error">{error}</p>}
            </div>
            <div className="field">
              <label htmlFor="p-focus">Learning focus</label>
              <input
                id="p-focus"
                type="text"
                value={draft.learningFocus}
                onChange={(event) => setDraft({ ...draft, learningFocus: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="p-bio">Short bio</label>
              <textarea
                id="p-bio"
                rows={3}
                value={draft.bio}
                onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save profile</button>
            </div>
          </form>
        ) : (
          <div className="profile">
            <span className="avatar lg" aria-hidden="true">{getInitials(profile.name)}</span>
            <div>
              <p className="profile-title">{profile.name}</p>
              {profile.bio && <p className="muted">{profile.bio}</p>}
              <dl className="details">
                <div><dt>Learning focus</dt><dd>{profile.learningFocus || "Not set"}</dd></div>
                <div><dt>Email</dt><dd>Not connected yet</dd></div>
                <div><dt>Member since</dt><dd>Local prototype</dd></div>
              </dl>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Account</h2>
        <dl className="details">
          <div><dt>Google account</dt><dd>Not connected</dd></div>
        </dl>
        <p className="muted small">
          Authentication will be added in a future version. Until then, your data stays in this browser only.
        </p>
      </section>
    </>
  );
}
