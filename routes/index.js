var express = require('express');
var router = express.Router();
var db = require('../db');
var tokenMiddleware = require('../middleware/accessToken');
var apiKeyMiddleware = require('../middleware/apiKey');
var validator = require('validator');
var crypto = require('crypto');

function dataHandler(req, res, next) {
  var params = req.query;
  var validParams = {}, validKey, validParam;
  for (var k in params) {
    validKey = k.replace(/[^a-zA-Z0-9]/, '');
    validParam = parseFloat(params[k].replace(/[^0-9\.]/, ''));
    validParam = isNaN(validParam) ? 0: validParam;
    if (validKey !== '' && validParam !== '') {
      validParams[validKey] = validParam;
    }
  }
  if (Object.keys(validParams).length === 0) {
    return next(new Error('ERROR_QUERY_EMPTY'));
  }
  validParams.date = new Date();
  validParams.userId = String(req.user._id);
  db.collection('data').insert(validParams).then(function() {
    res.set('Content-Type', 'text/plain');
    res.send('OK');
  }).catch(next);
}

router.post('/login', function(req, res, next) {
  if (! req.body.email) {
    return res.json({
      error: 'Email address is required.'
    });
  }
  if (! validator.isEmail(req.body.email)) {
    return res.json({
      error: 'Email address is not valid.'
    });
  }
  if (! req.body.password) {
    return res.json({
      error: 'Password is required.'
    });
  }
  db.collection('user').findOne({ email: req.body.email }).then(function(user) {
    if (! user) {
      return res.json({
        error: 'User is not found.'
      });
    }
    var passwordSum = crypto.createHash('sha1');
    var accessTokenSum = crypto.createHash('sha1');
    passwordSum.update(req.body.password);
    var password = passwordSum.digest('hex');
    if (user.password !== password) {
      return res.json({
        error: 'Password is not valid.'
      });
    }
    accessTokenSum.update(String(Math.random() + new Date().getTime()));
    user.accessToken = String(accessTokenSum.digest('hex'));
    return db.collection('user').update({ _id: db.ObjectId(user._id) }, user).then(function() {
      return db.collection('user').findOne({ _id: db.ObjectId(user._id) });
    });
  }).then(function(user) {
    delete user.password;
    res.json(user);
  }).catch(next);
});

router.post('/register', function(req, res, next) {
  if (! req.body.email) {
    return res.json({
      error: 'Email address is required.'
    });
  }
  if (! req.body.password) {
    return res.json({
      error: 'Password is required.'
    });
  }
  if (! validator.isEmail(req.body.email)) {
    return res.json({
      error: 'Email address is not valid.'
    });
  }
  db.collection('user').findOne({ email: req.body.email }).then(function(user) {
    if (user) {
      return res.json({
        error: 'User is already registered.'
      });
    }
    var user = {
      email: req.body.email
    };
    var passwordSum = crypto.createHash('sha1');
    var accessTokenSum = crypto.createHash('sha1');
    var apiKeySum = crypto.createHash('sha1');
    passwordSum.update(req.body.password);
    accessTokenSum.update(String(Math.random() + new Date().getTime()));
    apiKeySum.update(String(Math.random() + new Date().getTime()));
    user.password = passwordSum.digest('hex');
    user.accessToken = String(accessTokenSum.digest('hex'));
    user.apiKey = String(apiKeySum.digest('hex'));
    return db.collection('user').insert(user);
  }).then(function(user) {
    delete user.password;
    res.json(user);
  }).catch(next);
});

router.get('/user', tokenMiddleware, function(req, res, next) {
  var user = req.user;
  delete user.password;
  res.json(user);
});

router.post('/user', tokenMiddleware, function(req, res, next) {
  var user = req.user;
  if (! req.body.email) {
    return res.json({
      error: 'Email address is required.'
    });
  }
  if (! validator.isEmail(req.body.email)) {
    return res.json({
      error: 'Email address is not valid.'
    });
  }
  user.email = req.body.email;
  db.collection('user').update({ _id: db.ObjectId(user._id) }, user).then(function() {
    res.json(user);
  }).catch(next);
});

router.post('/user/password', tokenMiddleware, function(req, res, next) {
  var user = req.user;
  var body = req.body;
  if (! req.body.passwordCurrent || ! req.body.passwordNew || ! req.body.passwordNewRetype) {
    return res.json({
      error: 'Current Password, New Password, New Password Retype are required.'
    });
  }
  var shasum = crypto.createHash('sha1');
  shasum.update(req.body.passwordCurrent);
  var passwordCurrent = shasum.digest('hex');
  if (passwordCurrent !== user.password) {
    return res.json({
      error: 'Current Password is invalid.'
    });
  }
  if (req.body.passwordNew < 4) {
      return res.json({
        error: 'New Password length should be more than 4 chars.'
      });
    }
  if (req.body.passwordNew !== req.body.passwordNewRetype) {
    return res.json({
      error: 'New Password Retype is invalid.'
    });
  }
  var shasum = crypto.createHash('sha1');
  shasum.update(req.body.passwordNew);
  user.password = shasum.digest('hex');
  db.collection('user').update({ _id: db.ObjectId(user._id) }, user).then(function() {
    delete user.password;
    res.json(user);
  }).catch(next);
});

