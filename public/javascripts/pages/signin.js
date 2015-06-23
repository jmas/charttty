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

  function initGa() {
    try {
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

      ga('create', giot.config.gaTrackerId, 'auto');
      ga('send', 'pageview');
    } catch(e) { window.console && window.console.warn(e); }
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
  initGa();

})(this);