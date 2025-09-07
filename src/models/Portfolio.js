import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    purchasePrice: {
        type: Number,
        required: true,
        min: 0
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
portfolioSchema.index({ userId: 1, symbol: 1 });

export default mongoose.model('Portfolio', portfolioSchema);