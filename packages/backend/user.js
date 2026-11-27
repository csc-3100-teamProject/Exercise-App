import mongoose from 'mongoose'

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
export const UNITS = ['Imperial', 'Metric']
export const EQUIPMENT = [
    'Full gym',
    'Home gym',
    'Dumbbells only',
    'Bodyweight only',
]

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
        // Profile page details. username stays the unique handle; fullName is
        // the display name shown in the app.
        fullName: { type: String, trim: true, maxlength: 60 },
        level: { type: String, enum: LEVELS, default: 'Beginner' },
        units: { type: String, enum: UNITS, default: 'Imperial' },
        equipment: { type: String, enum: EQUIPMENT, default: 'Full gym' },
        bio: { type: String, trim: true, maxlength: 200, default: '' },
    },
    {
        collection: 'users_list',
        toJSON: {
            // Never send the password hash to clients.
            transform: (doc, ret) => {
                delete ret.password
                return ret
            },
        },
    }
)

const User = mongoose.model('User', UserSchema)

export default User
