var sqlGet = require('./db/get');
sqlGet.all(function(result) {
  console.dir(result);
  sqlGet.disconnect();
}, function(error) {
  console.error(error);
  sqlGet.disconnect();
});
