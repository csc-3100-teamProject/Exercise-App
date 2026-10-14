import mongoose from 'mongoose'
import userModel from './user.js'
import dotenv from 'dotenv'
import bcrypt, { hash } from 'bcrypt'
dotenv.config()

mongoose.set('debug', true)

mongoose.connect(process.env.MONGO_URI)
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

function findUserById(id) {
    return userModel.findById(id)
}

async function addUser(user) {
    const finduser = await findUserByUsername(user.username)
    const findemail = await findUserByEmail(user.email)
    if (!finduser && !findemail) {
        const hashed = await bcrypt.hash(user.password, 12)
        user.password = hashed
        const userToAdd = new userModel(user)
        const promise = userToAdd.save()
        return promise
    }
    return 409
}

async function loginCheck(email, password) {
    const findEmail = await findUserByEmail(email)
    if (findEmail) {
        const passwordCheck = await bcrypt.compare(password, findEmail.password)
        if (passwordCheck) return 200
    }
    return 404
}

function authentication(email, password) {
    return userModel.find({ email: email, password: password })
}

function findUserByUsername(username) {
    return userModel.findOne({ username: username })
}

function findUserByUsernameAndEmail(username, email) {
    return userModel.find({ username: username, email: email })
}

function findUserByEmail(email) {
    return userModel.findOne({ email: email })
}

function findUserPassword(password) {
    return userModel.findOne({ password: password })
}

function findIdAndDestroy(id) {
    return userModel.findByIdAndDelete(id)
}

export default {
    addUser,
    getUsers,
    findUserById,
    findUserByUsername,
    findUserByUsernameAndEmail,
    findUserByEmail,
    findUserPassword,
    findIdAndDestroy,
    loginCheck,
    authentication,
}