router.post('/user/apiKey', tokenMiddleware, function(req, res, next) {
  var user = req.user;
  var apiKeySum = crypto.createHash('sha1');
  apiKeySum.update(String(Math.random() + new Date().getTime()));
  user.apiKey = String(apiKeySum.digest('hex'));
  db.collection('user').update({ _id: db.ObjectId(user._id) }, user).then(function() {
    delete user.password;
    res.json(user);
  }).catch(next);
});

router.post('/data', apiKeyMiddleware, dataHandler);
router.get('/d/:apiKey', apiKeyMiddleware, dataHandler);

router.get('/data/:last?', tokenMiddleware, function(req, res, next) {
  var query = { userId: String(req.user._id) };
  var last = parseInt(req.params.last);
  if (last > 0) {
    var date = new Date(last);
    query.date = { $gt: date };
  }
  db.collection('data').find(query).limit(100).sort({ date: -1 }).toArray().then(function(items) {
    if (! items) {
      return next(new Error('ERROR_DATA_ITEMS_NULL'));
    }
    items.map(function(item) {
      // delete item._id;
      delete item.userId;
      item.dateUnixtime = item.date.getTime();
      item.date = Date.UTC(item.date.getFullYear(), item.date.getMonth(), item.date.getDate(), item.date.getHours(), item.date.getMinutes(), item.date.getSeconds());
      return item;
    });
    res.json(items);
  }).catch(next);
});

router.delete('/data/:id', tokenMiddleware, function(req, res, next) {
  db.collection('data').remove({ _id: db.ObjectId(req.params.id), userId: String(req.user._id) }, { justOne: true }).then(function(item) {
    res.json({ success: true });
  }).catch(next);
});

router.get('/dataFields', tokenMiddleware, function(req, res, next) {
  db.collection('data').find({ userId: String(req.user._id) }).limit(100).sort({ date: -1 }).toArray().then(function(items) {
    var keys = [];
    for (var i=0,ln=items.length; i<ln; i++) {
      for (var k in items[i]) {
        if (['_id', 'userId'].indexOf(k) != -1) {
          continue;
        }
        if (keys.indexOf(k) === -1) {
          keys.push(k);
        }
      }
    }
    res.json(keys);
  }).catch(next);
});

router.get('/chart', tokenMiddleware, function(req, res, next) {
  db.collection('chart').find({ userId: String(req.user._id) }).toArray().then(function(items) {
    res.json(items);
  }).catch(next);
});

router.get('/chart/:id', tokenMiddleware, function(req, res, next) {
  db.collection('chart').findOne({ _id: db.ObjectId(req.params.id), userId: String(req.user._id) }).then(function(item) {
    res.json(item);
  }).catch(next);
});

router.delete('/chart/:id', tokenMiddleware, function(req, res, next) {
  db.collection('chart').remove({ _id: db.ObjectId(req.params.id), userId: String(req.user._id) }, { justOne: true }).then(function(item) {
    res.json({ success: true });
  }).catch(next);
});

router.post('/chart', tokenMiddleware, function(req, res, next) {
  if (! req.body.name) {
    return res.json({
      error: 'Name is required.'
    });
  }
  if (! req.body['fields[]'] || req.body['fields[]'].length === 0) {
    return res.json({
      error: 'Data fields are required.'
    });
  }
  db.collection('chart').insert({
    name: req.body.name,
    fields: req.body['fields[]'] instanceof Array ? req.body['fields[]']: [req.body['fields[]']],
    userId: String(req.user._id),
    createAt: new Date()
  }).then(function(item) {
    res.json(item);
  }).catch(next);
});

router.post('/chart/:id', tokenMiddleware, function(req, res, next) {
  var id = req.params.id;
  var chart;
  db.collection('chart').findOne({
    _id: db.ObjectId(id),
    userId: String(req.user._id)
  }).then(function(item) {
    if (! item) {
      return res.json({
        error: 'Chart id not valid.'
      });
    }
    chart = item;
    item.name = req.body.name;
    item.fields = req.body['fields[]'] instanceof Array ? req.body['fields[]']: [req.body['fields[]']];
    return db.collection('chart').update({ _id: db.ObjectId(id), userId: String(req.user._id) }, item);
  }).then(function() {
    return res.json(chart);
  }).catch(next);
});

module.exports = router;