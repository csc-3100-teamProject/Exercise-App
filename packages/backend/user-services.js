import mongoose from 'mongoose'
import userModel from './user.js'
import dotenv from 'dotenv'
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

function addUser(user) {
    const userToAdd = new userModel(user)
    const promise = userToAdd.save()
    return promise
}

function authentication(email, password) {
    return userModel.find({ email: email, password: password })
}

function findUserByUsername(name) {
    return userModel.find({ name: name })
}

function findUserByUsernameAndEmail(name, email) {
    return userModel.find({ name: name, email: email })
}

function findUserByEmail(email) {
    return userModel.find({ email: email })
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
    findIdAndDestroy,
    authentication,
}
