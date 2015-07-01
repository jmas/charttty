(function(window) {

  // vars

  var $ = window.jQuery;
  var document = window.document;
  var dataFields = [];
  var events = [];
  var listEl = document.getElementById('events-list');
  var modalEl = document.getElementById('events-edit-modal');
  var addEl = document.getElementById('events-add');
  var fieldEl = document.getElementById('events-field');
  var minvalueEl = document.getElementById('events-minvalue');
  var maxvalueEl = document.getElementById('events-maxvalue');
  var doemailEl = document.getElementById('events-doemail');
  var dourlEl = document.getElementById('events-dourl');
  var urlContainerEl = document.getElementById('events-url-container');
  var urlEl = document.getElementById('events-url');
  var editMessageEl = document.getElementById('events-edit-message');
  var editIdEl = document.getElementById('events-edit-id');
  var saveEl = document.getElementById('events-edit-save');
  var titleEl = document.getElementById('events-edit-title');
  var _ = window.i18n.t.bind(window.i18n);

  var list = new DataList(
    listEl,
    events,
    '<a href="#" class="list-group-item" data-item></a>',
    function(el, data) {
      el.innerHTML = _('When') +  ' ' + _('value of field') + ' '
                  + ' <b>' + data.field + '</b> ' +_('low than')
                  + ' <b>' + data.minValue + '</b> ' +_('or')+ ' '
                  + _('greater than') + ' <b>' + data.maxValue + '</b> '
                  + _('then') + ' '
                  + ('sendEmail' in data && data.sendEmail ? '<b>' + _('Send Email')+'</b>' + ('openUrl' in data && data.openUrl ? ', ': ' '): '')
                  + ('openUrl' in data && data.openUrl ? '<b>'+_('Open URL')+'</b>': '');
      el.setAttribute('data-id', data._id);
    }
  );

  // functions

  function edit(data) {
    hideEditMessage();
    $(modalEl).modal('show');
    $(minvalueEl).val(data.minValue || 0);
    $(maxvalueEl).val(data.maxValue || 0);
    if (data._id) {
      $(titleEl).html(_('Edit Event'));
    } else {
      $(titleEl).html(_('Add Event'));
    }
    if (! data.sendEmail) {
      doemailEl.checked = false;
    } else {
      doemailEl.checked = true;
    }
    if (! data.openUrl) {
      dourlEl.checked = false;
      $(urlContainerEl).addClass('hidden');
    } else {
      dourlEl.checked = true;
      urlEl.value = data.url;
      $(urlContainerEl).removeClass('hidden');
    }

    $(editIdEl).val(data._id || '');

    $(fieldEl).find('option:selected').attr('selected', false);
    $(fieldEl).find('option[value="'+data.field+'"]').attr('selected', 'selected');
  }

  function updateFields() {
    $(fieldEl).find('option').remove();
    for (var i=0,ln=dataFields.length; i<ln; i++) {
      if (dataFields[i] === 'date') { continue; }
      $(fieldEl).append('<option value="'+dataFields[i]+'">'+dataFields[i]+'</option>');
    }
  }

  function loadEvents() {
    return $.get('/events').then(function(items) {
      events = items;
      list.update(items);
    });
  }

  function save() {
    hideEditMessage();
    var id = String($(editIdEl).val());
    var field = $(fieldEl).find('option:selected').val();
    var minValue = $(minvalueEl).val();
    var maxValue = $(maxvalueEl).val();
    var sendEmail = !! $(doemailEl).prop('checked');
    var openUrl = !! $(dourlEl).prop('checked');
    var url = String($(urlEl).val());
    if (! minValue || ! maxValue) {
      showEditMessage(_('Min Value and Max Value are required.'), 'danger');
      return {then: function() {}};
    }
    if (minValue > maxValue || minValue === maxValue) {
      showEditMessage(_('Min Value should be lower than Max Value.'), 'danger');
      return {then: function() {}};
    }
    if (! sendEmail && url.length === 0) {
      showEditMessage(_('You should check one or more notifications method.'), 'danger');
      return {then: function() {}};
    }
    var data = {
      field: field,
      minValue: minValue,
      maxValue: maxValue,
      sendEmail: sendEmail,
      openUrl: openUrl,
      url: url
    };
    if (id.length > 0) {
      return $.post('/events/' + id, data).then(function(item) {
        if ('error' in item) {
          showEditMessage(_(item.error), 'danger');
          return true;
        }
        return loadEvents();
      });
    } else {
      return $.post('/events', data).then(function(item) {
        if ('error' in item) {
          showEditMessage(_(item.error), 'danger');
          return true;
        }
        return loadEvents();
      });
    }
  }

  function showEditMessage(message, type) {
    type = type || 'info';
    $(editMessageEl).removeClass().addClass('alert alert-'+type).html(message).show();
  }

  function hideEditMessage() {
    $(editMessageEl).hide();
  }

  // handlers

  $(addEl).on('click', function() {
    edit({});
    return false;
  });

  $.subscribe('dataFieldsUpdated', function(event, items) {
    dataFields = items;
    updateFields();
  });

  $(dourlEl).on('change', function() {
    if ($(this).prop('checked') === true) {
      $(urlContainerEl).removeClass('hidden');
    } else {
      $(urlContainerEl).addClass('hidden');
    }
  });

  $.subscribe('userUpdated', function() {
    loadEvents();
  });

  $.subscribe('i18nLoaded', function() {
    list.setEmptyTpl('<div class="panel-body"><div class="alert alert-info">'+_('List is empty.')+'</div></div>');
  });

  $(listEl).on('click', '[data-item]', function() {
    var item;
    var id = String($(this).attr('data-id'));
    for (var i=0,ln=events.length; i<ln; i++) {
      if (id === String(events[i]._id)) {
        item = events[i];
        break;
      }
    }
    edit(item);
    return false;
  });

  $(saveEl).on('click', function() {
    save().then(function(hasError) {
      if (hasError === true) { return; }
      $(modalEl).modal('hide');
    });
    return false;
  });

})(this);
