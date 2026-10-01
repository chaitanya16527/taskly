// Curriculum shape:
// { id, name, description, subjects: [{ id, name, topics: [
//   { id, name, completed, completedAt, scheduledTaskId } ] }] }

export function calcProgress(completed, total) {
  // Avoid NaN when there are no topics
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function getSubjectProgress(subject) {
  const done = subject.topics.filter((topic) => topic.completed).length;
  return calcProgress(done, subject.topics.length);
}

// Flat list of every topic, with its subject name attached
export function getAllTopics(curriculum) {
  if (!curriculum) return [];
  return curriculum.subjects.flatMap((subject) =>
    subject.topics.map((topic) => ({ ...topic, subjectName: subject.name }))
  );
}

export function getCurriculumProgress(curriculum) {
  const topics = getAllTopics(curriculum);
  return calcProgress(topics.filter((topic) => topic.completed).length, topics.length);
}

// "JavaScript → Functions", or null if the topic no longer exists
export function getTopicLabel(curriculum, topicId) {
  if (!topicId) return null;
  const topic = getAllTopics(curriculum).find((item) => item.id === topicId);
  return topic ? `${topic.subjectName} → ${topic.name}` : null;
}

// Returns a new curriculum with every topic run through `change`
export function mapTopics(curriculum, change) {
  return {
    ...curriculum,
    subjects: curriculum.subjects.map((subject) => ({
      ...subject,
      topics: subject.topics.map(change),
    })),
  };
}

// Point `topicId` at `taskId` (and remove the task from any other topic)
export function linkTaskToTopic(curriculum, taskId, topicId) {
  return mapTopics(curriculum, (topic) => {
    if (topic.id === topicId) return { ...topic, scheduledTaskId: taskId };
    if (topic.scheduledTaskId === taskId) return { ...topic, scheduledTaskId: null };
    return topic;
  });
}

// Used when a task is deleted, so no topic keeps a broken reference
export function unlinkTask(curriculum, taskId) {
  return mapTopics(curriculum, (topic) =>
    topic.scheduledTaskId === taskId ? { ...topic, scheduledTaskId: null } : topic
  );
}
