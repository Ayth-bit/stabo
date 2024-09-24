const express = require('express');
const Thread = require('../models/thread');
const Response = require('../models/response');
const router = express.Router();

// レスポンス作成
router.post('/:threadId', async (req, res) => {
  const { threadId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).send({ error: 'Text is required' });
  }

  try {
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).send({ error: 'Thread not found' });
    }

    const response = new Response({ thread: threadId, text });
    await response.save();

    thread.responses.push(response._id);
    await thread.save();

    res.status(201).send(response);
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).send({ error: 'Failed to create response', details: error.message });
  }
});

// レスポンス取得
router.get('/:threadId', async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findById(threadId).populate('responses');
    if (!thread) {
      return res.status(404).send({ error: 'Thread not found' });
    }
    res.send(thread.responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).send({ error: 'Failed to fetch responses' });
  }
});

module.exports = router;