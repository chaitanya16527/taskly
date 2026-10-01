import History from "../components/History/History";

export default function HistoryPage({ tasks, curriculum, today }) {
  return (
    <div className="page">
      <History tasks={tasks} curriculum={curriculum} today={today} />
    </div>
  );
}
