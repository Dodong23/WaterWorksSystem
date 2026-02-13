const Client = require('../models/Client');

async function getNextClientSequence(barangayCode, count = 1) {
  const currentYear = new Date().getFullYear();
  const prefix = `${barangayCode}-${currentYear}-`;
  
  const latestClient = await Client.findOne(
    { clientId: new RegExp(`^${prefix}`) },
    { clientId: 1 }
  ).sort({ clientId: -1 });

  let lastSequence = 0;
  
  if (latestClient && latestClient.clientId) {
    const parts = latestClient.clientId.split('-');
    if (parts.length === 3) {
      lastSequence = parseInt(parts[2], 10) || 0;
    }
  }
  
  return lastSequence + 1;
}

module.exports = { getNextClientSequence };