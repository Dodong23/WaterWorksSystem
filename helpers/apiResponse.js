// helpers/apiResponse.js
// Simple standardized API response helpers
function success(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function error(res, message = 'Error', status = 500, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
}

module.exports = { success, error };
