import mongoose from 'mongoose'

const ExerciseSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        sets: { type: Number, min: 0 },
        reps: { type: Number, min: 0 },
        weight: { type: Number, min: 0 },
    },
    { _id: false }
)

const WorkoutSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        // Calendar date (YYYY-MM-DD) and 24h time (HH:mm), stored as strings so
        // the "week" a workout belongs to never shifts with time zones.
        date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        time: { type: String, match: /^\d{2}:\d{2}$/ },
        durationMin: { type: Number, min: 1, max: 1600 },
        exercises: { type: [ExerciseSchema], default: [] },
        completed: { type: Boolean, default: false },
    },
    { collection: 'workouts_list' }
)

const Workout = mongoose.model('Workout', WorkoutSchema)

export default Workout
