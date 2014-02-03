'use strict';

/**
 * @ngdoc service
 * @name ng.$q
 * @requires $rootScope
 *
 * @description
 * A promise/deferred implementation inspired by [Kris Kowal's Q](https://github.com/kriskowal/q).
 *
 * [The CommonJS Promise proposal](http://wiki.commonjs.org/wiki/Promises) describes a promise as an
 * interface for interacting with an object that represents the result of an action that is
 * performed asynchronously, and may or may not be finished at any given point in time.
 *
 * From the perspective of dealing with error handling, deferred and promise APIs are to
 * asynchronous programming what `try`, `catch` and `throw` keywords are to synchronous programming.
 *
 * <pre>
 *   // for the purpose of this example let's assume that variables `$q`, `scope` and `okToGreet`
 *   // are available in the current lexical scope (they could have been injected or passed in).
 * 
 *   function asyncGreet(name) {
 *     var deferred = $q.defer();
 *
 *     setTimeout(function() {
 *       // since this fn executes async in a future turn of the event loop, we need to wrap
 *       // our code into an $apply call so that the model changes are properly observed.
 *       scope.$apply(function() {
 *         deferred.notify('About to greet ' + name + '.');
 *
 *         if (okToGreet(name)) {
 *           deferred.resolve('Hello, ' + name + '!');
 *         } else {
 *           deferred.reject('Greeting ' + name + ' is not allowed.');
 *         }
 *       });
 *     }, 1000);
 *
 *     return deferred.promise;
 *   }
 *
 *   var promise = asyncGreet('Robin Hood');
 *   promise.then(function(greeting) {
 *     alert('Success: ' + greeting);
 *   }, function(reason) {
 *     alert('Failed: ' + reason);
 *   }, function(update) {
 *     alert('Got notification: ' + update);
 *   });
 * </pre>
 *
 * At first it might not be obvious why this extra complexity is worth the trouble. The payoff
 * comes in the way of guarantees that promise and deferred APIs make, see
 * https://github.com/kriskowal/uncommonjs/blob/master/promises/specification.md.
 *
 * Additionally the promise api allows for composition that is very hard to do with the
 * traditional callback ([CPS](http://en.wikipedia.org/wiki/Continuation-passing_style)) approach.
 * For more on this please see the [Q documentation](https://github.com/kriskowal/q) especially the
 * section on serial or parallel joining of promises.
 *
 *
 * # The Deferred API
 *
 * A new instance of deferred is constructed by calling `$q.defer()`.
 *
 * The purpose of the deferred object is to expose the associated Promise instance as well as APIs
 * that can be used for signaling the successful or unsuccessful completion, as well as the status
 * of the task.
 *
 * **Methods**
 *
 * - `resolve(value)` – resolves the derived promise with the `value`. If the value is a rejection
 *   constructed via `$q.reject`, the promise will be rejected instead.
 * - `reject(reason)` – rejects the derived promise with the `reason`. This is equivalent to
 *   resolving it with a rejection constructed via `$q.reject`.
 * - `notify(value)` - provides updates on the status of the promises execution. This may be called
 *   multiple times before the promise is either resolved or rejected.
 *
 * **Properties**
 *
 * - promise – `{Promise}` – promise object associated with this deferred.
 *
 *
 * # The Promise API
 *
 * A new promise instance is created when a deferred instance is created and can be retrieved by
 * calling `deferred.promise`.
 *
 * The purpose of the promise object is to allow for interested parties to get access to the result
 * of the deferred task when it completes.
 *
 * **Methods**
 *
 * - `then(successCallback, errorCallback, notifyCallback)` – regardless of when the promise was or
 *   will be resolved or rejected, `then` calls one of the success or error callbacks asynchronously
 *   as soon as the result is available. The callbacks are called with a single argument: the result
 *   or rejection reason. Additionally, the notify callback may be called zero or more times to
 *   provide a progress indication, before the promise is resolved or rejected.
 *
 *   This method *returns a new promise* which is resolved or rejected via the return value of the
 *   `successCallback`, `errorCallback`. It also notifies via the return value of the
 *   `notifyCallback` method. The promise can not be resolved or rejected from the notifyCallback
 *   method.
 *
 * - `catch(errorCallback)` – shorthand for `promise.then(null, errorCallback)`
 *
 * - `finally(callback)` – allows you to observe either the fulfillment or rejection of a promise,
 *   but to do so without modifying the final value. This is useful to release resources or do some
 *   clean-up that needs to be done whether the promise was rejected or resolved. See the [full
 *   specification](https://github.com/kriskowal/q/wiki/API-Reference#promisefinallycallback) for
 *   more information.
 *
 *   Because `finally` is a reserved word in JavaScript and reserved keywords are not supported as
 *   property names by ES3, you'll need to invoke the method like `promise['finally'](callback)` to
 *   make your code IE8 compatible.
 *
 * # Chaining promises
 *
 * Because calling the `then` method of a promise returns a new derived promise, it is easily
 * possible to create a chain of promises:
 *
 * <pre>
 *   promiseB = promiseA.then(function(result) {
 *     return result + 1;
 *   });
 *
 *   // promiseB will be resolved immediately after promiseA is resolved and its value
 *   // will be the result of promiseA incremented by 1
 * </pre>
 *
 * It is possible to create chains of any length and since a promise can be resolved with another
 * promise (which will defer its resolution further), it is possible to pause/defer resolution of
 * the promises at any point in the chain. This makes it possible to implement powerful APIs like
 * $http's response interceptors.
 *
 *
 * # Differences between Kris Kowal's Q and $q
 *
 *  There are two main differences:
 *
 * - $q is integrated with the {@link ng.$rootScope.Scope} Scope model observation
 *   mechanism in angular, which means faster propagation of resolution or rejection into your
 *   models and avoiding unnecessary browser repaints, which would result in flickering UI.
 * - Q has many more features than $q, but that comes at a cost of bytes. $q is tiny, but contains
 *   all the important functionality needed for common async tasks.
 *
 *  # Testing
 *
 *  <pre>
 *    it('should simulate promise', inject(function($q, $rootScope) {
 *      var deferred = $q.defer();
 *      var promise = deferred.promise;
 *      var resolvedValue;
 *
 *      promise.then(function(value) { resolvedValue = value; });
 *      expect(resolvedValue).toBeUndefined();
 *
 *      // Simulate resolving of promise
 *      deferred.resolve(123);
 *      // Note that the 'then' function does not get called synchronously.
 *      // This is because we want the promise API to always be async, whether or not
 *      // it got called synchronously or asynchronously.
 *      expect(resolvedValue).toBeUndefined();
 *
 *      // Propagate promise resolution to 'then' functions using $apply().
 *      $rootScope.$apply();
 *      expect(resolvedValue).toEqual(123);
 *    }));
 *  </pre>
 */
