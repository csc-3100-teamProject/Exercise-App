import mongoose from 'mongoose'
import userModel from './user.js'
import workoutModel from './workout.js'
import { buildOverview } from './overview.js'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
dotenv.config()
import jwt from 'jsonwebtoken'
mongoose.set('debug', true)

// Tests connect to their own in-memory database instead.
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGO_URI)
}
function getUsers(username, email) {
    let promise
    if (username === undefined && email === undefined) {
        promise = userModel.find()
    } else if (username && email) {
        promise = findUserByUsernameAndEmail(username, email)
    } else if (username && !email) {
        promise = findUserByUsername(username)
    } else if (email && !username) {
        promise = findUserByEmail(email)
    }
    return promise
}

async function registerUser(user) {
    const finduser = await findUserByUsername(user.username)
    const findemail = await findUserByEmail(user.email)

    if (finduser || findemail) {
        return null
    }
    const hashedPassword = await bcrypt.hash(user.password, 12)

    const newUser = await new userModel({
        username: user.username,
        email: user.email,
        password: hashedPassword,
    }).save()

    return {
        user: newUser,
        token: generateAccessToken(newUser),
    }
}

function generateAccessToken(user) {
    return jwt.sign(
        { id: user._id.toString(), username: user.username },
        process.env.TOKEN_SECRET,
        { expiresIn: '1d' }
    )
}

function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
        return res.status(401).send('Authentication token required')
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send('Invalid or expired token')
        }

        req.user = decoded
        next()
    })
}

async function resetPassword(email, password) {
    const hashed = await bcrypt.hash(password, 12)

    return userModel.findOneAndUpdate(
        { email: email.trim() },
        { password: hashed },
        { new: true }
    )
}

async function addUser(user) {
    const finduser = await findUserByUsername(user.username)
    const findemail = await findUserByEmail(user.email)
    if (!finduser && !findemail) {
        const hashed = await bcrypt.hash(user.password, 12)
        const userToAdd = new userModel({
            username: user.username,
            email: user.email,
            password: hashed,
        })
        return userToAdd.save()
    }
    return 409
}

async function loginCheck(email, password) {
    const user = await findUserByEmail(email)
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return 404
    }

    return {
        user,
        token: generateAccessToken(user),
    }
}

async function getOverview(id, today) {
    const user = await findUserById(id)
    if (!user) return null
    const workouts = await workoutModel.find({ userId: id }).lean()
    return buildOverview({ user, workouts, today })
}

async function addWorkout(userId, workout) {
    const user = await findUserById(userId)
    if (!user) return null
    const { name, category, date, time, durationMin, exercises, completed } =
        workout
    return new workoutModel({
        userId,
        name,
        category,
        date,
        time,
        durationMin,
        exercises,
        completed: completed ?? false,
    }).save()
}

function updateWorkout(userId, workoutId, workout) {
    const allowedFields = [
        'name',
        'category',
        'date',
        'time',
        'durationMin',
        'exercises',
        'completed',
    ]

    const updates = Object.fromEntries(
        Object.entries(workout).filter(([key]) => allowedFields.includes(key))
    )

    return workoutModel.findOneAndUpdate(
        { _id: workoutId, userId },
        { $set: updates },
        { new: true, runValidators: true }
    )
}

function deleteWorkout(userId, workoutId) {
    return workoutModel.findOneAndDelete({
        _id: workoutId,
        userId,
    })
}

function findUserById(id) {
    return userModel.findById(id)
}

function findUserByUsername(username) {
    return userModel.findOne({ username: username })
}

function findUserByUsernameAndEmail(username, email) {
    return userModel.findOne({ username: username, email: email })
}

function findUserByEmail(email) {
    return userModel.findOne({ email: email })
}

function findIdAndDestroy(id) {
    return userModel.findByIdAndDelete(id)
}

function findWorkout(userId) {
    return workoutModel.find({ userId: userId })
}

async function getProfile(id) {
    const user = await userModel.findById(id).select('username email')
    return user
}

async function updateProfile(id, updates) {
    return userModel
        .findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        )
        .select('username email')
}

export default {
    getUsers,
    registerUser,
    authenticateUser,
    resetPassword,
    addUser,
    findUserById,
    findUserByUsername,
    findUserByUsernameAndEmail,
    findUserByEmail,
    findIdAndDestroy,
    loginCheck,
    getOverview,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    findWorkout,
    getProfile,
    updateProfile,
}
