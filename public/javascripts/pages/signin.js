(function(window) {

  // vars

  var $ = window.jQuery;
  var document = window.document;
  var formEl = document.getElementById('signin-form');
  var messageEl = document.getElementById('signin-message');
  var emailEl = document.getElementById('signin-email');
  var passwordEl = document.getElementById('signin-password');
  var submitEl = document.getElementById('signin-submit');
  var registerEl = document.getElementById('signin-register');

  // functions

  function login() {
    hideMessage();
    return $.post('/login', { email: $(emailEl).val(), password: $(passwordEl).val() }).then(function(user) {
      if ('error' in user) {
        return showMessage(user.error, 'danger');
      }
      window.localStorage.accessToken = user.accessToken;
      window.location.href = '/app.html';
    });
  }

  function register() {
    hideMessage();
    return $.post('/register', { email: $(emailEl).val(), password: $(passwordEl).val() }).then(function(user) {
      if ('error' in user) {
        return showMessage(user.error, 'danger');
      }
      window.localStorage.accessToken = user.accessToken;
      window.location.href = '/app.html';
    });
  }

  function showMessage(message, type) {
    type = type || 'info';
    $(messageEl).removeClass().addClass('alert alert-'+type).html(message).show();
  }

  function hideMessage() {
    $(messageEl).hide();
  }

  // handlers

  $(formEl).on('submit', function() {
    login();
    return false;
  });

  $(registerEl).on('click', function() {
    register();
    return false;
  });

  // execute

  hideMessage();
  if (window.localStorage.accessToken) {
    window.location.href = '/app.html';
  }

})(this);