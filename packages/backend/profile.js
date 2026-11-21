// Pure helpers that build the profile-page payload from workouts.
import { streaks, weekStart, workoutVolume } from './overview.js'

const FEED_LIMIT = 10

// Local (timezone-free) timestamp used for ordering and display.
function completedTime(workout) {
    return workout.completedAt
        ? new Date(workout.completedAt).toISOString()
        : `${workout.date}T${workout.time || '12:00'}:00`
}

function chronological(a, b) {
    return (
        a.date.localeCompare(b.date) ||
        (a.time || '').localeCompare(b.time || '')
    )
}

// A personal record is an exercise lifted heavier than that user's previous
// best for the same exercise. A first-ever lift sets the baseline only.
export function countPersonalRecords(completed) {
    const best = {}
    let records = 0
    for (const workout of [...completed].sort(chronological)) {
        for (const exercise of workout.exercises) {
            if (!exercise.weight) continue
            const key = exercise.name.trim().toLowerCase()
            if (key in best && exercise.weight > best[key]) records++
            best[key] = Math.max(best[key] ?? 0, exercise.weight)
        }
    }
    return records
}

export function buildFeed({ userId, names, workouts }) {
    return workouts
        .filter((w) => w.completed)
        .map((w) => ({
            id: w._id,
            userId: w.userId,
            name: names[String(w.userId)] ?? 'Unknown',
            isYou: String(w.userId) === String(userId),
            workout: w.name,
            category: w.category,
            durationMin: w.durationMin,
            volume: workoutVolume(w),
            distanceMi: w.distanceMi ?? null,
            notes: w.notes ?? '',
            at: completedTime(w),
        }))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, FEED_LIMIT)
}

export function displayName(user) {
    return user.fullName || user.username
}

export function buildProfile({
    user,
    ownWorkouts,
    feedWorkouts,
    names,
    friendsCount,
    today,
}) {
    const completed = ownWorkouts.filter((w) => w.completed)
    const goal = user.weeklyGoal || 5
    return {
        user: {
            id: user._id,
            username: user.username,
            fullName: user.fullName ?? '',
            displayName: displayName(user),
            email: user.email,
            level: user.level,
            units: user.units,
            equipment: user.equipment,
            bio: user.bio ?? '',
            weeklyGoal: goal,
        },
        stats: {
            workouts: completed.length,
            weekStreak: streaks(completed, goal, weekStart(today)).current,
            personalRecords: countPersonalRecords(completed),
        },
        friendsCount,
        feed: buildFeed({
            userId: user._id,
            names,
            workouts: feedWorkouts,
        }),
    }
}
