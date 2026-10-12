import "./OverviewPage.css";

const sampleWorkout = {
  id: "workout-1",
  name: "Upper Body Power",
  category: "Strength",
  time: "6:00 PM",
  date: "October 15, 2020",
  exercises: [
    {
      id: "exercise-1",
      name: "Bench Press",
      target: "4 × 8 · 155 lb",
    },
    {
      id: "exercise-2",
      name: "Pull-ups",
      target: "4 × 8",
    },
    {
      id: "exercise-3",
      name: "Shoulder Press",
      target: "3 × 10 · 75 lb",
    },
  ],
};

function WorkoutCard({ workout, onStart }) {
  return (
    <article className="workout-card">
      <span className="workout-category">
        {workout.category}
      </span>

      <h3>{workout.name}</h3>

      <p className="workout-details">
        {workout.time} - {workout.date}
      </p>

      <ul className="exercise-list">
        {workout.exercises.map((exercise) => (
          <li className="exercise-row" key={exercise.id}>
            <strong>{exercise.name}</strong>
            <span>{exercise.target}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="start-workout"
        onClick={() => onStart(workout)}
        disabled={!onStart}>
        Start workout
      </button>
    </article>
  );
}

function OverviewPage() {
  return (
    <main className="overview-page">
      <div className="overview-content">
        <header className="overview-header">
          <p className="overview-brand">FORMFLOW</p>
          <h1>Welcome back.</h1>
          <p>Let’s make progress today.</p>
        </header>

        <section aria-labelledby="today-heading">
          <h2 id="today-heading">Today’s plan</h2>

          <p className="overview-summary">
            One Workout
          </p>

          <WorkoutCard workout={sampleWorkout} />
        </section>
      </div>
    </main>
  );
}

export default OverviewPage;