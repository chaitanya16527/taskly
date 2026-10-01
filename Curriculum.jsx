import { useState } from "react";
import Icon from "../Icon";
import EmptyState from "../EmptyState";
import ProgressBar from "../ProgressBar";
import InlineAdd from "../InlineAdd";
import CurriculumForm from "./CurriculumForm";
import SubjectCard from "./SubjectCard";
import { getCurriculumProgress } from "../../utils/curriculumUtils";

export default function Curriculum({ curriculum, tasks, actions }) {
  const [showForm, setShowForm] = useState(false);

  if (!curriculum) {
    return (
      <>
        <div className="page-head"><h1>Curriculum</h1></div>
        {showForm ? (
          <div className="card narrow">
            <h2 className="card-title">Create curriculum</h2>
            <CurriculumForm
              onSubmit={(values) => {
                actions.onCreate(values);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <EmptyState
            title="Build your curriculum"
            text="Create a learning plan and track your progress topic by topic."
            actionLabel="Create curriculum"
            onAction={() => setShowForm(true)}
          />
        )}
      </>
    );
  }

  const progress = getCurriculumProgress(curriculum);

  return (
    <>
      <div className="page-head row">
        <div>
          <h1>{curriculum.name}</h1>
          {curriculum.description && <p className="muted">{curriculum.description}</p>}
        </div>
        <button type="button" className="btn btn-ghost danger-text" onClick={actions.onDelete}>
          <Icon name="trash" size={16} />
          Delete curriculum
        </button>
      </div>

      <section className="card overall">
        <div className="row">
          <h2 className="card-title">Overall progress</h2>
          <span className="percent big">{progress.percent}%</span>
        </div>
        <ProgressBar percent={progress.percent} label="Overall curriculum progress" />
        <p className="muted small">
          {progress.completed} / {progress.total} topics completed
        </p>
      </section>

      {curriculum.subjects.length === 0 && (
        <p className="muted">Add your first subject, such as HTML or JavaScript.</p>
      )}

      <div className="stack">
        {curriculum.subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} tasks={tasks} actions={actions} />
        ))}
      </div>

      <div className="add-subject">
        <InlineAdd itemName="Subject" placeholder="e.g. JavaScript" onAdd={actions.onAddSubject} />
      </div>
    </>
  );
}
