// server/src/shipping/easypost.js
import EasyPostApi from '@easypost/api';
import env from '../config/env.js';

// lazy init so missing key doesn't crash import time
let api;
function getApi() {
  if (!api) {
    if (!env.EASYPOST_API_KEY) {
      throw new Error('EASYPOST_API_KEY is not set. Add it to your .env and restart the server.');
    }
    api = new EasyPostApi(env.EASYPOST_API_KEY);
  }
  return api;
}

/** helpers */
function toEPAddress(a) {
  return {
    name: a.name,
    phone: a.phone || undefined,
    street1: a.address1,
    street2: a.address2 || undefined,
    city: a.city,
    state: a.state,
    zip: a.postalCode,
    country: a.country || 'US',
    verify: ['delivery'],
  };
}

function toEPParcel(p) {
  const isLb = (p.unit || 'LB').toUpperCase() === 'LB';
  const isIn = (p.dimUnit || 'IN').toUpperCase() === 'IN';
  const weightLb = isLb ? Number(p.weight) : Number(p.weight) * 2.20462262;
  return {
    weight: Math.max(0.1, weightLb) * 16, // ounces
    length: isIn ? Number(p.length) : Number(p.length) / 2.54,
    width:  isIn ? Number(p.width)  : Number(p.width)  / 2.54,
    height: isIn ? Number(p.height) : Number(p.height) / 2.54,
  };
}

export async function getRates({ shipFrom, shipTo, parcels }) {
  const to     = await getApi().Address.create(toEPAddress(shipTo));
  const from   = await getApi().Address.create(toEPAddress(shipFrom));
  const parcel = await getApi().Parcel.create(toEPParcel(parcels[0]));

  const shipment = await getApi().Shipment.create({
    to_address: to,
    from_address: from,
    parcel,
  });

  const quotes = (shipment.rates || []).map(r => ({
    id: r.id,
    carrier: (r.carrier || '').toLowerCase(),
    service: r.service,
    serviceName: `${r.carrier} ${r.service}`,
    total: Number(r.rate),
    currency: r.currency || 'USD',
    deliveryDays: r.delivery_days ?? null,
    deliveryDate: r.delivery_date ?? null,
    shipmentId: shipment.id,
  })).sort((a, b) => a.total - b.total);

  return { quotes, shipmentId: shipment.id };
}

export async function buyLabel({ shipmentId, rateId }) {
  if (!shipmentId || !rateId) {
    const e = new Error('shipmentId and rateId are required');
    e.status = 400;
    throw e;
  }

  try {
    // Static buy form avoids edge-cases with stale in-memory rates
    const purchased = await getApi().Shipment.buy(shipmentId, rateId);
    return {
      carrier: purchased.selected_rate?.carrier?.toLowerCase() || 'unknown',
      service: purchased.selected_rate?.service,
      trackingNumber: purchased.tracking_code,
      labelUrl: purchased.postage_label?.label_url,
      labelPdfUrl: purchased.postage_label?.label_pdf_url,
      shipmentId: purchased.id,
      rateId,
    };
  } catch (err) {
    const out = new Error(err?.message || 'Failed to buy label');
    out.status = err?.statusCode || 502;
    out.code = err?.code;
    out.details = err?.errors || undefined;
    throw out;
  }
}

export async function track({ trackingNumber }) {
  let tracker = null;
  try {
    const list = await getApi().Tracker.all({ tracking_code: trackingNumber, page_size: 1 });
    tracker = list?.trackers?.[0] || null;
  } catch { tracker = null; }
  if (!tracker) return { carrier: '', trackingNumber, status: 'Unknown', checkpoints: [], estDeliveryDate: null };
  return {
    carrier: (tracker.carrier || '').toLowerCase(),
    trackingNumber: tracker.tracking_code,
    status: tracker.status || 'Unknown',
    checkpoints: (tracker.tracking_details || []).map(c => ({
      datetime: c.datetime,
      status: c.message,
      location: [c.tracking_location?.city, c.tracking_location?.state].filter(Boolean).join(', '),
    })),
  };
}
