const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  number: Number,
  booked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { _id: false });

const busSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  busName: String,
  from: String,
  to: String,
  departureTime: String,
  price: Number,
  totalSeats: Number,
  seats: [seatSchema],
  operatingDays: [String]
});

module.exports = mongoose.model('Bus', busSchema);
