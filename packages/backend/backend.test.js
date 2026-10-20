import User from './user.js'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { beforeAll, afterEach, afterAll, test, expect } from '@jest/globals'
import app from './backend.js'
import request from 'supertest'

let mongoServer

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    // Connect the app's default connection to the in-memory server so tests
    // never touch the database named in MONGO_URI.
    await mongoose.connect(mongoServer.getUri())
}, 120000)

afterEach(async () => {
    await mongoose.connection.db.dropDatabase()
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

//Login Page related tests
test('Testing Post function for creating user in system', async () => {
    const response = await request(app).post('/users').send({
        username: 'Jacky',
        email: 'Yesman666@gmail.com',
        password: '123456789',
    })
    expect(response.status).toBe(200)
    const result = await User.findOne({ email: 'Yesman666@gmail.com' })
    expect(result.username).toBe('Jacky')
    expect(result.weeklyGoal).toBe(5)
    expect(result.password).not.toBe('123456789')
})

test('Testing Post function for duplicate user in system', async () => {
    await User.create({
        username: 'Jacky',
        email: 'Yesman666@gmail.com',
        password: '123456789',
    })
    const response = await request(app).post('/users').send({
        username: 'Jacky',
        email: 'Yesman666@gmail.com',
        password: '123456789',
    })
    expect(response.status).toBe(409)
})

test('Testing Post login authentication', async () => {
    await User.create({
        username: 'Jacky',
        email: 'Yesman666@gmail.com',
        password:
            '$2b$12$C2UPcZtP3hq5B5SaB.iZlOW.u4AqD11M6X5beWTKl169BVdWxu6Pm',
    })
    const response = await request(app).post('/auth/login').send({
        email: 'Yesman666@gmail.com',
        password: '123456789',
    })
    expect(response.status).toBe(200)
    expect(response.body.username).toBe('Jacky')
})

test('Testing Post login authentication fail', async () => {
    await User.create({
        username: 'Jacky',
        email: 'Yesman666@gmail.com',
        password:
            '$2b$12$C2UPcZtP3hq5B5SaB.iZlOW.u4AqD11M6X5beWTKl169BVdWxu6Pm',
    })
    const response = await request(app).post('/auth/login').send({
        email: 'Yesman666@gmail.com',
        password: '12345',
    })
    expect(response.status).toBe(404)
})

test('Signup with missing fields returns 400', async () => {
    const response = await request(app)
        .post('/users')
        .send({ username: 'Jacky', email: 'a@b.com' })
    expect(response.status).toBe(400)
    expect(await User.countDocuments()).toBe(0)
})

test('Signup ignores extra fields like weeklyGoal', async () => {
    await request(app).post('/users').send({
        username: 'Jacky',
        email: 'a@b.com',
        password: '123456789',
        weeklyGoal: 99,
    })
    const result = await User.findOne({ email: 'a@b.com' })
    expect(result.weeklyGoal).toBe(5)
})

test('Login with missing body returns 400', async () => {
    const response = await request(app).post('/auth/login').send({})
    expect(response.status).toBe(400)
})

test('Login with unknown email returns 404', async () => {
    const response = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: '123456789' })
    expect(response.status).toBe(404)
})

test('Signup then login works end to end', async () => {
    await request(app)
        .post('/users')
        .send({
            username: 'Sam',
            email: 'sam@example.com',
            password: 'pw12345',
        })
    const response = await request(app)
        .post('/auth/login')
        .send({ email: 'sam@example.com', password: 'pw12345' })
    expect(response.status).toBe(200)
    expect(response.body.username).toBe('Sam')
    expect(response.body.id).toBeDefined()
    expect(response.body.password).toBeUndefined()
})
