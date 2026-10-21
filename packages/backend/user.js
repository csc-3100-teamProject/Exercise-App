import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        weeklyGoal: {
            type: Number,
            default: 5,
            min: 1,
            max: 7,
        },
    },
    { collection: 'users_list' }
)

const User = mongoose.model('User', UserSchema)

export default User
