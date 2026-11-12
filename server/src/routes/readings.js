const express = require('express');
const requireAuth = require('../middleware/auth');
const service = require('../services/readingsService');
const { HttpError, asyncHandler } = require('../utils/errors');

const router = express.Router();
router.use(requireAuth); // every readings route is private

const parseId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new HttpError('Reading not found.', 404);
  return id;
};

router.get('/', asyncHandler(async (req, res) => {
  const readings = await service.listReadings(req.user.id, { date: req.query.date });
  res.json({ readings });
}));

router.post('/', asyncHandler(async (req, res) => {
  const reading = await service.createReading(req.user.id, req.body);
  res.status(201).json({ reading });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const reading = await service.updateReading(req.user.id, parseId(req.params.id), req.body);
  res.json({ reading });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.deleteReading(req.user.id, parseId(req.params.id));
  res.status(204).end();
}));

module.exports = router;