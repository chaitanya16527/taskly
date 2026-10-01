import Profile from "../components/Workspace/Profile";
import ProductivityOverview from "../components/Workspace/ProductivityOverview";

export default function WorkspacePage({ profile, tasks, curriculum, onSaveProfile }) {
  return (
    <div className="page">
      <div className="page-head">
        <h1>My Workspace</h1>
        <p className="muted">Who you are, what you are learning, and how you are progressing.</p>
      </div>
      <div className="grid-2">
        <div className="stack">
          <Profile profile={profile} onSave={onSaveProfile} />
        </div>
        <div className="stack">
          <ProductivityOverview tasks={tasks} curriculum={curriculum} />
        </div>
      </div>
    </div>
  );
}
