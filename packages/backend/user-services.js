import mongoose from 'mongoose'
import userModel, { LEVELS, UNITS, EQUIPMENT } from './user.js'
import workoutModel from './workout.js'
import friendshipModel from './friendship.js'
import { buildOverview } from './overview.js'
import { buildProfile, displayName } from './profile.js'
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

const sameId = (a, b) => String(a) === String(b)

async function getFriendIds(id) {
    const links = await friendshipModel
        .find({
            status: 'accepted',
            $or: [{ requester: id }, { recipient: id }],
        })
        .lean()
    return links.map((l) =>
        sameId(l.requester, id) ? l.recipient : l.requester
    )
}

async function getProfile(id, today) {
    const user = await findUserById(id)
    if (!user) return null
    const friendIds = await getFriendIds(id)
    const ids = [user._id, ...friendIds]
    const [workouts, people] = await Promise.all([
        workoutModel.find({ userId: { $in: ids }, completed: true }).lean(),
        userModel.find({ _id: { $in: ids } }, 'username fullName').lean(),
    ])
    const names = Object.fromEntries(
        people.map((p) => [String(p._id), displayName(p)])
    )
    return buildProfile({
        user,
        ownWorkouts: workouts.filter(
            (w) => String(w.userId) === String(user._id)
        ),
        feedWorkouts: workouts,
        names,
        friendsCount: friendIds.length,
        today,
    })
}

// Returns the updated user, null if missing, or 409 if the username/email is
// already taken. Invalid values throw a Mongoose ValidationError.
async function updateProfile(id, updates) {
    const user = await findUserById(id)
    if (!user) return null
    for (const field of ['username', 'email']) {
        const value = updates[field]
        if (value !== undefined && value.trim() !== user[field]) {
            const taken = await userModel.findOne({
                [field]: value.trim(),
                _id: { $ne: user._id },
            })
            if (taken) return 409
        }
    }
    user.set(updates)
    return user.save()
}

function publicPerson(user) {
    return {
        id: user._id,
        name: displayName(user),
        username: user.username,
        level: user.level,
    }
}

// Friends (with workout counts) plus incoming requests waiting for a reply.
async function getFriends(id) {
    const user = await findUserById(id)
    if (!user) return null
    const friendIds = await getFriendIds(id)
    const incoming = await friendshipModel
        .find({ recipient: id, status: 'pending' })
        .sort({ createdAt: -1 })
        .lean()
    const people = await userModel
        .find(
            {
                _id: {
                    $in: [...friendIds, ...incoming.map((r) => r.requester)],
                },
            },
            'username fullName level'
        )
        .lean()
    const byId = Object.fromEntries(people.map((p) => [String(p._id), p]))
    const friends = await Promise.all(
        friendIds
            .filter((fid) => byId[String(fid)])
            .map(async (fid) => ({
                ...publicPerson(byId[String(fid)]),
                workouts: await workoutModel.countDocuments({
                    userId: fid,
                    completed: true,
                }),
            }))
    )
    friends.sort((a, b) => a.name.localeCompare(b.name))
    const requests = incoming
        .filter((r) => byId[String(r.requester)])
        .map((r) => ({
            requestId: r._id,
            ...publicPerson(byId[String(r.requester)]),
        }))
    return { friends, requests }
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Other users matching the search text, with how each relates to this user.
async function searchPeople(id, query = '') {
    const me = await findUserById(id)
    if (!me) return null
    const filter = { _id: { $ne: me._id } }
    const text = query.trim()
    if (text) {
        const pattern = new RegExp(escapeRegex(text), 'i')
        filter.$or = [{ username: pattern }, { fullName: pattern }]
    }
    const people = await userModel
        .find(filter, 'username fullName level')
        .limit(25)
        .lean()
    const ids = [me._id, ...people.map((p) => p._id)]
    const links = await friendshipModel
        .find({
            $or: [{ requester: { $in: ids } }, { recipient: { $in: ids } }],
        })
        .lean()

    const friendsOf = (uid) =>
        new Set(
            links
                .filter(
                    (l) =>
                        l.status === 'accepted' &&
                        (sameId(l.requester, uid) || sameId(l.recipient, uid))
                )
                .map((l) =>
                    String(sameId(l.requester, uid) ? l.recipient : l.requester)
                )
        )
    const myFriends = friendsOf(me._id)

    const result = people.map((person) => {
        const link = links.find(
            (l) =>
                (sameId(l.requester, me._id) &&
                    sameId(l.recipient, person._id)) ||
                (sameId(l.recipient, me._id) && sameId(l.requester, person._id))
        )
        let status = 'none'
        if (link?.status === 'accepted') status = 'friend'
        else if (link)
            status = sameId(link.requester, me._id) ? 'sent' : 'received'
        const theirs = friendsOf(person._id)
        return {
            ...publicPerson(person),
            status,
            mutualFriends: [...theirs].filter((f) => myFriends.has(f)).length,
        }
    })
    const rank = { friend: 0, received: 1, sent: 2, none: 3 }
    return result.sort(
        (a, b) =>
            rank[a.status] - rank[b.status] || a.name.localeCompare(b.name)
    )
}

// Returns { status: 'sent' | 'accepted' }, null if either user is missing,
// 400 for yourself, or 409 if a request or friendship already exists.
async function sendFriendRequest(id, targetId) {
    if (sameId(id, targetId)) return 400
    const [me, target] = await Promise.all([
        findUserById(id),
        findUserById(targetId),
    ])
    if (!me || !target) return null
    const existing = await friendshipModel.findOne({
        $or: [
            { requester: id, recipient: targetId },
            { requester: targetId, recipient: id },
        ],
    })
    if (existing) {
        // They already asked us: adding them back makes you friends.
        if (existing.status === 'pending' && sameId(existing.recipient, id)) {
            existing.status = 'accepted'
            await existing.save()
            return { status: 'accepted' }
        }
        return 409
    }
    await friendshipModel.create({ requester: id, recipient: targetId })
    return { status: 'sent' }
}

// Accepts or declines a request sent to this user. Returns null if there is
// no such pending request for them.
async function answerFriendRequest(id, requestId, accept) {
    const request = await friendshipModel.findOne({
        _id: requestId,
        recipient: id,
        status: 'pending',
    })
    if (!request) return null
    if (accept) {
        request.status = 'accepted'
        await request.save()
    } else {
        await request.deleteOne()
    }
    return true
}

async function removeFriend(id, friendId) {
    const result = await friendshipModel.deleteOne({
        status: 'accepted',
        $or: [
            { requester: id, recipient: friendId },
            { requester: friendId, recipient: id },
        ],
    })
    return result.deletedCount > 0 ? true : null
}

export default {
    getUsers,
    registerUser,
    authenticateUser,
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
    getFriends,
    searchPeople,
    sendFriendRequest,
    answerFriendRequest,
    removeFriend,
    PROFILE_OPTIONS: { LEVELS, UNITS, EQUIPMENT },
}
