const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const { requireAuth, requireProvider } = require('../middleware/auth');

// provider adds new bus
router.post('/add', requireProvider, async (req, res) => {
  try {
    const { busName, from, to, departureTime, price, totalSeats, operatingDays } = req.body;
    const seats = [];
    for (let i = 1; i <= Number(totalSeats); i++) seats.push({ number: i, booked: false });
    const bus = new Bus({
      providerId: req.session.userId,
      busName, from, to, departureTime, price: Number(price),
      totalSeats: Number(totalSeats), seats, operatingDays
    });
    await bus.save();
    res.json({ message: 'Bus added', bus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// search
router.post('/search', async (req, res) => {
  try {
    const { from, to, date } = req.body;

    // check that all three values are provided
    if (!from || !to || !date) {
      return res.status(400).json({ error: 'From, To, and Date are required' });
    }

    const weekday = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    const buses = await Bus.find({
      from: { $regex: new RegExp(`^${from}$`, 'i') },  // case-insensitive exact match
      to: { $regex: new RegExp(`^${to}$`, 'i') },
      operatingDays: weekday
    }).select('-seats'); // exclude seat info for search list

    if (!buses.length) {
      return res.status(404).json({ error: 'No buses found for given route and date' });
    }

    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// bus details (including seat map)
router.get('/:id', async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  res.json(bus);
});

// provider's buses
router.get('/provider/mybuses', requireProvider, async (req, res) => {
  const buses = await Bus.find({ providerId: req.session.userId });
  res.json(buses);
});

module.exports = router;
