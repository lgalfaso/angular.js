var isFunction = function isFunction(value){return typeof value == 'function';}
var isObject = function isObject(value){return value != null && typeof value === 'object';}
function bind(self, fn) {
  var curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
  if (isFunction(fn) && !(fn instanceof RegExp)) {
    return curryArgs.length
      ? function() {
          return arguments.length
            ? fn.apply(self, curryArgs.concat(slice.call(arguments, 0)))
            : fn.apply(self, curryArgs);
        }
      : function() {
          return arguments.length
            ? fn.apply(self, arguments)
            : fn.call(self);
        };
  } else {
    // in IE, native methods are not functions so they cannot be bound (note: they don't need to be)
    return fn;
  }
}


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
