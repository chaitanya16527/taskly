import Icon from "../Icon";
import ProgressBar from "../ProgressBar";
import InlineAdd from "../InlineAdd";
import TopicItem from "./TopicItem";
import { getSubjectProgress } from "../../utils/curriculumUtils";

export default function SubjectCard({ subject, tasks, actions }) {
  const progress = getSubjectProgress(subject);

  return (
    <section className="card subject">
      <div className="row">
        <div>
          <h3 className="card-title">{subject.name}</h3>
          <p className="muted small">
            {progress.completed} / {progress.total} topics completed
          </p>
        </div>
        <div className="row tight">
          <span className="percent">{progress.percent}%</span>
          <button type="button" className="icon-btn danger" aria-label={`Remove subject "${subject.name}"`} onClick={() => actions.onDeleteSubject(subject)}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      <ProgressBar percent={progress.percent} label={`${subject.name} progress`} />

      {subject.topics.length === 0 ? (
        <p className="muted small">No topics yet. Add the first one below.</p>
      ) : (
        <ul className="topic-list">
          {subject.topics.map((topic) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              task={tasks.find((task) => task.id === topic.scheduledTaskId)}
              onToggle={actions.onToggleTopic}
              onSchedule={actions.onScheduleTopic}
              onDelete={actions.onDeleteTopic}
            />
          ))}
        </ul>
      )}

      <InlineAdd itemName="Topic" placeholder="e.g. Functions" onAdd={(name) => actions.onAddTopic(subject.id, name)} />
    </section>
  );
}
