const mongoose = require('mongoose');

class ClientIdGenerator {
  constructor(model) {
    this.Client = model;
  }

  /**
   * Generates a new client ID in format: BB-YYYY-NNNN
   * @param {number} barangay - The barangay code
   * @returns {string} Generated client ID
   */
  async generateNewClientId(barangay) {
    const barangayCode = barangay.toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    const prefix = `${barangayCode}-${currentYear}-`;

    const lastClient = await this.Client.findOne(
      { clientId: new RegExp(`^${prefix}`) },
      { clientId: 1 }
    )
    .sort({ clientId: -1 })
    .lean();

    let nextSequence = 1;
    
    if (lastClient?.clientId) {
      const lastSequence = parseInt(lastClient.clientId.split('-')[2], 10);
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }
    return `${prefix}${nextSequence.toString().padStart(4, '0')}`;
  }

  /**
   * Gets the next available client ID without creating a document
   * @param {number} barangay - The barangay code
   * @returns {Promise<string>} Next available client ID
   */
  async getNextClientId(barangay) {
    if (!barangay && barangay !== 0) {
      throw new Error('Barangay is required');
    }
    return this.generateNewClientId(barangay);
  }

  /**
   * Generates multiple sequential client IDs
   * @param {number} barangay - The barangay code
   * @param {number} count - Number of IDs to generate
   * @returns {Promise<string[]>} Array of client IDs
   */
  async getNextClientIds(barangay, count) {
    if (!barangay && barangay !== 0) {
      throw new Error('Barangay is required');
    }
    if (count <= 0) {
      throw new Error('Count must be positive');
    }
    const baseId = await this.generateNewClientId(barangay);
    const baseNum = parseInt(baseId.split('-')[2], 10);
    
    return Array.from({ length: count }, (_, i) => 
      baseId.replace(/\d+$/, (baseNum + i).toString().padStart(4, '0'))
    );
  }
}
module.exports = ClientIdGenerator;