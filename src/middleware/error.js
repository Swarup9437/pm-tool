// src/middleware/error.js
function notFound(req, res, next) {
  res.status(404).send('Not Found');
}

function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);
  if (res.headersSent) return next(err);
  res.status(500).send('Something went wrong. ' + (process.env.NODE_ENV === 'development' ? err.message : ''));
}

module.exports = { notFound, errorHandler };
