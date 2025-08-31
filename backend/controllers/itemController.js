const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');

exports.createLostItem = async (req, res) => {
  const { itemName, description, placeLost, dateLost, imageUrl } = req.body;
  if (!itemName || !description || !placeLost || !dateLost) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }
  try {
    const lostItem = new LostItem({
      itemName,
      description,
      placeLost,
      dateLost,
      imageUrl,
      user: req.user._id
    });
    await lostItem.save();
    res.status(201).json({ message: 'Item reported successfully', data: lostItem });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createFoundItem = async (req, res) => {
  const { itemName, description, placeFound, dateFound, imageUrl } = req.body;
  if (!itemName || !description || !placeFound || !dateFound) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }
  try {
    const foundItem = new FoundItem({
      itemName,
      description,
      placeFound,
      dateFound,
      imageUrl,
      user: req.user._id
    });
    await foundItem.save();
    res.status(201).json({ message: 'Item reported successfully', data: foundItem });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};