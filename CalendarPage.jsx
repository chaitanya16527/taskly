import Calendar from "../components/Calendar/Calendar";

export default function CalendarPage({ tasks, curriculum, today, taskActions, onAddTask }) {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Calendar</h1>
        <p className="muted">What do you have to do on each date?</p>
      </div>
      <Calendar tasks={tasks} curriculum={curriculum} today={today} taskActions={taskActions} onAddTask={onAddTask} />
    </div>
  );
}
