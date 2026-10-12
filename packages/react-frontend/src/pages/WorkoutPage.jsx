import "./OverviewPage.css";

function WorkoutPage({ workout, onBack }) {
  return (
    <main className="overview-page">
      <div className="overview-content">
        <button
          type="button"
          className="back-to-overview"
          onClick={onBack}
        >
          Back to overview
        </button>

        <header className="overview-header">
          <p className="overview-brand">YOUR WORKOUT</p>
          <h1>{workout.name}</h1>
          <p>
            {workout.exercises.length} exercises,
            about {workout.durationMinutes} minutes
          </p>
        </header>

        <section
          className="workout-card"
          aria-labelledby="targets-heading"
        >
          <h2 id="targets-heading">Exercise targets</h2>

          <ul className="exercise-list">
            {workout.exercises.map((exercise) => (
              <li className="exercise-row" key={exercise.id}>
                <strong>{exercise.name}</strong>
                <span>{exercise.target}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default WorkoutPage;