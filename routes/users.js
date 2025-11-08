const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Exercise = require('../models/Exercise');

// Create new user
router.post('/', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({
        username: existingUser.username,
        _id: existingUser._id
      });
    }

    const newUser = new User({ username });
    await newUser.save();
    
    res.json({
      username: newUser.username,
      _id: newUser._id
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add exercise
router.post('/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    // Validate required fields
    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    // Find user
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create exercise
    const exercise = new Exercise({
      userId: _id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });

    await exercise.save();

    // Return user object with exercise fields
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get exercise log
router.get('/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    // Find user
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build query
    let query = { userId: _id };
    
    // Date range filter
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    // Get exercises with optional limit
    let exercisesQuery = Exercise.find(query).select('description duration date -_id');
    
    if (limit) {
      exercisesQuery = exercisesQuery.limit(parseInt(limit));
    }

    const exercises = await exercisesQuery;

    // Format response
    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log: log
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;