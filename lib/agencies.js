'use strict';

/**
 * Official list of participating distribution agencies (sorted A->Z, Vietnamese order).
 * Single source of truth for backend. index.html <option> list must match (see scripts/test-agencies.js).
 */
const AGENCIES = [
  'AKA PROPERTY',
  'AN KHANG HOMES',
  'ANPHAHOUSE',
  'AVI REALTY',
  'AZHOMES',
  'BAM LAND',
  'CBC',
  'CBRE',
  'CHÂU ĐẠI DƯƠNG',
  'DIAMOND LINKS',
  'ĐẤT XANH',
  'ĐÔNG TÂY LAND',
  'ELINK',
  'EMG',
  'EMPIRE REALTY',
  'ERA',
  'GAMUDA LAND SALES',
  'GEMS LAND',
  'GLOBAL HOLDING',
  'GLOBAL HOMES',
  'GPT LAND',
  'HOMEDAY',
  'INDOCHINE',
  'IQI',
  'KHẢI MINH LAND',
  'KZEN',
  'LIÊN GIA LAND',
  'LT LUXURY',
  'MAINLAND',
  'MEGA REALTY',
  'NEWSTARHOMES',
  'NOVAZON',
  'PEGASUS',
  'PITALAND',
  'PQR',
  'RED GROUP',
  'REDCA',
  'REVER',
  'SALEREAL',
  'SAVILLS',
  'SGI',
  'SGROUP',
  'SI PROPERTY',
  'SMARTLAND',
  'T&A',
  'TICA GROUP',
  'TNP HOLDINGS',
  'UNITY LAND',
  'VIET NAM PROPERTY',
  'VIỆT NAM LAND',
];

const fold = (s) => String(s || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .replace(/\s+/g, ' ').trim().toUpperCase();
const INDEX = new Map(AGENCIES.map((a) => [fold(a), a]));

/** Case/accent-insensitive match -> canonical name. No match -> empty string. */
function normalizeAgency(raw) {
  const clean = String(raw || '').replace(/\s+/g, ' ').trim();
  return INDEX.get(fold(clean)) || '';
}

module.exports = { AGENCIES, normalizeAgency };
