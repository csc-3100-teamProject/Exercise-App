import User from './user.js'
import mockingoose from 'mockingoose'
import functions from './user-services.js'
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
    expect(result.password).toBe(
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
