// Pure helpers that turn a user's workouts into the home-page payload.
// Dates are 'YYYY-MM-DD' strings; weeks run Monday to Sunday.

const DAY_MS = 24 * 60 * 60 * 1000
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toUtc(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
}

function toDateStr(ms) {
    return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(dateStr, n) {
    return toDateStr(toUtc(dateStr) + n * DAY_MS)
}

export function weekStart(dateStr) {
    const offset = (new Date(toUtc(dateStr)).getUTCDay() + 6) % 7
    return addDays(dateStr, -offset)
}

export function workoutVolume(workout) {
    return workout.exercises.reduce(
        (sum, e) => sum + (e.sets || 0) * (e.reps || 0) * (e.weight || 0),
        0
    )
}

function streaks(completed, goal, currentWeek) {
    const perWeek = {}
    for (const w of completed) {
        const key = weekStart(w.date)
        perWeek[key] = (perWeek[key] || 0) + 1
    }
    const met = (week) => (perWeek[week] || 0) >= goal

    // The current week only extends the streak once its goal is met; it never
    // breaks a streak while it is still in progress.
    let current = 0
    let week = met(currentWeek) ? currentWeek : addDays(currentWeek, -7)
    while (met(week)) {
        current++
        week = addDays(week, -7)
    }

    let longest = 0
    let run = 0
    const weeks = Object.keys(perWeek).sort()
    if (weeks.length) {
        for (let w = weeks[0]; w <= currentWeek; w = addDays(w, 7)) {
            run = met(w) ? run + 1 : 0
            longest = Math.max(longest, run)
        }
    }
    return { current, longest: Math.max(longest, current) }
}

export function buildOverview({ user, workouts, today, weeklyGoal = 5 }) {
    const goal = user.weeklyGoal || weeklyGoal
    const start = weekStart(today)
    const weekDates = DAY_LABELS.map((_, i) => addDays(start, i))
    const lastWeekDates = weekDates.map((d) => addDays(d, -7))
    const completed = workouts.filter((w) => w.completed)

    const week = weekDates.map((date, i) => {
        const onDay = workouts.filter((w) => w.date === date)
        let status = null
        if (onDay.some((w) => w.completed)) status = 'done'
        else if (onDay.length) status = 'planned'
        return {
            date,
            label: DAY_LABELS[i],
            day: Number(date.slice(8)),
            isToday: date === today,
            status,
        }
    })

    const todaysPlan = workouts
        .filter((w) => w.date === today && !w.completed)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    const recentActivity = [...completed]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 2)
        .map((w) => ({
            id: w._id,
            name: w.name,
            date: w.date,
            durationMin: w.durationMin,
        }))

    const doneThisWeek = completed.filter((w) =>
        weekDates.includes(w.date)
    ).length
    const daysRemaining = weekDates.filter((d) => d > today).length
    const remaining = Math.max(goal - doneThisWeek, 0)
    let goalStatus = 'On track'
    if (remaining === 0) goalStatus = 'Goal met'
    else if (remaining > daysRemaining + 1) goalStatus = 'Behind'

    const dailyVolume = weekDates.map((date) =>
        completed
            .filter((w) => w.date === date)
            .reduce((sum, w) => sum + workoutVolume(w), 0)
    )
    const totalVolume = dailyVolume.reduce((a, b) => a + b, 0)
    const lastWeekVolume = completed
        .filter((w) => lastWeekDates.includes(w.date))
        .reduce((sum, w) => sum + workoutVolume(w), 0)
    const changePct = lastWeekVolume
        ? Math.round(((totalVolume - lastWeekVolume) / lastWeekVolume) * 1000) /
          10
        : null

    const streak = streaks(completed, goal, start)

    return {
        user: { id: user._id, username: user.username },
        today,
        week,
        todaysPlan: todaysPlan.map((w) => ({
            id: w._id,
            name: w.name,
            category: w.category,
            time: w.time,
            durationMin: w.durationMin,
            exercises: w.exercises,
        })),
        recentActivity,
        weeklyGoal: {
            goal,
            completed: doneThisWeek,
            remaining,
            daysRemaining,
            status: goalStatus,
        },
        streak: {
            weeks: streak.current,
            longestWeeks: streak.longest,
            days: week.map((d) => ({ label: d.label, status: d.status })),
        },
        trainingVolume: {
            total: totalVolume,
            changePct,
            daily: week.map((d, i) => ({
                label: d.label,
                volume: dailyVolume[i],
            })),
        },
    }
}
