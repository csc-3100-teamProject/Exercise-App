import User from './user.js'
import workout from './workout.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { beforeAll, afterEach, afterAll, test, expect } from '@jest/globals'
import app from './backend.js'
import request from 'supertest'

let mongoServer

beforeAll(async () => {
    process.env.TOKEN_SECRET ??= 'test-secret'
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
}, 120000)

afterEach(async () => {
    await mongoose.connection.db.dropDatabase()
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

const today = '2026-10-14'

async function makeUser(username, extra = {}) {
    return User.create({
        username,
        email: `${username.toLowerCase()}@example.com`,
        password: 'hashed-password',
        ...extra,
    })
}

const tokenFor = (user) =>
    jwt.sign(
        { id: user._id.toString(), username: user.username },
        process.env.TOKEN_SECRET
    )

const as = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` })

test('GET profile returns details, stats and own feed', async () => {
    const me = await makeUser('Jordan', {
        fullName: 'Jordan Miller',
        level: 'Intermediate',
    })
    await workout.create({
        userId: me._id,
        name: 'Upper Body Power',
        category: 'Strength',
        date: '2026-10-14',
        durationMin: 55,
        completed: true,
        notes: 'Felt smooth',
        exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weight: 155 }],
    })
    const response = await request(app)
        .get(`/users/${me._id}/profile?date=${today}`)
        .set(as(me))
    expect(response.status).toBe(200)
    expect(response.body.user.displayName).toBe('Jordan Miller')
    expect(response.body.user.level).toBe('Intermediate')
    expect(response.body.user.units).toBe('Imperial')
    expect(response.body.user.password).toBeUndefined()
    expect(response.body.stats.workouts).toBe(1)
    expect(response.body.feed).toHaveLength(1)
    expect(response.body.feed[0]).toMatchObject({
        name: 'Jordan Miller',
        isYou: true,
        workout: 'Upper Body Power',
        volume: 4960,
        notes: 'Felt smooth',
    })
})

test('GET profile needs a token, the right owner and a valid date', async () => {
    const me = await makeUser('Jordan')
    const other = await makeUser('Maya')
    const url = `/users/${me._id}/profile?date=${today}`
    expect((await request(app).get(url)).status).toBe(401)
    expect((await request(app).get(url).set(as(other))).status).toBe(403)
    expect(
        (await request(app).get(`/users/${me._id}/profile`).set(as(me))).status
    ).toBe(400)
    expect(
        (
            await request(app)
                .get(`/users/nope/profile?date=${today}`)
                .set(as(me))
        ).status
    ).toBe(404)
})

test('PATCH profile saves every editable field', async () => {
    const me = await makeUser('Jordan')
    const response = await request(app)
        .patch(`/users/${me._id}/profile`)
        .set(as(me))
        .send({
            fullName: 'Jordan Miller',
            email: 'new@example.com',
            level: 'Advanced',
            units: 'Metric',
            weeklyGoal: 4,
            equipment: 'Home gym',
            bio: 'Building strength.',
        })
    expect(response.status).toBe(200)
    expect(response.body.password).toBeUndefined()
    const saved = await User.findById(me._id)
    expect(saved).toMatchObject({
        fullName: 'Jordan Miller',
        email: 'new@example.com',
        level: 'Advanced',
        units: 'Metric',
        weeklyGoal: 4,
        equipment: 'Home gym',
        bio: 'Building strength.',
    })
})

test('PATCH profile rejects invalid values', async () => {
    const me = await makeUser('Jordan')
    for (const body of [
        { weeklyGoal: 0 },
        { weeklyGoal: 8 },
        { weeklyGoal: 2.5 },
        { weeklyGoal: '3' },
        { level: 'Elite' },
        { units: 'Cubits' },
        { equipment: 'Spaceship' },
        { email: 'not-an-email' },
        { username: '   ' },
        { bio: 'x'.repeat(201) },
        { fullName: 'x'.repeat(61) },
        { fullName: 42 },
    ]) {
        const response = await request(app)
            .patch(`/users/${me._id}/profile`)
            .set(as(me))
            .send(body)
        expect(response.status).toBe(400)
    }
})

test('PATCH profile rejects taken email or username, allows your own', async () => {
    const me = await makeUser('Jordan')
    await makeUser('Maya')
    const patch = (body) =>
        request(app).patch(`/users/${me._id}/profile`).set(as(me)).send(body)
    expect((await patch({ email: 'maya@example.com' })).status).toBe(409)
    expect((await patch({ username: 'Maya' })).status).toBe(409)
    expect(
        (await patch({ username: 'Jordan', email: 'jordan@example.com' }))
            .status
    ).toBe(200)
})

test('PATCH profile cannot change the password or edit another user', async () => {
    const me = await makeUser('Jordan')
    const other = await makeUser('Maya')
    await request(app)
        .patch(`/users/${me._id}/profile`)
        .set(as(me))
        .send({ password: 'hacked', fullName: 'Jordan' })
    expect((await User.findById(me._id)).password).toBe('hashed-password')
    const response = await request(app)
        .patch(`/users/${me._id}/profile`)
        .set(as(other))
        .send({ fullName: 'Hacked' })
    expect(response.status).toBe(403)
})

test('GET /users never exposes password hashes', async () => {
    const me = await makeUser('Jordan')
    const list = await request(app).get('/users')
    expect(list.body[0].password).toBeUndefined()
    const one = await request(app).get(`/users/${me._id}`)
    expect(one.body.password).toBeUndefined()
})
