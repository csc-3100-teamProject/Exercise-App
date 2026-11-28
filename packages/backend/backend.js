// backend.js
import express from 'express'
import cors from 'cors'
import functions from './user-services.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Welcome to Exercise App Backend')
})

app.get('/users', (req, res) => {
    const username = req.query.name
    functions
        .getUsers(username)
        .then((result) => {
            if (result) res.send(result)
            else res.status(404).send('User not found')
        })
        .catch((error) => {
            res.status(500).send(error.name)
        })
})

app.get('/users/:id', (req, res) => {
    const id = req.params['id'] //or req.params.id
    functions
        .findUserById(id)
        .then((result) => {
            if (result) res.send(result)
            else res.status(404).send('User not found')
        })
        .catch((error) => {
            res.status(500).send(error.name)
        })
})

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== ''
}

app.post('/users', (req, res) => {
    const { username, email, password } = req.body ?? {}
    if (![username, email, password].every(isNonEmptyString)) {
        return res.status(400).send('username, email and password are required')
    }
    functions
        .registerUser({
            username: username.trim(),
            email: email.trim(),
            password,
        })
        .then((result) => {
            if (!result) {
                return res.status(409).send('Username or email already exists')
            }

            res.status(201).json({
                token: result.token,
                id: result.user._id,
                username: result.user.username,
            })
        })
        .catch((error) => {
            res.status(500).send(error.name)
        })
})

app.post('/auth/login', (req, res) => {
    const { email, password } = req.body ?? {}
    if (![email, password].every(isNonEmptyString)) {
        return res.status(400).send('email and password are required')
    }
    functions
        .loginCheck(email.trim(), password)
        .then((result) => {
            if (result === 404) {
                return res.status(401).send('Invalid email or password')
            }

            res.status(200).json({
                token: result.token,
                id: result.user._id,
                username: result.user.username,
            })
        })
        .catch((error) => {
            res.status(500).send(error.name)
        })
})

// The login token must belong to the user in the URL.
function ownerOnly(req, res, next) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send('User not found')
    }
    if (req.user.id !== req.params.id) {
        return res.status(403).send('Forbidden')
    }
    next()
}

app.get(
    '/users/:id/overview',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        const id = req.params.id
        const today = req.query.date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
            return res.status(400).send('date must be YYYY-MM-DD')
        }
        functions
            .getOverview(id, today)
            .then((result) => {
                if (result) res.send(result)
                else res.status(404).send('User not found')
            })
            .catch((error) => {
                res.status(500).send(error.name)
            })
    }
)

app.post(
    '/users/:id/workouts',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        const id = req.params.id
        functions
            .addWorkout(id, req.body)
            .then((result) => {
                if (result) res.status(201).send(result)
                else res.status(404).send('User not found')
            })
            .catch((error) => {
                if (error.name === 'ValidationError') {
                    res.status(400).send(error.message)
                } else {
                    res.status(500).send(error.name)
                }
            })
    }
)
app.get(
    '/users/:id/workouts',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        const id = req.params.id
        functions
            .findWorkout(id)
            .then((workouts) => {
                res.status(200).json(workouts)
            })
            .catch(() => res.status(500).send('Unable to get workout'))
    }
)

app.patch(
    '/users/:id/workouts/:workoutId',
    functions.authenticateUser,
    (req, res) => {
        const { id, workoutId } = req.params
        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(workoutId)
        ) {
            return res.status(404).send('Workout not found')
        }
        if (req.user.id !== id) {
            return res.status(403).send('Forbidden')
        }
        functions
            .updateWorkout(id, workoutId, req.body)
            .then((workout) => {
                if (!workout) {
                    return res.status(404).send('Workout not found')
                }
                res.status(200).json(workout)
            })
            .catch((error) => {
                if (error.name === 'ValidationError') {
                    res.status(400).send(error.message)
                } else {
                    res.status(500).send(error.name)
                }
            })
    }
)

app.delete(
    '/users/:id/workouts/:workoutId',
    functions.authenticateUser,
    (req, res) => {
        const { id, workoutId } = req.params
        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(workoutId)
        ) {
            return res.status(404).send('Workout not found')
        }
        if (req.user.id !== id) {
            return res.status(403).send('Forbidden')
        }
        functions
            .deleteWorkout(id, workoutId)
            .then((workout) => {
                if (!workout) {
                    return res.status(404).send('Workout not found')
                }
                res.status(204).send()
            })
            .catch((error) => {
                res.status(500).send(error.name)
            })
    }
)

app.get(
    '/users/:id/profile',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        const today = req.query.date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
            return res.status(400).send('date must be YYYY-MM-DD')
        }
        functions
            .getProfile(req.params.id, today)
            .then((profile) => {
                if (profile) res.status(200).json(profile)
                else res.status(404).send('User not found')
            })
            .catch((error) => {
                res.status(500).send(error.name)
            })
    }
)

const { LEVELS, UNITS, EQUIPMENT } = functions.PROFILE_OPTIONS
const EDITABLE_TEXT = { fullName: 60, bio: 200 }

