import mongoose from 'mongoose'

// One document per pair of users. The requester sent the request; once the
// recipient accepts it, status becomes 'accepted' and both are friends.
const FriendshipSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted'],
            default: 'pending',
        },
    },
    { collection: 'friendships_list', timestamps: true }
)

FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true })

const Friendship = mongoose.model('Friendship', FriendshipSchema)

export default Friendship
