// server/src/routes/shipping.js
const express = require('express');
const { body, query, validationResult } = require('express-validator');

const router = express.Router();

// Lazy-load ESM service from CJS router
async function svc() {
  const mod = await import('../shipping/shipping.service.js');
  return mod;
}

router.post(
  '/rates',
  body('shipFrom').exists().withMessage('shipFrom is required'),
  body('shipTo').exists().withMessage('shipTo is required'),
  body('parcels').isArray({ min: 1 }).withMessage('parcels must be a non-empty array'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { getRates } = await svc();
      const { quotes, shipmentId } = await getRates(req.body);
      res.json({ quotes, shipmentId });
    } catch (err) { next(err); }
  }
);

router.post(
  '/label',
  body('shipmentId').isString().withMessage('shipmentId is required'),
  body('rateId').isString().withMessage('rateId is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { createLabel } = await svc();
      const label = await createLabel(req.body);
      res.json(label);
    } catch (err) {
      // Surface EasyPost error info to the client
      const status = err.status || err.statusCode || 500;
      res.status(status).json({
        error: true,
        message: err.message || 'Failed to buy label',
        code: err.code || undefined,
        details: err.details || undefined,
      });
    }
  }
);

router.get(
  '/track',
  query('trackingNumber').isString().withMessage('trackingNumber is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { track } = await svc();
      const info = await track({ trackingNumber: req.query.trackingNumber });
      res.json(info);
    } catch (err) { next(err); }
  }
);

module.exports = router;
