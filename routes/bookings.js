const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const { requireAuth } = require('../middleware/auth');

router.post('/book', requireAuth, async (req, res) => {
  try {
    const { busId, seats, dateOfTravel } = req.body;
    if (!busId || !seats || !seats.length || !dateOfTravel)
      return res.status(400).json({ error: 'busId, seats, and dateOfTravel required' });

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    // find already booked seats for this date
    const existingBookings = await Booking.find({ busId, dateOfTravel });
    const bookedSeats = existingBookings.flatMap(b => b.seats);

    // check if requested seats are available
    const unavailable = seats.filter(n => bookedSeats.includes(Number(n)));
    if (unavailable.length)
      return res.status(400).json({ error: 'Some seats already booked', unavailable });

    // create new booking
    const totalPrice = seats.length * bus.price;
    const booking = new Booking({
      userId: req.session.userId,
      busId,
      seats: seats.map(Number),
      totalPrice,
      dateOfTravel
    });
    await booking.save();

    res.json({ message: 'Booking successful', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bookedSeats', async (req, res) => {
  try {
    const { busId, date } = req.query;
    if (!busId || !date)
      return res.status(400).json({ error: 'busId and date required' });

    const existingBookings = await Booking.find({ busId, dateOfTravel: date });
    const bookedSeats = existingBookings.flatMap(b => b.seats);
    res.json(bookedSeats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// user's bookings
router.get('/user/mybookings', requireAuth, async (req, res) => {
  const bookings = await Booking.find({ userId: req.session.userId }).populate('busId');
  res.json(bookings);
});

// Cancel a booking
router.delete('/cancel/:bookingId', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Make sure the booking belongs to the logged-in user
    if (booking.userId.toString() !== req.session.userId)
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });

    // Free the seats in the Bus document
    const bus = await Bus.findById(booking.busId);
    if (bus) {
      for (let n of booking.seats) {
        const seat = bus.seats.find(s => s.number === n);
        if (seat) {
          seat.booked = false;
          seat.bookedBy = null;
        }
      }
      await bus.save();
    }

    // Delete or mark as cancelled
    await booking.deleteOne();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
