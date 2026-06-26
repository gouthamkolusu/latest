// server/src/shipping/shipping.service.js
import * as EP from './easypost.js';

// Get quotes from EasyPost and return normalized list + shipmentId
export async function getRates(payload) {
  const { quotes, shipmentId } = await EP.getRates(payload);
  return { quotes, shipmentId };
}

// Buy a label using a chosen EasyPost rate
// Expect: { shipmentId, rateId }
export async function createLabel(payload) {
  return EP.buyLabel(payload);
}

// Track a shipment by tracking number
// Expect: { trackingNumber }
export async function track(payload) {
  return EP.track(payload);
}