// Returns the cleaned updates, or null if any field is invalid.
function cleanProfileUpdates(body) {
    const updates = {}
    for (const [field, max] of Object.entries(EDITABLE_TEXT)) {
        if (body[field] === undefined) continue
        if (typeof body[field] !== 'string' || body[field].length > max) {
            return null
        }
        updates[field] = body[field].trim()
    }
    for (const field of ['username', 'email']) {
        if (body[field] === undefined) continue
        if (!isNonEmptyString(body[field])) return null
        updates[field] = body[field].trim()
    }
    if (updates.email !== undefined && !/^\S+@\S+\.\S+$/.test(updates.email)) {
        return null
    }
    const choices = { level: LEVELS, units: UNITS, equipment: EQUIPMENT }
    for (const [field, allowed] of Object.entries(choices)) {
        if (body[field] === undefined) continue
        if (!allowed.includes(body[field])) return null
        updates[field] = body[field]
    }
    if (body.weeklyGoal !== undefined) {
        const goal = body.weeklyGoal
        if (!Number.isInteger(goal) || goal < 1 || goal > 7) return null
        updates.weeklyGoal = goal
    }
    return updates
}

app.patch(
    '/users/:id/profile',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        const updates = cleanProfileUpdates(req.body ?? {})
        if (!updates) return res.status(400).send('Invalid profile fields')
        functions
            .updateProfile(req.params.id, updates)
            .then((user) => {
                if (user === 409) {
                    res.status(409).send('Username or email already exists')
                } else if (user) {
                    res.status(200).json(user)
                } else {
                    res.status(404).send('User not found')
                }
            })
            .catch((error) => {
                if (error.name === 'ValidationError') {
                    res.status(400).send(error.message)
                } else {
                    res.status(500).send(error.name)
                }
            })
    }
)

const idParam = (value) => mongoose.isValidObjectId(value)

function sendOrNotFound(res, result, notFound = 'Not found') {
    if (result) res.status(200).json(result)
    else res.status(404).send(notFound)
}

app.get(
    '/users/:id/friends',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        functions
            .getFriends(req.params.id)
            .then((result) => sendOrNotFound(res, result, 'User not found'))
            .catch((error) => res.status(500).send(error.name))
    }
)

app.get(
    '/users/:id/people',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        const query = typeof req.query.q === 'string' ? req.query.q : ''
        functions
            .searchPeople(req.params.id, query)
            .then((result) => sendOrNotFound(res, result, 'User not found'))
            .catch((error) => res.status(500).send(error.name))
    }
)

app.post(
    '/users/:id/friends',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        const { userId } = req.body ?? {}
        if (!idParam(userId)) return res.status(400).send('userId is required')
        functions
            .sendFriendRequest(req.params.id, userId)
            .then((result) => {
                if (result === 400) {
                    res.status(400).send('You cannot add yourself')
                } else if (result === 409) {
                    res.status(409).send('Already friends or requested')
                } else if (result) {
                    res.status(201).json(result)
                } else {
                    res.status(404).send('User not found')
                }
            })
            .catch((error) => res.status(500).send(error.name))
    }
)

function answerRoute(accept) {
    return (req, res) => {
        if (!idParam(req.params.requestId)) {
            return res.status(404).send('Request not found')
        }
        functions
            .answerFriendRequest(req.params.id, req.params.requestId, accept)
            .then((result) => {
                if (result) res.status(204).send()
                else res.status(404).send('Request not found')
            })
            .catch((error) => res.status(500).send(error.name))
    }
}

app.post(
    '/users/:id/friend-requests/:requestId/accept',
    functions.authenticateUser,
    ownerOnly,
    answerRoute(true)
)

app.delete(
    '/users/:id/friend-requests/:requestId',
    functions.authenticateUser,
    ownerOnly,
    answerRoute(false)
)

app.delete(
    '/users/:id/friends/:friendId',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        if (!idParam(req.params.friendId)) {
            return res.status(404).send('Friend not found')
        }
        functions
            .removeFriend(req.params.id, req.params.friendId)
            .then((result) => {
                if (result) res.status(204).send()
                else res.status(404).send('Friend not found')
            })
            .catch((error) => res.status(500).send(error.name))
    }
)

app.delete(
    '/users/:id',
    functions.authenticateUser,
    ownerOnly,
    (req, res) => {
        const id = req.params['id']
        functions
            .findIdAndDestroy(id)
            .then((result) => {
                if (result) res.status(204).send()
                else res.status(404).send('User not found.')
            })
            .catch((error) => {
                res.status(500).send(error.name)
            })
    }
)

async function startServer() {
    dotenv.config()

    if (!process.env.MONGO_URI || !process.env.TOKEN_SECRET) {
        throw new Error('Set MONGO_URI and TOKEN_SECRET in packages/backend/.env.')
    }

    const port = Number(process.env.PORT || 8000)
    const host = process.env.HOST || '127.0.0.1'
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('Set PORT to a whole number from 1 to 65535.')
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    } catch {
        throw new Error('Could not connect to MongoDB. Start MongoDB and check MONGO_URI.')
    }

    const server = app.listen(port, host, () => {
        if (server.listening) console.log(`FormFlow API listening on http://${host}:${port}`)
    })
    server.on('error', (error) => {
        console.error(`Could not listen on ${host}:${port}: ${error.code}`)
        process.exitCode = 1
        void mongoose.disconnect()
    })
}

if (process.env.NODE_ENV !== 'test') {
    startServer().catch((error) => {
        console.error(error.message)
        process.exitCode = 1
    })
}

export default app
