const Client = require('../models/Client');
const ClientIdGenerator = require('../helpers/clientIdGenerator');
const idGenerator = new ClientIdGenerator(Client);

module.exports = {
  async createClient(clientData) {
    const client = new Client(clientData);
    await client.save(); // The pre-save hook will auto-generate the ID
    return client;
  },
  async getNextClientId(barangay) {
    return idGenerator.getNextClientId(barangay);
  },

  async getNextClientIds(barangay, count) {
    return idGenerator.getNextClientIds(barangay, count);
  }
};