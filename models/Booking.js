const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  seats: [Number],
  totalPrice: Number,
  createdAt: { type: Date, default: Date.now },
  dateOfTravel: { type: String, required: true }
});

module.exports = mongoose.model('Booking', bookingSchema);
