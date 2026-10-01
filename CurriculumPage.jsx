import Curriculum from "../components/Curriculum/Curriculum";

export default function CurriculumPage({ curriculum, tasks, curriculumActions }) {
  return (
    <div className="page">
      <Curriculum curriculum={curriculum} tasks={tasks} actions={curriculumActions} />
    </div>
  );
}
