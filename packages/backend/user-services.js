import mongoose from 'mongoose'
import userModel from './user.js'
import dotenv from 'dotenv'
dotenv.config()

mongoose.set('debug', true)

mongoose.connect(process.env.MONGO_URI)
function getUsers(username) {
    let promise
    if (username === undefined) {
        promise = userModel.find()
    } else if (username) {
        promise = findUserByUsername(username)
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

function findUserByUsername(name) {
    return userModel.find({ name: name })
}

function findIdAndDestroy(id) {
    return userModel.findByIdAndDelete(id)
}

export default {
    addUser,
    getUsers,
    findUserById,
    findUserByUsername,
    findIdAndDestroy,
}
