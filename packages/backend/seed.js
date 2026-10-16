// Usage: node seed.js <userId>
// Replaces the user's workouts with demo data matching the home-page prototype.
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import workoutModel from './workout.js'
import { addDays, weekStart } from './overview.js'
dotenv.config()

const userId = process.argv[2]
if (!mongoose.isValidObjectId(userId)) {
    console.error('Usage: node seed.js <userId>')
    process.exit(1)
}

const today = new Date().toLocaleDateString('en-CA')
const monday = weekStart(today)
const at = (i) => addDays(monday, i)

const upperBody = [
    { name: 'Bench Press', sets: 4, reps: 8, weight: 155 },
    { name: 'Pull-ups', sets: 4, reps: 8 },
    { name: 'Shoulder Press', sets: 3, reps: 10, weight: 75 },
    { name: 'Barbell Row', sets: 4, reps: 8, weight: 115 },
    { name: 'Dips', sets: 3, reps: 10 },
    { name: 'Face Pulls', sets: 3, reps: 15, weight: 40 },
]
const lowerBody = [
    { name: 'Back Squat', sets: 5, reps: 5, weight: 185 },
    { name: 'Romanian Deadlift', sets: 4, reps: 8, weight: 155 },
    { name: 'Walking Lunges', sets: 3, reps: 12, weight: 40 },
]

const workouts = [
    { name: 'Tempo Run', category: 'Cardio', date: at(-2), time: '07:00', durationMin: 34, completed: true },
    { name: 'Lower Body', category: 'Strength', date: at(0), time: '18:00', durationMin: 48, exercises: lowerBody, completed: true },
    { name: 'Upper Body Power', category: 'Strength', date: at(1), time: '18:00', durationMin: 55, exercises: upperBody, completed: true },
    { name: 'Upper Body Power', category: 'Strength', date: at(2), time: '18:00', durationMin: 55, exercises: upperBody },
    { name: 'Lower Body', category: 'Strength', date: at(4), time: '18:00', durationMin: 48, exercises: lowerBody },
]

await mongoose.connect(process.env.MONGO_URI)
await workoutModel.deleteMany({ userId })
await workoutModel.insertMany(workouts.map((w) => ({ ...w, userId })))
console.log(`Seeded ${workouts.length} workouts for ${userId} (week of ${monday})`)
await mongoose.disconnect()
