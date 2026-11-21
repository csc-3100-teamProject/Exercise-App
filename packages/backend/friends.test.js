import User from './user.js'
import Friendship from './friendship.js'
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

const makeUser = (username, extra = {}) =>
    User.create({
        username,
        email: `${username.toLowerCase()}@example.com`,
        password: 'hashed-password',
        ...extra,
    })

const as = (user) => ({
    Authorization: `Bearer ${jwt.sign(
        { id: user._id.toString(), username: user.username },
        process.env.TOKEN_SECRET
    )}`,
})

const befriend = (a, b, status = 'accepted') =>
    Friendship.create({ requester: a._id, recipient: b._id, status })

test('sending a request creates a pending friendship for the other person', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya')
    const sent = await request(app)
        .post(`/users/${me._id}/friends`)
        .set(as(me))
        .send({ userId: String(maya._id) })
    expect(sent.status).toBe(201)
    expect(sent.body.status).toBe('sent')

    const mine = await request(app).get(`/users/${me._id}/friends`).set(as(me))
    expect(mine.body.friends).toEqual([])
    expect(mine.body.requests).toEqual([])

    const theirs = await request(app)
        .get(`/users/${maya._id}/friends`)
        .set(as(maya))
    expect(theirs.body.requests).toHaveLength(1)
    expect(theirs.body.requests[0]).toMatchObject({
        username: 'Jordan',
        name: 'Jordan',
    })
})

test('accepting makes both people friends and shares workouts in the feed', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya', { fullName: 'Maya Chen' })
    await workout.create({
        userId: maya._id,
        name: 'Lower Body Strength',
        category: 'Strength',
        date: '2026-10-13',
        durationMin: 52,
        completed: true,
        notes: 'New squat record',
    })
    await request(app)
        .post(`/users/${me._id}/friends`)
        .set(as(me))
        .send({ userId: String(maya._id) })
    const requests = (
        await request(app).get(`/users/${maya._id}/friends`).set(as(maya))
    ).body.requests
    const accepted = await request(app)
        .post(
            `/users/${maya._id}/friend-requests/${requests[0].requestId}/accept`
        )
        .set(as(maya))
    expect(accepted.status).toBe(204)

    const mine = await request(app).get(`/users/${me._id}/friends`).set(as(me))
    expect(mine.body.friends).toHaveLength(1)
    expect(mine.body.friends[0]).toMatchObject({
        name: 'Maya Chen',
        workouts: 1,
    })
    const profile = await request(app)
        .get(`/users/${me._id}/profile?date=2026-10-14`)
        .set(as(me))
    expect(profile.body.friendsCount).toBe(1)
    expect(profile.body.feed[0]).toMatchObject({
        name: 'Maya Chen',
        isYou: false,
        notes: 'New squat record',
    })
})

test('declining a request removes it without making friends', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya')
    await befriend(maya, me, 'pending')
    const [{ requestId }] = (
        await request(app).get(`/users/${me._id}/friends`).set(as(me))
    ).body.requests
    const declined = await request(app)
        .delete(`/users/${me._id}/friend-requests/${requestId}`)
        .set(as(me))
    expect(declined.status).toBe(204)
    expect(await Friendship.countDocuments()).toBe(0)
})

test('only the recipient can answer a request', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya')
    const sam = await makeUser('Sam')
    const link = await befriend(maya, me, 'pending')
    const asSender = await request(app)
        .post(`/users/${maya._id}/friend-requests/${link._id}/accept`)
        .set(as(maya))
    expect(asSender.status).toBe(404)
    const asOther = await request(app)
        .post(`/users/${me._id}/friend-requests/${link._id}/accept`)
        .set(as(sam))
    expect(asOther.status).toBe(403)
    expect((await Friendship.findById(link._id)).status).toBe('pending')
})

test('adding someone who already asked you makes you friends straight away', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya')
    await befriend(maya, me, 'pending')
    const response = await request(app)
        .post(`/users/${me._id}/friends`)
        .set(as(me))
        .send({ userId: String(maya._id) })
    expect(response.status).toBe(201)
    expect(response.body.status).toBe('accepted')
    expect(await Friendship.countDocuments({ status: 'accepted' })).toBe(1)
})

test('cannot add yourself, an unknown user, a duplicate or send bad input', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya')
    const add = (userId) =>
        request(app)
            .post(`/users/${me._id}/friends`)
            .set(as(me))
            .send({ userId })
    expect((await add(String(me._id))).status).toBe(400)
    expect((await add(String(new mongoose.Types.ObjectId()))).status).toBe(404)
    expect((await add('nope')).status).toBe(400)
    expect((await add(String(maya._id))).status).toBe(201)
    expect((await add(String(maya._id))).status).toBe(409)
    await befriend(maya, me, 'pending')
})

test('removing a friend ends the friendship for both people', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya')
    await befriend(maya, me)
    const removed = await request(app)
        .delete(`/users/${me._id}/friends/${maya._id}`)
        .set(as(me))
    expect(removed.status).toBe(204)
    expect(await Friendship.countDocuments()).toBe(0)
    const again = await request(app)
        .delete(`/users/${me._id}/friends/${maya._id}`)
        .set(as(me))
    expect(again.status).toBe(404)
})

test('people search matches name or username and shows each relationship', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya', { fullName: 'Maya Chen' })
    const alex = await makeUser('arivera', { fullName: 'Alex Rivera' })
    const sam = await makeUser('Sam', { fullName: 'Sam Taylor' })
    const noah = await makeUser('Noah', { fullName: 'Noah Reed' })
    await befriend(me, maya)
    await befriend(alex, maya)
    await befriend(me, sam, 'pending')

    const all = await request(app).get(`/users/${me._id}/people`).set(as(me))
    expect(all.status).toBe(200)
    expect(all.body.map((p) => [p.name, p.status])).toEqual([
        ['Maya Chen', 'friend'],
        ['Sam Taylor', 'sent'],
        ['Alex Rivera', 'none'],
        ['Noah Reed', 'none'],
    ])
    expect(all.body.find((p) => p.name === 'Alex Rivera').mutualFriends).toBe(1)
    expect(all.body.find((p) => p.name === 'Noah Reed').mutualFriends).toBe(0)
    expect(JSON.stringify(all.body)).not.toContain('example.com')

    const byName = await request(app)
        .get(`/users/${me._id}/people?q=riv`)
        .set(as(me))
    expect(byName.body.map((p) => p.name)).toEqual(['Alex Rivera'])
    const byHandle = await request(app)
        .get(`/users/${me._id}/people?q=ARIVERA`)
        .set(as(me))
    expect(byHandle.body).toHaveLength(1)
    expect(noah).toBeDefined()
})

test('people search treats the query as plain text, not a pattern', async () => {
    const me = await makeUser('Jordan')
    await makeUser('Maya')
    const response = await request(app)
        .get(`/users/${me._id}/people?q=.*`)
        .set(as(me))
    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
})

test('friend routes need a token and only work for the account owner', async () => {
    const me = await makeUser('Jordan')
    const maya = await makeUser('Maya')
    for (const path of ['friends', 'people']) {
        expect(
            (await request(app).get(`/users/${me._id}/${path}`)).status
        ).toBe(401)
        expect(
            (await request(app).get(`/users/${me._id}/${path}`).set(as(maya)))
                .status
        ).toBe(403)
    }
    const post = await request(app)
        .post(`/users/${me._id}/friends`)
        .set(as(maya))
        .send({ userId: String(maya._id) })
    expect(post.status).toBe(403)
})
