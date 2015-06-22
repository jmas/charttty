var db = require('../db');

module.exports = function(req, res, next) {
  var apiKey = req.get('X-APIKey');
  if (! apiKey && 'apiKey' in req.params) {
    apiKey = req.params.apiKey;
  }
  if (! apiKey) {
    return next(new Error("ERROR_API_KEY_REQUIRED"));
  }
  db.collection('user').findOne({ apiKey: apiKey }).then(function(user) {
    if (! user) {
      return next(new Error("ERROR_API_KEY_NOT_VALID"));
    }
    req.user = user;
    next();
  }).catch(next);
};