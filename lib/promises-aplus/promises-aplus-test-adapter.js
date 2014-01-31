var isFunction = function isFunction(value){return typeof value == 'function';}
var isObject = function isObject(value){return value != null && typeof value === 'object';}

var $q = qFactory(process.nextTick, function noopExceptionHandler() {});

exports.rejected = $q.reject;
exports.deferred = function () {
  var deferred = $q.defer();

  return {
    promise: deferred.promise,
    resolve: deferred.resolve,
    reject: deferred.reject
  };
};
