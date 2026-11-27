import { expect, test } from '@jest/globals'
import { buildFeed, buildProfile, countPersonalRecords } from './profile.js'

const lift = (date, weight, name = 'Bench Press') => ({
    _id: `${date}-${weight}`,
    userId: 'u1',
    name: 'Upper',
    category: 'Strength',
    date,
    time: '18:00',
    durationMin: 50,
    exercises: [{ name, sets: 4, reps: 8, weight }],
    completed: true,
})

test('first lift sets a baseline, only heavier lifts count as records', () => {
    const workouts = [
        lift('2026-10-01', 135),
        lift('2026-10-08', 145),
        lift('2026-10-15', 145),
        lift('2026-10-22', 140),
        lift('2026-10-29', 155),
    ]
    expect(countPersonalRecords(workouts)).toBe(2)
})

test('records are tracked per exercise and ignore bodyweight work', () => {
    const workouts = [
        lift('2026-10-01', 100, 'Squat'),
        lift('2026-10-02', 135, 'Bench Press'),
        lift('2026-10-08', undefined, 'Pull-ups'),
        lift('2026-10-09', 140, 'bench press'),
    ]
    expect(countPersonalRecords(workouts)).toBe(1)
})

test('records are order independent of input order', () => {
    const a = lift('2026-10-01', 135)
    const b = lift('2026-10-08', 145)
    expect(countPersonalRecords([b, a])).toBe(1)
})

test('feed is newest first, completed only, and labels the user', () => {
    const feed = buildFeed({
        userId: 'u1',
        names: { u1: 'Jordan', u2: 'Maya' },
        workouts: [
            lift('2026-10-01', 135),
            { ...lift('2026-10-09', 100), userId: 'u2' },
            { ...lift('2026-10-20', 100), completed: false },
            {
                ...lift('2026-10-05', 100),
                completedAt: '2026-10-10T12:00:00.000Z',
                distanceMi: 4.1,
                notes: 'Felt good',
            },
        ],
    })
    expect(feed.map((f) => f.name)).toEqual(['Jordan', 'Maya', 'Jordan'])
    expect(feed[0].isYou).toBe(true)
    expect(feed[0].distanceMi).toBe(4.1)
    expect(feed[0].notes).toBe('Felt good')
    expect(feed[1].isYou).toBe(false)
    expect(feed.find((f) => f.id === '2026-10-20-100')).toBeUndefined()
})

test('feed is capped at 10 items', () => {
    const workouts = Array.from({ length: 15 }, (_, i) =>
        lift(`2026-10-${String(i + 1).padStart(2, '0')}`, 100 + i)
    )
    expect(
        buildFeed({ userId: 'u1', names: { u1: 'J' }, workouts })
    ).toHaveLength(10)
})

test('buildProfile reports stats, friend count and user details', () => {
    const own = [lift('2026-10-01', 135), lift('2026-10-08', 145)]
    const profile = buildProfile({
        user: {
            _id: 'u1',
            username: 'Jordan',
            email: 'j@x.com',
            level: 'Intermediate',
            weeklyGoal: 1,
            fullName: 'Jordan Miller',
        },
        ownWorkouts: own,
        feedWorkouts: own,
        names: { u1: 'Jordan Miller' },
        friendsCount: 1,
        today: '2026-10-08',
    })
    expect(profile.user.level).toBe('Intermediate')
    expect(profile.stats).toEqual({
        workouts: 2,
        weekStreak: 2,
        personalRecords: 1,
    })
    expect(profile.friendsCount).toBe(1)
    expect(profile.feed).toHaveLength(2)
    expect(profile.user.password).toBeUndefined()
    expect(profile.user.displayName).toBe('Jordan Miller')
})
