(function(window) {

  // vars

  var $ = window.jQuery;
  var document = window.document;
  var emailEl = document.getElementById('profile-email');
  var apikeyEl = document.getElementById('profile-apikey');
  var formEl = document.getElementById('profile-form');
  var messageEl = document.getElementById('profile-message');
  var chpwdEl = document.getElementById('profile-chpwd');
  var userPwdModalEl = document.getElementById('user-pwd-modal');
  var userPwdFormEl = document.getElementById('user-pwd-form');
  var userPwdMessageEl = document.getElementById('user-pwd-message');
  var userPwdCurrentEl = document.getElementById('user-pwd-current');
  var userPwdNewEl = document.getElementById('user-pwd-new');
  var userPwdNewRetypeEl = document.getElementById('user-pwd-retype');
  var userPwdSubmitEl = document.getElementById('user-pwd-submit');
  var updateApiKeyEl = document.getElementById('profile-update-apikey');
  var dataurlEl = document.getElementById('profile-dataurl');

  // functions

  function loadProfile() {
    return $.get('/user');
  }

  function populateProfile(data) {
    var serviceUrl = window.location.protocol + '//' + window.location.host + '/d/' + data.apiKey + '?fieldName=value&field2Name=value2';
    $(emailEl).val(data.email);
    $(apikeyEl).val(data.apiKey);
    $(dataurlEl).val(serviceUrl);
  }

  function showMessage(message, type) {
    type = type || 'info';
    $(messageEl).removeClass().addClass('alert alert-'+type).html(message).show();
  }

  function hideMessage() {
    $(messageEl).hide();
  }

  function showPwdMessage(message, type) {
    type = type || 'info';
    $(userPwdMessageEl).removeClass().addClass('alert alert-'+type).html(message).show();
  }

  function hidePwdMessage() {
    $(userPwdMessageEl).hide();
  }

  function saveProfile() {
    var email = $(emailEl);
    if (! email) {
      showMessage('Email address is required.', 'danger');
      return {then: function() {}};
    }
    var data = {
      email: email.val()
    };
    return $.post('/user', data).then(function(item) {
      if (item.error) {
        showMessage(item.error, 'danger');
        return {then: function() {}};
      }
      showMessage('Successfully saved.', 'success');
      $.publish('userUpdated', [item]);
    });
  }

  function showChangePwd() {
    $(userPwdModalEl).modal('show');
    hidePwdMessage();
    $(userPwdCurrentEl).val('');
    $(userPwdNewEl).val('');
    $(userPwdNewRetypeEl).val('');
  }

  function saveChangePwd() {
    hidePwdMessage();
    var pwdCurrent = $(userPwdCurrentEl).val();
    var pwdNew = $(userPwdNewEl).val();
    var pwdNewRetype = $(userPwdNewRetypeEl).val();
    if (! pwdCurrent || ! pwdNew || ! pwdNewRetype) {
      showPwdMessage('Current Password, New Password, New Password Retype are required.', 'danger');
      return {then: function() {}};
    }
    if (pwdNew !== pwdNewRetype) {
      showPwdMessage('New Password Retype is invalid.', 'danger');
      return {then: function() {}};
    }
    if (pwdNew.length < 4) {
      showPwdMessage('New Password length should be more than 4 chars.', 'danger');
      return {then: function() {}};
    }
    return $.post('/user/password', {
      passwordCurrent: pwdCurrent,
      passwordNew: pwdNew,
      passwordNewRetype: pwdNewRetype
    }).then(function(user) {
      if ('error' in user) {
        showPwdMessage(user.error, 'danger');
        return {then: function() {}};
      }
      $(userPwdModalEl).modal('hide');
      return user;
    });
  }

  function updateApiKey() {
    return $.post('/user/apiKey').then(function(user) {
      $.publish('userUpdated', [user]);
      return user;
    });
  }

  // handlers

  $(formEl).on('submit', function() {
    saveProfile();
    return false;
  });

  $(chpwdEl).on('click', function() {
    showChangePwd();
    return false;
  });

  $(updateApiKeyEl).on('click', function() {
    if (! confirm('Are you sure?')) {
      return false;
    }
    updateApiKey().then(function(user) {
      populateProfile(user);
    });
    return false;
  });

  $(userPwdFormEl).on('submit', function() {
    saveChangePwd().then(function(user) {
      populateProfile(user);
    });
    return false;
  });

  $(userPwdSubmitEl).on('click', function() {
    $(userPwdFormEl).submit();
    return false;
  });

  $.subscribe('pageChanged', function(event, name) {
    if (name !== 'profile') {
      return;
    }
    hideMessage();
    loadProfile().then(populateProfile);
  });

})(this);