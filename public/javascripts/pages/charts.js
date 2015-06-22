(function(window) {

  // vars

  var $ = window.jQuery;
  var document = window.document;
  var dataFields = [];
  var charts = [];
  var data = [];
  var chartListEl = document.getElementById('dashboard-chart-list');
  var fieldsEl = document.getElementById('chart-edit-modal-fields');
  var addChartEl = document.getElementById('dashboard-add-chart');
  var saveChartEl = document.getElementById('chart-edit-save');
  var chartTplEl = document.getElementById('chart-item-tpl');
  var editFormEl = document.getElementById('chart-edit-form');
  var editIdEl = document.getElementById('chart-edit-id');
  var editMessageEl = document.getElementById('chart-edit-message');
  var editFieldsEl = document.getElementById('chart-edit-modal-fields');
  var editFieldsMessageEl = document.getElementById('chart-edit-modal-fields-message');
  var editModalEl = document.getElementById('chart-edit-modal');
  var editNameEl = document.getElementById('chart-edit-name');
  var editTitleEl = document.getElementById('chart-edit-modal-title');
  var editRemoveEl = document.getElementById('chart-edit-remove');

  var chartList = new DataList(
    chartListEl,
    [],
    chartTplEl.innerHTML,
    function(el, data) {
      var nameEl = el.querySelector('[data-name]');
      var chartEl = el.querySelector('[data-chart]');
      nameEl.innerHTML = data.name;
      el.setAttribute('data-id', data._id);
      if ('fields' in data && chartEl) {
        var chartId = 'chart' + Math.ceil((Math.random() * 1000000) + Date.now());
        charts.push({
          chart: Highcharts.StockChart({
            rangeSelector: {
              inputEnabled: false,
              selected: 5
            },
            title: {
              enabled: false
            },
            legend: {
              enabled: true
            },
            yAxis: {
              gridLineColor: '#f2f2f2'
            },
            xAxis: {
                // minRange: 3600 * 1000
            },
            plotOptions: {
              series: {
                marker: {
                  enabled: true,
                  radius: 3
                },
                animation: {
                    duration: 2000
                }
              }
            },
            navigator: {
              adaptToUpdatedData: true
            },
            series: [],
            chart: {
              renderTo: chartEl
            }
          }),
          record: data
        });
      } else {
        console.error('Wrong chart data', data);
      }
    },
    function() {
      charts = [];
    },
    function() {
      reflowCharts();
    }
  );

  var fieldsList = new DataList(
    fieldsEl,
    [],
    '<div class="checkbox">\
      <label>\
        <input type="checkbox" name="fields[]" data-checkbox /> <span data-label></span>\
      </label>\
    </div>',
    function(el, data) {
      var labelEl = el.querySelector('[data-label]');
      var checkboxEl = el.querySelector('[data-checkbox]');
      if (labelEl) {
        labelEl.innerHTML = data;
      }
      if (checkboxEl) {
        checkboxEl.value = data;
      }
    }
  );

  // functions

  function saveChart() {
    hideEditMessage();
    var data = {};
    var id = $(editIdEl).val();
    if (id) {
      data.id = id;
    }
    data.name = $(editNameEl).val();
    data.fields = [];
    $(editFieldsEl).find('input[type="checkbox"]:checked').each(function() {
      data.fields.push($(this).val());
    });
    if (! data.name || data.fields.length === 0) {
      showEditMessage('Fields Name and Data fields are required.', 'danger');
      return {then: function() {}};
    }
    $(editModalEl).modal('hide');
    if (id) {
      return $.post('/chart/' + id, data).then(function() {
        loadCharts();
      });
    } else {
      return $.post('/chart', data).then(function(item) {
        loadCharts();
      });
    }
  }

  function editChart(chartId) {
    hideEditMessage();
    if (dataFields.length === 0) {
      $(editFieldsMessageEl).show();
      $(editFieldsMessageEl).html('You need to send data first for initialize fields. <a href="https://github.com/jmas/charttty/wiki">How to do this</a>');
    } else {
      $(editFieldsMessageEl).hide();
    }
    $(editIdEl).val(chartId ? chartId: '');
    $(editNameEl).val('');
    $(editFieldsEl).find('input[type="checkbox"]').removeAttr('checked');
    if (chartId) {
      $(editRemoveEl).show();
      editTitleEl.innerHTML = 'Edit Chart';
      $.get('/chart/'+chartId).then(function(item) {
        $(editNameEl).val(item.name);
        for (var i=0,ln=item.fields.length; i<ln; i++) {
          $(editFieldsEl).find('input[value="'+item.fields[i]+'"]')[0].checked = true;
        }
      });
    } else {
      $(editRemoveEl).hide();
      editTitleEl.innerHTML = 'Add Chart';
    }
    $(editModalEl).modal('show');
  }

  function hideEditChart() {
    $(editModalEl).modal('hide');
  }

  function loadCharts() {
    return $.get('/chart').then(function(items) {
      chartList.update(items);
      insertChartsData(data);
      return items;
    });
  }

  function insertChartsData(items) {
    charts.map(function(chart) {
      var lastTime = 0;
      chart.record.fields.map(function(field) {
        var useSeries = null;
        for (var i=0,ln=chart.chart.series.length; i<ln; i++) {
          if (chart.chart.series[i].name === field) {
            useSeries = chart.chart.series[i];
            break;
          }
        }
        if (! useSeries) {
          useSeries = chart.chart.addSeries({
            name: field,
            data: []
          });
        }
        items.map(function(item) {
          if (field in item) {
            var v = parseFloat(item[field]);
            useSeries.addPoint([item.date, isNaN(v) ? 0: v], false);
          }
          lastTime = item.date;
        });
      });
      chart.chart.redraw();
      // chart.chart.xAxis[0].setExtremes();
    });
  }

  function reflowCharts() {
    charts.map(function(item) {
      item.chart.reflow();
    });
  }

  function showEditMessage(message, type) {
    type = type || 'info';
    $(editMessageEl).removeClass().addClass('alert alert-'+type).html(message).show();
  }

  function hideEditMessage() {
    $(editMessageEl).hide();
  }

  function removeChart(id) {
    return $.ajax({
      url: '/chart/'+id,
      type: 'DELETE'
    });
  }

  // handlers

  $(addChartEl).on('click', function() {
    editChart();
    return false;
  });

  $(saveChartEl).on('click', function() {
    saveChart();
    return false;
  });

  $(chartListEl).on('click', '[data-edit]', function() {
    editChart($(this).parents('[data-chart]').attr('data-id'));
    return false;
  });

  $(editFormEl).on('submit', function() {
    saveChart();
    return false;
  });

  $(editRemoveEl).on('click', function() {
    if (! confirm('Are you sure?')) {
      return false;
    }
    var id = $(editIdEl).val();
    if (! id) {
      return false;
    }
    removeChart(id).then(function() {
      hideEditChart();
      loadCharts();
    });
    return false;  
  });

  $.subscribe('dataFieldsUpdated', function(event, items) {
    dataFields = items;
    items = items.filter(function(item) {
      return item !== 'date';
    });
    fieldsList.update(items);
  });

  $.subscribe('dataUpdated', function(event, items) {
    data = items.concat(data);
    setTimeout(function() {
      insertChartsData(items);
    }, 1);
  });

  $.subscribe('pageChanged', function(event, name) {
    if (name !== 'charts') {
      return;
    }
    reflowCharts();
  });

  $.subscribe('userUpdated', function() {
    loadCharts();
  });

})(this);