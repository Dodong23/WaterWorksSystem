// scripts/backfill-billing-dates.js
// Usage:
//  Dry run (no writes): node scripts/backfill-billing-dates.js --dry-run
//  Apply updates:       node scripts/backfill-billing-dates.js --apply

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wworks';
const dbName = process.env.DB_NAME || (process.env.MONGO_DB || 'wworks');
const COLLECTION = process.env.BILLING_COLLECTION || 'billings';
const BATCH = 500;

const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDry = args.includes('--dry-run') && !isApply;

function safeDate(d) {
  if (!d) return null;
  const t = new Date(d);
  if (!isNaN(t)) return t;
  return null;
}

function parseDateString(val, fieldName) {
  if (!val) return null;
  // Try direct Date parse
  let d = safeDate(val);
  if (d) return d;

  // sortableDate like "2025-10" or "2025-10-01"
  const m = /^\s*(\d{4})-(\d{1,2})(?:-(\d{1,2}))?\s*$/.exec(val);
  if (m) {
    const yyyy = m[1];
    const mm = m[2].padStart(2, '0');
    const dd = m[3] ? m[3].padStart(2, '0') : '01';
    d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    if (!isNaN(d)) return d;
  }

  // US format M/D/YYYY or MM/DD/YYYY
  const us = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(val);
  if (us) {
    const mm = us[1].padStart(2, '0');
    const dd = us[2].padStart(2, '0');
    const yyyy = us[3];
    d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    if (!isNaN(d)) return d;
  }

  // Alternative common format: DD-MM-YYYY or D-M-YYYY
  const alt = /^\s*(\d{1,2})-(\d{1,2})-(\d{4})\s*$/.exec(val);
  if (alt) {
    const dd = alt[1].padStart(2, '0');
    const mm = alt[2].padStart(2, '0');
    const yyyy = alt[3];
    d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    if (!isNaN(d)) return d;
  }

  return null;
}

(async function main() {
  console.log('Connecting to', uri, 'DB:', dbName);
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection(COLLECTION);

    const cursor = col.find({});
    const failures = [];
    let ops = [];
    let processed = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      processed++;
      const updates = {};

      // Parse fields
      const p = parseDateString(doc.sortableDate, 'sortableDate');
      if (p) updates.periodStart = p;
      const pr = parseDateString(doc.prevReadDate, 'prevReadDate');
      if (pr) updates.prevReadAt = pr;
      const r = parseDateString(doc.readDate, 'readDate');
      if (r) updates.readAt = r;
      const d = parseDateString(doc.defaultBillingDate, 'defaultBillingDate');
      if (d) updates.billingDate = d;

      if (Object.keys(updates).length === 0) {
        if (doc.sortableDate || doc.prevReadDate || doc.readDate || doc.defaultBillingDate) {
          failures.push({ _id: doc._id, sortableDate: doc.sortableDate, prevReadDate: doc.prevReadDate, readDate: doc.readDate, defaultBillingDate: doc.defaultBillingDate });
        }
      } else {
        if (isApply) {
          ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: updates } } });
        } else {
          ops.push({ _id: doc._id, updates });
        }
      }

      if (ops.length >= BATCH) {
        if (isApply) {
          const res = await col.bulkWrite(ops, { ordered: false });
          console.log('Applied batch, modifiedCount:', res.modifiedCount);
        } else {
          console.log('Dry-run batch preview (first 5):', ops.slice(0, 5));
        }
        ops = [];
      }
    }

    if (ops.length > 0) {
      if (isApply) {
        const res = await col.bulkWrite(ops, { ordered: false });
        console.log('Applied final batch, modifiedCount:', res.modifiedCount);
      } else if (ops.length > 0) {
        console.log('Dry-run final preview (first 5):', ops.slice(0, 5));
      }
    }

    const reportPath = path.join(process.cwd(), isApply ? 'migration-apply-report.json' : 'migration-dry-run-failures.json');
    fs.writeFileSync(reportPath, JSON.stringify({ processed, failures }, null, 2));
    console.log('Done. Processed:', processed, 'Failures:', failures.length, 'Report:', reportPath);

  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
})();
