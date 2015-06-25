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
  var giot = {};
  var _ = window.i18n.t.bind(window.i18n);

  // functions

  function login() {
    hideMessage();
    return $.post('/login', { email: $(emailEl).val(), password: $(passwordEl).val() }).then(function(user) {
      if ('error' in user) {
        return showMessage(_(user.error), 'danger');
      }
      window.localStorage.accessToken = user.accessToken;
      window.location.href = '/app.html';
    });
  }

  function register() {
    hideMessage();
    return $.post('/register', { email: $(emailEl).val(), password: $(passwordEl).val() }).then(function(user) {
      if ('error' in user) {
        return showMessage(_(user.error), 'danger');
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

  function initTracker() {
    try {
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

      ga('create', giot.config.gaTrackerId, 'auto');
      ga('send', 'pageview');
    } catch(e) { window.console && window.console.warn(e); }
  }

  function initI18n() {
    var userLang = navigator.language || navigator.userLanguage;
    if (userLang !== 'en') {
      window.i18n.loadDict(userLang).then(function() {
        $('[data-t]').each(function() {
          var phrase = $(this).prop('tagName') === 'INPUT' ? $(this).attr('placeholder'): $(this).html();
          var phraseTrans = i18n.t(phrase);
          if (phrase !== phraseTrans) {
            if ($(this).prop('tagName') === 'INPUT') {
              $(this).attr('placeholder', phraseTrans);
            } else {
              $(this).html(phraseTrans);
            }
          }
        });
      });
    }
  }

  function loadConfig() {
    return $.get('/config.json').then(function(config) {
      giot.config = config;
    });
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
  initI18n();
  loadConfig().then(function() {
    initTracker();
  });

})(this);
