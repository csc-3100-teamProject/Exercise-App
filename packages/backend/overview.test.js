import functions from './overview.js'
import { addDays, weekStart } from './overview.js'
import { beforeEach, expect, test, jest } from '@jest/globals'

test('Testing toUTC', () => {
    const result = functions.toUtc('2026-11-2')
    expect(result).toBe(1793577600000)
})

test('Testing toDateStr', () => {
    const result = functions.toDateStr('2026')
    expect(result).toBe('2026-01-01')
})

test('Testing addDays', () => {
    const result = addDays('2026-11-2', 1)
    expect(result).toBe('2026-11-03')
})

test('Testing weekStart', () => {
    const result = weekStart('2026-11-6')
    expect(result).toBe('2026-11-02')
})

test('Testing streaks', () => {
    //const result = functions.streaks(5, 7, 20)
    //expect(result).toBe('2026-11-02')
})
