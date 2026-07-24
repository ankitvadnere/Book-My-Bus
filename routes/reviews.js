const express = require('express');
const multer = require('multer');
const path = require('path');
const Review = require('../models/Review');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname,'../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// post review with images (form-data, field name 'images')
router.post('/:busId', requireAuth, upload.array('images', 5), async (req, res) => {
  try {
    const { rating, text } = req.body;
    const images = (req.files || []).map(f => '/uploads/' + path.basename(f.path));
    const review = new Review({
      userId: req.session.userId,
      busId: req.params.busId,
      rating: Number(rating || 0),
      text,
      images
    });
    await review.save();
    res.json({ message: 'Review saved', review });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// get reviews for a bus
router.get('/bus/:busId', async (req, res) => {
  const reviews = await Review.find({ busId: req.params.busId }).populate('userId','name');
  res.json(reviews);
});

// delete review
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // only allow owner to delete
    if (review.userId.toString() !== req.session.userId)
      return res.status(403).json({ error: 'Unauthorized to delete this review' });

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