function $QProvider() {

  this.$get = ['$rootScope', '$exceptionHandler', function($rootScope, $exceptionHandler) {
    return qFactory(function(callback) {
      $rootScope.$evalAsync(callback);
    }, $exceptionHandler);
  }];
}


/**
 * Constructs a promise manager.
 *
 * @param {function(function)} nextTick Function for executing functions in the next turn.
 * @param {function(...*)} exceptionHandler Function into which unexpected exceptions are passed for
 *     debugging purposes.
 * @returns {object} Promise manager.
 */
function qFactory(nextTick, exceptionHandler) {


  function callOnce(resolveFn, rejectFn) {
    var called = false;
    function wrap(fn) {
      return function(value) {
        if (called) return;
        called = true;
        fn(value);
      };
    }
    
    return [wrap(resolveFn), wrap(rejectFn)];
  }

  function makePromise(value, resolved) {
    var result = defer();
    if (resolved) {
      result.resolve(value);
    } else {
      result.reject(value);
    }
    return result.promise;
  }

  function handleCallback(value, isResolved, callback) {
    var callbackOutput = null;
    try {
      if (isFunction(callback)) callbackOutput = callback();
    } catch(e) {
      return makePromise(e, false);
    }
    if (callbackOutput && isFunction(callbackOutput.then)) {
      return callbackOutput.then(function() {
        return makePromise(value, isResolved);
      }, function(error) {
        return makePromise(error, false);
      });
    } else {
      return makePromise(value, isResolved);
    }
  }


  function processQueue(state) {
    var fn, promise;

    state.processScheduled = false;
    if (!state.status) return;
    for (var i = 0; i < state.pending.length; ++i) {
      promise = state.pending[i][0];
      fn = state.pending[i][state.status];
      try {
        if (isFunction(fn)) {
          promise.resolve(fn(state.value));
        } else if (state.status === 1) {
          promise.resolve(state.value);
        } else {
          promise.reject(state.value);
        }
      } catch(e) {
        promise.reject(e);
        exceptionHandler(e);
      }
    }
    state.pending = [];
  }

  function scheduleProcessQueue(state) {
    if (state.processScheduled) return;
    state.processScheduled = true;
    nextTick(function() { processQueue(state); });
  }

  function Promise(state) {
    this.$$state = state;
  }

  Promise.prototype.then = function(onFulfilled, onRejected, progressBack) {
    var result = defer();

    this.$$state.pending.push([result, onFulfilled, onRejected, progressBack]);
    if (this.$$state.status) scheduleProcessQueue(this.$$state);

    return result.promise;
  };

  Promise.prototype["catch"] = function(callback) {
    return this.then(null, callback);
  };

  Promise.prototype["finally"] = function(callback, progressBack) {
    return this.then(function(value) {
        return handleCallback(value, true, callback);
      }, function(error) {
        return handleCallback(error, false, callback);
      }, progressBack);
  };


  function Defer() {
    this.$$state = {
      pending: [],
      status: 0,
      value: undefined,
      processScheduled: false
    };
    this.promise = new Promise(this.$$state);
  }

  Defer.prototype.resolve = function(val) {
    var then, fns;

    if (this.$$state.status) return;
    if (val === this.promise) throw new TypeError('Cycle detected');
    fns = callOnce(this.resolve, this.reject);
    try {
      if ((isObject(val) || isFunction(val))) then = val && val.then;
      if (isFunction(then)) {
        then.call(val, fns[0], fns[1], this.notify);
      } else {
        this.$$state.value = val;
        this.$$state.status = 1;
        scheduleProcessQueue(this.$$state);
      }
    } catch(e) {
      fns[1](e);
      exceptionHandler(e);
    }
  };

  Defer.prototype.reject = function(reason) {
    if (this.$$state.status) return;
    this.$$state.value = reason;
    this.$$state.status = 2;
    scheduleProcessQueue(this.$$state);
  };

  Defer.prototype.notify = function(progress) {
    var callbacks = this.$$state.pending;

    if (!this.$$state.status && callbacks.length) {
      nextTick(function() {
        var callback, result;
        for (var i = 0, ii = callbacks.length; i < ii; i++) {
          result = callbacks[i][0];
          callback = callbacks[i][3];
          try {
            result.notify(isFunction(callback) ? callback(progress) : progress);
          } catch(e) {
            exceptionHandler(e);
          }
        }
      });
    }
  };

  /**
   * @ngdoc
   * @name ng.$q#defer
   * @methodOf ng.$q
   * @description
   * Creates a `Deferred` object which represents a task which will finish in the future.
   *
   * @returns {Deferred} Returns a new instance of deferred.
   */
  var defer = function() {

    var result = new Defer();
    result.resolve = bind(result, result.resolve);
    result.reject = bind(result, result.reject);
    result.notify = bind(result, result.notify);
    result.promise = new Promise(result.$$state);

    return result;
  };

  /**
   * @ngdoc
   * @name ng.$q#reject
   * @methodOf ng.$q
   * @description
   * Creates a promise that is resolved as rejected with the specified `reason`. This api should be
   * used to forward rejection in a chain of promises. If you are dealing with the last promise in
   * a promise chain, you don't need to worry about it.
   *
   * When comparing deferreds/promises to the familiar behavior of try/catch/throw, think of
   * `reject` as the `throw` keyword in JavaScript. This also means that if you "catch" an error via
   * a promise error callback and you want to forward the error to the promise derived from the
   * current promise, you have to "rethrow" the error by returning a rejection constructed via
   * `reject`.
   *
   * <pre>
   *   promiseB = promiseA.then(function(result) {
   *     // success: do something and resolve promiseB
   *     //          with the old or a new result
   *     return result;
   *   }, function(reason) {
   *     // error: handle the error if possible and
   *     //        resolve promiseB with newPromiseOrValue,
   *     //        otherwise forward the rejection to promiseB
   *     if (canHandle(reason)) {
   *      // handle the error and recover
   *      return newPromiseOrValue;
   *     }
   *     return $q.reject(reason);
   *   });
   * </pre>
   *
   * @param {*} reason Constant, message, exception or an object representing the rejection reason.
   * @returns {Promise} Returns a promise that was already resolved as rejected with the `reason`.
   */
  var reject = function(reason) {
    var result = defer();
    result.reject(reason);
    return result.promise;
  };

  /**
   * @ngdoc
   * @name ng.$q#when
   * @methodOf ng.$q
   * @description
   * Wraps an object that might be a value or a (3rd party) then-able promise into a $q promise.
   * This is useful when you are dealing with an object that might or might not be a promise, or if
   * the promise comes from a source that can't be trusted.
   *
   * @param {*} value Value or a promise
   * @returns {Promise} Returns a promise of the passed value or promise
   */
  var when = function(value, callback, errback, progressBack) {
    var result = defer();
    result.resolve(value);
    return result.promise.then(callback, errback, progressBack);
  };

  /**
   * @ngdoc
   * @name ng.$q#all
   * @methodOf ng.$q
   * @description
   * Combines multiple promises into a single promise that is resolved when all of the input
   * promises are resolved.
   *
   * @param {Array.<Promise>|Object.<Promise>} promises An array or hash of promises.
   * @returns {Promise} Returns a single promise that will be resolved with an array/hash of values,
   *   each value corresponding to the promise at the same index/key in the `promises` array/hash.
   *   If any of the promises is resolved with a rejection, this resulting promise will be rejected
   *   with the same rejection value.
   */
  var all = function(promises) {
    var deferred = defer(),
        counter = 0,
        results = isArray(promises) ? [] : {};

    forEach(promises, function(promise, key) {
      counter++;
      when(promise).then(function(value) {
        if (results.hasOwnProperty(key)) return;
        results[key] = value;
        if (!(--counter)) deferred.resolve(results);
      }, function(reason) {
        if (results.hasOwnProperty(key)) return;
        deferred.reject(reason);
      });
    });

    if (counter === 0) {
      deferred.resolve(results);
    }

    return deferred.promise;
  };

  return {
    defer: defer,
    reject: reject,
    when: when,
    all: all
  };
}
