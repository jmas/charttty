(function(window) {

  var $ = window.jQuery;

  var i18n = {
    lang: null,
    dict: {},
    loadDict: function(lang) {
      return $.get('/i18n/' + lang + '.json').then(function(dict) {
        i18n.dict = dict;
      });
    },
    t: function(phrase) {
      if (phrase in this.dict) {
        return this.dict[phrase];
      }
      return phrase;
    }
  };

  window['i18n'] = i18n;
})(window);