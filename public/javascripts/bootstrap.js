(function(window) {

  // vars

  var $ = window.jQuery;
  var pageName = location.hash.substring(1);
  var giot = { config: {} };
  var navbarEl = document.getElementById('navbar');
  var navbarUserEl = document.getElementById('nav-user');
  var navLogoutEl = document.getElementById('nav-logout');
  var navUserEl = document.getElementById('nav-user');
  var welcomeModalEl = document.getElementById('welcome-modal');
  var welcomeDataurlEl = document.getElementById('welcome-dataurl');
  var welcomeApikeyEl = document.getElementById('welcome-apikey');
  var lastTime = 0;
  var dataTimeout;
  var fieldsTimeout;

  // functions

  function changePage(name) {
    $('[data-page]').hide();
    $('[data-page="'+name+'"]').show();
    $(navbarEl).find('li').removeClass('active');
    $(navbarEl).find('a[href="#'+name+'"]').parents('li').addClass('active');
    window.localStorage.lastPage = name;
    $.publish('pageChanged', name);
  }

  function initPage() {
    $('[data-page]').hide();

    if (pageName) {
      changePage(pageName);
    } else if (window.localStorage.lastPage) {
      changePage(window.localStorage.lastPage);
    } else {
      changePage('charts');
    }

    $('body').on('click', 'a[href^="#"]', function() {
      changePage($(this).attr('href').substring(1));
    });
  }

  function loadUser() {
    return $.get('/user').then(function(item) {
      giot.user = item;
      $.publish('userUpdated', [item]);
    });
  }

  function loadFields() {
    return $.get('/dataFields').then(function(items) {
      items = items.sort(function(a, b) {
        if (a < b) {
          return -1;
        }
        if (a === 'date' || (a > b)) {
          return 1;
        }
        return 0;
      });
      $.publish('dataFieldsUpdated', [items]);
      return items;
    });
  }

  function renewData() {
    clearTimeout(dataTimeout);
    dataTimeout = setTimeout(renewData, 10000);
    return $.get('/data/' + lastTime).then(function(items) {
      if (items.length > 0) {
        lastTime = items[0].dateUnixtime;
        $.publish('dataUpdated', [items]);
      }
    });
  }

  function showWelcome() {
    var serviceUrl = window.location.protocol + '//' + window.location.host + '/d/<b>' + giot.user.apiKey + '</b>?<b>fieldName</b>=<b>value</b>&field2Name=value2';
    $(welcomeModalEl).modal('show');
    $(welcomeDataurlEl).html(serviceUrl);
    $(welcomeApikeyEl).html(giot.user.apiKey);
  }

  function hideWelcome() {
    $(welcomeModalEl).modal('hide');
  }

  function startWaitingForFields() {
    (function repeatFn() {
      clearTimeout(fieldsTimeout);
      loadFields().then(function(items) {
        if (items.length > 0) {
          renewData().then(function() {
            hideWelcome();
            changePage('data');
          });
          clearTimeout(fieldsTimeout);
        }
      });
      fieldsTimeout = setTimeout(repeatFn, 10000);
    })();
  }

  function loadConfig() {
    return $.get('/config.json').then(function(config) {
      giot.config = config;
    });
  }

  function initTracker() {
    if (! ('gaTrackerId' in giot.config)) {
      return;
    }
    try {
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

      ga('create', giot.config.gaTrackerId, 'auto');
      ga('send', 'pageview');
    } catch(e) { /*window.console && window.console.warn(e);*/ }
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
        $.publish('i18nLoaded');
      });
    }
  }

  // execute

  $(navLogoutEl).on('click', function() {
    delete window.localStorage.accessToken;
    window.location.href = '/';
  });

  $('body').on('click', 'a[href^="http://"], a[href^="https://"]', function() {
    window.open($(this).attr('href'));
    return false;
  });

  $.subscribe('userUpdated', function(event, item) {
    $(navUserEl).html(item.email);
  });

  $.subscribe('pageChanged', function(event, name) {
    try {
      ga('send', 'pageview', '/' + name);
    } catch(e) { /* window.console && window.console.warn(e); */ }
  });

  // execute

  giot.accessToken = window.localStorage.accessToken;
  window['giot'] = giot;

  $.ajaxSetup({
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-Access-Token', giot.accessToken);
    }
  });

  initPage();
  initI18n();
  loadConfig().then(function() {
    initTracker();
    loadUser().then(function() {
      loadFields().then(function(items) {
        if (items.length === 0) {
          showWelcome();
          startWaitingForFields();
          return;
        }
        renewData();
      });
    }).fail(function() {
      delete window.localStorage.accessToken;
      window.location.href = '/';
    });
  });

})(this);
