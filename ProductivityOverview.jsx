import TaskStats from "../TaskStats";
import ProgressBar from "../ProgressBar";
import { calcProgress, getCurriculumProgress } from "../../utils/curriculumUtils";
import { getCompletedTasks } from "../../utils/taskUtils";

export default function ProductivityOverview({ tasks, curriculum }) {
  const taskProgress = calcProgress(getCompletedTasks(tasks).length, tasks.length);
  const curriculumProgress = getCurriculumProgress(curriculum);

  return (
    <section className="card">
      <h2 className="card-title">Productivity overview</h2>
      <TaskStats tasks={tasks} />

      <div className="meter">
        <div className="row">
          <p>Task completion</p>
          <p className="percent">{taskProgress.percent}%</p>
        </div>
        <ProgressBar percent={taskProgress.percent} label="Task completion" />
        <p className="muted small">{taskProgress.completed} / {taskProgress.total} tasks completed</p>
      </div>

      <div className="meter">
        <div className="row">
          <p>Curriculum progress{curriculum ? `: ${curriculum.name}` : ""}</p>
          <p className="percent">{curriculumProgress.percent}%</p>
        </div>
        <ProgressBar percent={curriculumProgress.percent} label="Curriculum progress" />
        <p className="muted small">
          {curriculum
            ? `${curriculumProgress.completed} / ${curriculumProgress.total} topics completed`
            : "No curriculum yet."}
        </p>
      </div>
    </section>
  );
}
