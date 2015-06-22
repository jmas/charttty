(function(window) {

  // vars

  var $ = window.jQuery;
  var pageName = location.hash.substring(1);
  var giot = {};
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

  // execute

  giot.accessToken = window.localStorage.accessToken;
  window['giot'] = giot;

  $.ajaxSetup({
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-Access-Token', giot.accessToken);        
    }
  });

  initPage();
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

})(this);