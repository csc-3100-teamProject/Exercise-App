// Usage: node seed.js <userId>
// Replaces the user's workouts with demo data matching the prototypes, and
// gives them demo friends, pending friend requests and people to add.
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import userModel from './user.js'
import friendshipModel from './friendship.js'
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
    {
        name: 'Tempo Run',
        category: 'Cardio',
        date: at(-2),
        time: '07:00',
        durationMin: 34,
        completed: true,
    },
    {
        name: 'Lower Body',
        category: 'Strength',
        date: at(0),
        time: '18:00',
        durationMin: 48,
        exercises: lowerBody,
        completed: true,
    },
    {
        name: 'Upper Body Power',
        category: 'Strength',
        date: at(1),
        time: '18:00',
        durationMin: 55,
        exercises: upperBody,
        completed: true,
    },
    {
        name: 'Upper Body Power',
        category: 'Strength',
        date: at(2),
        time: '18:00',
        durationMin: 55,
        exercises: upperBody,
    },
    {
        name: 'Lower Body',
        category: 'Strength',
        date: at(4),
        time: '18:00',
        durationMin: 48,
        exercises: lowerBody,
    },
]

// Lifts from last week so this week's 155 lb bench counts as a record.
workouts.push({
    name: 'Upper Body Power',
    category: 'Strength',
    date: at(-6),
    time: '18:00',
    durationMin: 52,
    exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weight: 150 }],
    completed: true,
})
const todays = workouts.find((w) => w.completed && w.exercises?.length > 3)
if (todays) {
    todays.notes =
        'Bench felt smooth today. Added five pounds to the final set.'
    todays.completedAt = new Date(Date.now() - 3 * 60 * 60000)
}

const minutesAgo = (n) => new Date(Date.now() - n * 60000)
const people = [
    {
        username: 'maya.chen',
        fullName: 'Maya Chen',
        level: 'Advanced',
        relation: 'friend',
        workout: {
            name: 'Lower Body Strength',
            category: 'Strength',
            durationMin: 52,
            exercises: [{ name: 'Back Squat', sets: 5, reps: 5, weight: 245 }],
            notes: 'New squat personal record. The last set was a grind.',
            completedAt: minutesAgo(32),
        },
    },
    {
        username: 'noah.reed',
        fullName: 'Noah Reed',
        level: 'Intermediate',
        relation: 'friend',
        workout: {
            name: 'Morning Tempo Run',
            category: 'Cardio',
            durationMin: 32,
            distanceMi: 4.1,
            notes: 'Fastest 5K this month. Perfect weather for it.',
            completedAt: minutesAgo(120),
        },
    },
    { username: 'lena.moves', fullName: 'Lena Ortiz', relation: 'request' },
    { username: 'chrisw', fullName: 'Chris Walker', relation: 'request' },
    { username: 'alex.rivera', fullName: 'Alex Rivera', relation: 'none' },
    { username: 'sam.taylor', fullName: 'Sam Taylor', relation: 'none' },
]

await mongoose.connect(process.env.MONGO_URI)
await workoutModel.deleteMany({ userId })
await workoutModel.insertMany(workouts.map((w) => ({ ...w, userId })))
await userModel.findByIdAndUpdate(userId, {
    fullName: 'Jordan Miller',
    level: 'Intermediate',
    bio: 'Building strength, staying consistent, and mixing in a weekly run.',
})
await friendshipModel.deleteMany({
    $or: [{ requester: userId }, { recipient: userId }],
})

// Demo people can't be logged in to: they get a random, unknown password.
for (const { workout, relation, ...account } of people) {
    const person = await userModel.findOneAndUpdate(
        { username: account.username },
        {
            ...account,
            email: `${account.username}@example.com`,
            password: await bcrypt.hash(crypto.randomUUID(), 12),
        },
        { upsert: true, returnDocument: 'after' }
    )
    await workoutModel.deleteMany({ userId: person._id })
    if (workout) {
        await workoutModel.create({
            ...workout,
            userId: person._id,
            date: today,
            time: '07:00',
            completed: true,
        })
    }
    if (relation === 'friend') {
        await friendshipModel.create({
            requester: userId,
            recipient: person._id,
            status: 'accepted',
        })
    } else if (relation === 'request') {
        await friendshipModel.create({
            requester: person._id,
            recipient: userId,
        })
    }
}
console.log(
    `Seeded ${workouts.length} workouts and ${people.length} demo people for ${userId} (week of ${monday})`
)
await mongoose.disconnect()
