const express = require('express');
const Thread = require('../models/thread');
const router = express.Router();

// スレッド作成
router.post('/', async (req, res) => {
  const { title, content, coordinates } = req.body; // contentを追加
  if (!title || !content || !coordinates || typeof coordinates.lng !== 'number' || typeof coordinates.lat !== 'number') {
    return res.status(400).send({ error: 'Invalid title, content, or coordinates format' });
  }
  const thread = new Thread({ title, content, coordinates });
  try {
    await thread.save();
    res.status(201).send(thread);
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).send({ error: 'Failed to create thread', details: error.message });
  }
});

// スレッド取得
router.get('/', async (req, res) => {
  try {
    const threads = await Thread.find().populate('responses');
    res.send(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).send({ error: 'Failed to fetch threads' });
  }
});

// スレッド削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const thread = await Thread.findByIdAndDelete(id);
    if (!thread) {
      return res.status(404).send({ error: 'Thread not found' });
    }
    res.status(200).send({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).send({ error: 'Failed to delete thread', details: error.message });
  }
});

module.exports = router;