/**
 * This helper funtion enables one to search through a json object and select
 * specific items to return. As of now it is only applicable to shallow objects
 * and does not support (or least it is not tested yet) heavily nested data.
 *
 * Remember to include underscorejs before this file.
 *
 * Note: This helper is inspired by the query language used in mongodb
 * {@link http://www.mongodb.org/display/DOCS/Advanced+Queries}.
 *
 * Samples
 *
 * var data = [
 *      {id: 1, description: "foobar",  position: 3,  attributes: []},
 *      {id: 2, description: "bar",     position: 99, attributes: []},
 *      {id: 3, description: "baz",     position: 11, attributes: []},
 *      {id: 4, description: "nothing", position: 26, attributes: []},
 * ];
 * console.log( _.search(data, { id: 1, content: { $contains: "bar" } }) );
 * console.log( _.search(data, { id: { $in: [2,4] }, content: { $contains: "bar" } }) );
 * console.log( _.search(data, { id: { $in: [2,4], $eq: 4 }) );
 */
(function(_) {

    /**
     * wraps the selectors for creating a subset of a computed result set
     * @type {Object}
     */
    var subsetSelectors = {
        /**
         * skips a given number of elements of the set
         */
        skip: function(set, num) {
            return set.slice(num);
        },

        /**
         * will limit the number of elements of the set
         */
        limit: function(set, num) {
            return set.slice(0, num);
        },

        sort: function(set, by) {
            //_.each()
        },

        group: function(set, by) {

        }
    };

    /**
     * wraps all selectors that can be used within a query
     * @type {Object}
     */
    var querySelectors = {
        contains: function(actual, expected) {
            return actual.indexOf(expected) >= 0;
        },

        in: function(actual, expected) {
            return _.include(expected, actual);
        },

        /**
         * negation of 'in'
         */
        nin: function(actual, expected) {
            return !querySelectors.in(actual, expected);
        },

        eq: function(actual, expected) {
            return actual == expected;
        },

        /**
         * negation of 'eq'
         */
        ne: function(actual, expected) {
            return !querySelectors.eq(actual, expected);
        },

        lt: function(actual, expected) {
            return actual < expected;
        },

        lte: function(actual, expected) {
            return actual <= expected;
        },

        gt: function(actual, expected) {
            return actual > expected;
        },

        gte: function(actual, expected) {
            return actual >= expected;
        },

        all: function(actual, expected) {
            return _.isArray(actual) && _.isArray(actual) && _.intersection(actual, expected).length == expected.length;
        },

        regex: function(actual, expected) {

        },

        or: function() {

        },

        and: function() {

        },

        size: function() {

        },

        exists: function() {

        }

    };

    // this function is doing the actual work by converting the given query to a single function call
    var compiler = (function() {
        /**
         * in more complex situations this should be implemented with a strategy to drop cached queries (ie a lru algorithm)
         */
        var cachedSelectors = {};

        /**
         * Compiles a query to a single function that can be called later on.
         *
         * @param {Object} query
         * @param {String} key
         * @return {Function}
         */
        function compileSelector(query, key) {
            var selector = [];

            _.each(query, function(v, k) {
                if (_.isObject(v) && !_.isArray(v)) {
                    var nestedMatcher = compileSelector(v, k);

                    selector.push(function(row) {
                        return nestedMatcher(row);
                    });
                } else if ('$' === k[0]) {
                    var sel = querySelectors[k.substr(1)];

                    selector.push(function(row) {
                        return sel(row[key], v);
                    });
                } else {
                    // by here we can be sure, that the key and the value are scalar values
                    // so we evaluate it as a equal-condition
                    selector.push(function(row) {
                        return querySelectors.eq(row[k], v);
                    });
                }
            });

            return function(row) {
                var matched = true;
                _.each(selector, function(fn, i) {
                    matched = matched && fn(row);
                });

                return matched;
            }
        }

        /**
         * This function will have a look at the cache and will return the cached result if any or call compileSelector.
         */
        function compile(query) {
            var queryStr = JSON.stringify(query);
            var compiledSelector;

            if (_.has(cachedSelectors, queryStr)) {
                compiledSelector = cachedSelectors[queryStr];
            } else {
                cachedSelectors[queryStr] = compiledSelector = compileSelector(query);
            }

            return compiledSelector;
        }

        return compile;
    })();


    function search(data, query, subset) {
        data = !_.isArray(data) ? [ data ] : data;

        var set = [];
        var matches = compiler(query);

        _.each(data, function(el, i) {
            if (matches(el)) {
                set.push(el);
            }
        });

        // computing of the subset could be done in a seperate function
        if (_.isObject(subset) && set.length > 0) {
            _.each(subset, function(v, k) {
                if ('$' === k[0]) {
                    var fn = subsetSelectors[k.substr(1)];
                    set = fn(set, v)
                } else {
                    // we could pluck specific keys here
                    /*
                     var originalKeys = _.keys(set[0]);
                     var keys = [];

                     if (0 === v) {

                     } else if (1 === v) {

                     }
                     */
                }
            });
        }

        return set;
    }

    // register a thin wrapper to underscore
    _.mixin({
        search: search
    });

})(_);
