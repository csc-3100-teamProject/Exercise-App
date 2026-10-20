import User from './user.js'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { beforeAll, afterEach, afterAll, test, expect } from '@jest/globals'
import app from './backend.js'
import request from 'supertest'

let mongoServer

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()

    await mongoose.createConnection(uri)
})

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
