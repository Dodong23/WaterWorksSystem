const { v4: uuidv4 } = require('uuid');

const config = {
  prefix: 'CL',
  separator: '-',
  digits: 5,
  maxRetries: 3,
  fallbackStrategy: 'uuid'
};

module.exports = {
  generateVerifiedId: async (Model) => {  // Changed parameter name to Model
    let attempts = 0;
    
    // First try: Sequential ID
    while (attempts < config.maxRetries) {
      const candidate = generateSequentialCandidate();
      if (!(await Model.exists({ clientId: candidate }))) {  // Use Model.exists
        return candidate;
      }
      attempts++;
    }

    // Fallback strategies
    if (config.fallbackStrategy === 'uuid') {
      const uuidCandidate = `${config.prefix}${config.separator}${uuidv4()}`;
      if (!(await Model.exists({ clientId: uuidCandidate }))) {
        return uuidCandidate;
      }
    }

    // Final fallback
    return generateTimestampId();
  },

  configure: (newConfig) => Object.assign(config, newConfig)
};

function generateSequentialCandidate() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('');
  const randomSequence = Math.floor(Math.random() * 90000) + 10000;
  return `${config.prefix}${config.separator}${datePart}${config.separator}${randomSequence}`;
}

function generateTimestampId() {
  return `${config.prefix}${config.separator}${Date.now()}${config.separator}${Math.floor(Math.random() * 1000)}`;
}