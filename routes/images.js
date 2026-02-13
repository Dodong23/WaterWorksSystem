// routes/images.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const upload = multer({ dest: 'uploads/' });

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete image
router.delete('/delete/:public_id', async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.public_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;