// backend.js
import express from 'express'
import cors from 'cors'
import functions from './user-services.js'
import dotenv from 'dotenv'

const app = express()
const port = 8000

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

app.post('/users', (req, res) => {
    const userToAdd = req.body
    functions.addUser(userToAdd).then((result) => {
        if (result !== 409) res.status(200).send()
        else res.status(409).send()
    })
})

app.post('/auth/login', (req, res) => {
    const email = req.body.email
    const password = req.body.password
    functions.loginCheck(email, password).then((result) => {
        if (result !== 404) res.status(200).send()
        else res.status(404).send()
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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
