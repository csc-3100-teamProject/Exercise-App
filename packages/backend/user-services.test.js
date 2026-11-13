import User from './user.js'
import mockingoose from 'mockingoose'
import functions from './user-services.js'
import workout from './workout.js'
import { beforeEach, expect, test, jest } from '@jest/globals'

beforeEach(async () => {
    jest.clearAllMocks()
    mockingoose.resetAll()
})

//Testing user services functions related to Login
test('Testing loginCheck with correct password', async () => {
    mockingoose(User).toReturn(
        {
            username: 'Jacky',
            email: 'Yesman666@gmail.com',
            password:
                '$2b$12$C2UPcZtP3hq5B5SaB.iZlOW.u4AqD11M6X5beWTKl169BVdWxu6Pm',
            weeklyGoal: 5,
        },
        'findOne'
    )
    const result = await functions.loginCheck(
        'Yesman666@gmail.com',
        '123456789'
    )
    expect(result.user.password).toBe(
        '$2b$12$C2UPcZtP3hq5B5SaB.iZlOW.u4AqD11M6X5beWTKl169BVdWxu6Pm'
    )
})

test('Testing loginCheck with wrong password', async () => {
    mockingoose(User).toReturn(
        {
            username: 'Jacky',
            email: 'Yesman666@gmail.com',
            password:
                '$2b$12$C2UPcZtP3hq5B5SaB.iZlOW.u4AqD11M6X5beWTKl169BVdWxu6Pm',
            weeklyGoal: 5,
        },
        'findOne'
    )
    const result = await functions.loginCheck('Yesman666@gmail.com', '12345')
    expect(result).toBe(404)
})

test('Testing loginCheck with non valid email', async () => {
    mockingoose(User).toReturn(
        {
            username: 'Jacky',
            email: 'Yesman666@gmail.com',
            password:
                '$2b$12$C2UPcZtP3hq5B5SaB.iZlOW.u4AqD11M6X5beWTKl169BVdWxu6Pm',
            weeklyGoal: 5,
        },
        'findOne'
    )
    const result = await functions.loginCheck('Yes@gmail.com', '12345')
    expect(result).toBe(404)
})

test('Testing addUser with new user', async () => {
    mockingoose(User).toReturn(null, 'findOne')
    mockingoose(User).toReturn(
        {
            username: 'Jacky',
            email: 'Yesman666@gmail.com',
            weeklyGoal: 5,
        },
        'save'
    )
    const result = await functions.addUser({
        username: 'Jacky',
        email: 'Yesman666@gmail.com',
        password: '123456789',
        weeklyGoal: 5,
    })

    expect(result.username).toBe('Jacky')
    expect(result.email).toBe('Yesman666@gmail.com')
    expect(result.username).not.toBe('123456789')
})

test('Testing addUser with duplicate username', async () => {
    mockingoose(User).toReturn({ username: 'Jacky' }, 'findOne')
    const result = await functions.addUser({
        username: 'Jacky',
        email: 'Yesman666@gmail.com',
        password: '123456789',
        weeklyGoal: 5,
    })

    expect(result).toBe(409)
})

test('Testing addUser with duplicate emails', async () => {
    mockingoose(User).toReturn({ email: 'Yesman666@gmail.com' }, 'findOne')
    const result = await functions.addUser({
        username: 'Jacky',
        email: 'Yesman666@gmail.com',
        password: '123456789',
        weeklyGoal: 5,
    })

    expect(result).toBe(409)
})

//Testing getUsers functions
test('Testing getUsers with undefined username and email', async () => {
    mockingoose(User).toReturn([], 'find')
    const result = await functions.getUsers(undefined, undefined)

    expect(result).toEqual([])
})

test('Testing getUsers with both username and email', async () => {
    mockingoose(User).toReturn(
        { username: 'Jacky', email: 'Yesman666@gmail.com' },
        'findOne'
    )
    const result = await functions.getUsers('Jacky', 'Yesman666@gmail.com')

    expect(result.username).toBe('Jacky')
    expect(result.email).toBe('Yesman666@gmail.com')
})

test('Testing getUsers with username', async () => {
    mockingoose(User).toReturn({ username: 'Jacky' }, 'findOne')
    const result = await functions.getUsers('Jacky', undefined)

    expect(result.username).toBe('Jacky')
})

test('Testing getUsers with email', async () => {
    mockingoose(User).toReturn({ email: 'Yesman666@gmail.com' }, 'findOne')
    const result = await functions.getUsers(undefined, 'Yesman666@gmail.com')

    expect(result.email).toBe('Yesman666@gmail.com')
})

//Testing find username and email functions
test('Testing findUserByUsernameAndEmail', async () => {
    mockingoose(User).toReturn(
        {
            username: 'Jacky',
            email: 'Jacky123@gmail.com',
            password: 'hashed',
            weeklyGoal: 5,
        },
        'findOne'
    )
    const result = await functions.findUserByUsernameAndEmail(
        'Jacky',
        'Jacky123@gmail.com'
    )
    expect(result.username).toBe('Jacky')
    expect(result.email).toBe('Jacky123@gmail.com')
})

test('Testing findUserByUsername', async () => {
    mockingoose(User).toReturn(
        {
            username: 'Jacky',
            email: 'Jacky123@gmail.com',
            password: 'hashed',
            weeklyGoal: 5,
        },
        'findOne'
    )
    const result = await functions.findUserByUsername('Jacky')
    expect(result.username).toBe('Jacky')
})

test('Testing findUserByEmail', async () => {
    mockingoose(User).toReturn(
        {
            username: 'Jacky',
            email: 'Jacky123@gmail.com',
            password: 'hashed',
            weeklyGoal: 5,
        },
        'findOne'
    )
    const result = await functions.findUserByEmail('Jacky123@gmail.com')
    expect(result.email).toBe('Jacky123@gmail.com')
})

//Testing addWorkout
test('Testing addWorkout with valid workout', async () => {
    const userId = '68fa1b2c3d4e5f6789012345'
    mockingoose(User).toReturn(
        {
            _id: userId,
            username: 'testUser',
            email: 'test@example.com',
            password: 'hashedPassword',
        },
        'findOne'
    )
    mockingoose(workout).toReturn(
        {
            _id: userId,
            name: 'Leg Day',
            category: 'Strength',
            date: '2026-10-27',
            durationMin: 30,
            exercises: [],
        },
        'save'
    )
    const result = await functions.addWorkout(userId, {
        name: 'Leg Day',
        category: 'Strength',
        date: '2026-10-27',
        durationMin: 30,
        exercises: [],
    })
    expect(result).not.toBeNull()
    expect(result.name).toBe('Leg Day')
})

//Testing findWorkout
test('Testing findWorkout returns workout', async () => {
    const userId = '68fa1b2c3d4e5f6789012345'
    const mockWorkouts = [
        {
            _id: '68fa1b2c3d4e5f6789012346',
            userId,
            name: 'Test Strength Workout',
            category: 'Strength',
            date: '2026-10-27',
            time: '10:10',
            durationMin: 30,
            completed: true,
            exercises: [{ name: 'Squat', sets: 3, reps: 8, weight: 100 }],
        },
    ]
    mockingoose(workout).toReturn(mockWorkouts, 'find')
    const result = await functions.findWorkout(userId)
    expect(result[0]).toMatchObject({
        name: 'Test Strength Workout',
        category: 'Strength',
        durationMin: 30,
        completed: true,
    })
    expect(result[0].exercises[0].weight).toBe(100)
})
