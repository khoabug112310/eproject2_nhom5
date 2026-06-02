// Utility to standardize API responses
function success(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message = 'Error', status = 500, details = null) {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}

module.exports = { success, fail };
