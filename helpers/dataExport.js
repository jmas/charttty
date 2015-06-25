var XlsxExport = require('xlsx-export');

module.exports = {
  asExcel: function(bufferStream, fields) {
    var fieldsMap = {}, headers = [];

    fields.sort(function(a, b) {
      if (a < b) {
        return -1;
      }
      if (a === 'date' || (a > b)) {
        return 1;
      }
      return 0;
    });

    fields.map(function(item) {
      if (item === 'date') {
        fieldsMap[item] = 'date';
      } else {
        fieldsMap[item] = 'number';
      }
      headers.push({ width: 25, caption: item });
    });

    console.log(fieldsMap);

    var options = {
      map: fieldsMap,
      headers: headers,
      stream: bufferStream
    };

    return new XlsxExport(options);
  },
  asCsv: function(keys) {
    // @todo
  }
};
