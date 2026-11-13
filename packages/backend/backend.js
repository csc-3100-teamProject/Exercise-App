// backend.js
import express from 'express'
import cors from 'cors'
import functions from './user-services.js'
import mongoose from 'mongoose'

const app = express()

app.use(cors())
app.use(express.json())

const port = 8000

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

app.get('/users/:id/overview', (req, res) => {
    const id = req.params['id']
    const today = req.query.date
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).send('User not found')
    }
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
})

app.post('/users/:id/workouts', (req, res) => {
    const id = req.params['id']
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).send('User not found')
    }
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
})
app.get('/users/:id/workouts', (req, res) => {
    const id = req.params['id']
    functions
        .findWorkout(id)
        .then((workouts) => {
            res.status(200).json(workouts)
        })
        .catch(() => res.status(500).send('Unable to get workout'))
})

app.get('/users/:id/profile', (req, res) => {
    const id = req.params.id

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).send('User not found')
    }

    functions
        .getProfile(id)
        .then((user) => {
            if (user) res.status(200).json(user)
            else res.status(404).send('User not found')
        })
        .catch((error) => {
            res.status(500).send(error.name)
        })
})

app.patch('/users/:id/profile', (req, res) => {
    const id = req.params.id
    const { username, email } = req.body ?? {}

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).send('User not found')
    }

    if (!isNonEmptyString(username) || !isNonEmptyString(email)) {
        return res.status(400).send('Username and email are required')
    }

    functions
        .updateProfile(id, {
            username: username.trim(),
            email: email.trim(),
        })
        .then((user) => {
            if (user) res.status(200).json(user)
            else res.status(404).send('User not found')
        })
        .catch((error) => {
            if (error.code === 11000) {
                res.status(409).send('Username or email already exists')
            } else if (error.name === 'ValidationError') {
                res.status(400).send(error.message)
            } else {
                res.status(500).send(error.name)
            }
        })
})

app.delete('/users/:id', (req, res) => {
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
})

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })
}

export default app
