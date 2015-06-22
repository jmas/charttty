var db = require('../db');

module.exports = function(req, res, next) {
  var accessToken = req.get('X-Access-Token');
  if (! accessToken) {
    return next(new Error("ERROR_TOKEN_REQUIRED"));
  }
  db.collection('user').findOne({ accessToken: accessToken }).then(function(user) {
    if (! user) {
      return next(new Error("ERROR_TOKEN_NOT_VALID"));
    }
    req.user = user;
    next();
  }).catch(next);
};