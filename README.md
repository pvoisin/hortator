[![NPM Version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url]

# Hortator

Simple clock that cares about time... but doesn't really care about your business!

> "Hortator" is a Latin word which, in the Old Rome, designated the slave runner who was giving rowing beats on the Roman [triremes](https://en.wikipedia.org/wiki/Trireme) to communicate to the slave rowers the speed the captain wanted.


## Usage

```javascript
var Clock = require("hortator");

var clock = new Clock({period: 0.5}); // seconds

clock.on("tick", function(tickTime, delay) {
	/* do your business */
});

clock.start();

// ...

clock.stop();
```

[npm-image]: https://img.shields.io/npm/v/hortator.svg?style=flat
[npm-url]: https://www.npmjs.com/package/hortator
[travis-image]: https://img.shields.io/travis/pvoisin/hortator.svg?branch=master
[travis-url]: https://travis-ci.org/pvoisin/hortator/
[coveralls-image]: https://coveralls.io/repos/pvoisin/hortator/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/r/pvoisin/hortator?branch=master