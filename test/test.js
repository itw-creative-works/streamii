const package = require('../package.json');
const assert = require('assert');

beforeEach(() => {
});

before(() => {
});

after(() => {
});

/*
 * ============
 *  Test Cases
 * ============
 */
describe(`${package.name}`, () => {
  let powertools = require('../dist/index.js');

  describe('.queue()', () => {

    const queue = powertools.queue();

    queue.add(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('Hello, World!');
        }, 1000);
      });
    });

    describe('queue', () => {
      // Normal
      it('add to queue', () => {
        return queue.list === 1;
      });
    });

  });  

  describe('.getKeys()', () => {

    describe('keys', () => {
      // Normal
      it('object (one key) => array (one key)', () => {
        return assert.deepEqual(powertools.getKeys({name: 'ian'}), ['name']);
      });
      it('object (one key + nested) => array (one key, nested)', () => {
        return assert.deepEqual(powertools.getKeys({name: 'ian', favorites: {color: 'red'}}), ['name', 'favorites.color']);
      });


      // Edge
      it('object (empty) => array (one value + nested)', () => {
        return assert.deepEqual(powertools.getKeys({}), []);
      });
    });

  });

  describe('.force()', () => {

    describe('string', () => {
      it('string (empty) => string (empty)', () => {
        return assert.equal(powertools.force('', 'string'), '');
      });
      it('string => string', () => {
        return assert.equal(powertools.force('Hello, World!', 'string'), 'Hello, World!');
      });
      it('boolean (true) => string', () => {
        return assert.equal(powertools.force(true, 'string'), 'true');
      });
      it('boolean (false) => string', () => {
        return assert.equal(powertools.force(false, 'string'), 'false');
      });
      it('number (1) => string', () => {
        return assert.equal(powertools.force(1, 'string'), '1');
      });
      it('number (0) => string', () => {
        return assert.equal(powertools.force(0, 'string'), '0');
      });

      // Edge
      it('object ({}) => string (empty)', () => {
        return assert.equal(powertools.force({}, 'string'), '');
      });
      it('object (1 key) => string (empty)', () => {
        return assert.equal(powertools.force({key: 'value'}, 'string'), '');
      });
      it('array ([]) => string (empty)', () => {
        return assert.equal(powertools.force([], 'string'), '');
      });
      it('array (1 item) => string (empty)', () => {
        return assert.equal(powertools.force(['item'], 'string'), '');
      });
      it('undefined => string (empty)', () => {
        return assert.equal(powertools.force(undefined, 'string'), '');
      });
      it('null => string (empty)', () => {
        return assert.equal(powertools.force(null, 'string'), '');
      });
      it('NaN => string (empty)', () => {
        return assert.equal(powertools.force(NaN, 'string'), '');
      });
    });

    describe('number', () => {
      it('number => number', () => {
        return assert.equal(powertools.force(0, 'number'), 0);
      });
      it('number => number', () => {
        return assert.equal(powertools.force(1, 'number'), 1);
      });
      it('string => number', () => {
        return assert.equal(powertools.force('1', 'number'), 1);
      });
      it('string => number', () => {
        return assert.equal(powertools.force('0', 'number'), 0);
      });
      it('string (float) => number', () => {
        return assert.equal(powertools.force('0.0', 'number'), 0);
      });
      it('string (float) => number', () => {
        return assert.equal(powertools.force('1.0', 'number'), 1.0);
      });
      it('string (float) => number', () => {
        return assert.equal(powertools.force('1.234', 'number'), 1.234);
      });

      // Edge
      it('string => number', () => {
        return assert.equal(powertools.force('a random string', 'number'), 1);
      });
      it('true => number', () => {
        return assert.equal(powertools.force(true, 'number'), 1);
      });
      it('false => number', () => {
        return assert.equal(powertools.force(false, 'number'), 0);
      });
      it('object ({}) => string (empty)', () => {
        return assert.equal(powertools.force({}, 'number'), 0);
      });
      it('object (1 key) => number (1)', () => {
        return assert.equal(powertools.force({key: 'value'}, 'number'), 1);
      });
      it('array ([]) => number (empty)', () => {
        return assert.equal(powertools.force([], 'number'), 0);
      });
      it('array (1 item) => number (1)', () => {
        return assert.equal(powertools.force(['item'], 'number'), 1);
      });
      it('undefined => number', () => {
        return assert.equal(powertools.force(undefined, 'number'), 0);
      });
      it('null => number', () => {
        return assert.equal(powertools.force(null, 'number'), 0);
      });
      it('NaN => number', () => {
        return assert.equal(powertools.force(NaN, 'number'), 0);
      });
    });

    describe('boolean', () => {
      it('boolean (true) => boolean (true)', () => {
        return assert.equal(powertools.force(true, 'boolean'), true);
      });
      it('boolean (false) => boolean (false)', () => {
        return assert.equal(powertools.force(false, 'boolean'), false);
      });
      it('string (true) => boolean (true)', () => {
        return assert.equal(powertools.force('true', 'boolean'), true);
      });
      it('string (false) => boolean (false)', () => {
        return assert.equal(powertools.force('false', 'boolean'), false);
      });
      it('string (1) => boolean (true)', () => {
        return assert.equal(powertools.force('1', 'boolean'), true);
      });
      it('number (1) => boolean (true)', () => {
        return assert.equal(powertools.force(1, 'boolean'), true);
      });
      it('string (0) => boolean (false)', () => {
        return assert.equal(powertools.force('0', 'boolean'), false);
      });
      it('number (0) => boolean (false)', () => {
        return assert.equal(powertools.force(0, 'boolean'), false);
      });
      it('number (-1) => boolean (true)', () => {
        return assert.equal(powertools.force(-1, 'boolean'), true);
      });

      // Edge
      it('string => boolean (true)', () => {
        return assert.equal(powertools.force('Hello, World!', 'boolean'), true);
      });
      it('object ({}) => boolean (true)', () => {
        return assert.equal(powertools.force({}, 'boolean'), false);
      });
      it('object (1 key) => boolean (true)', () => {
        return assert.equal(powertools.force({key: 'value'}, 'boolean'), true);
      });
      it('array (empty) => boolean (true)', () => {
        return assert.equal(powertools.force([], 'boolean'), false);
      });
      it('array (1 item) => boolean (true)', () => {
        return assert.equal(powertools.force(['item'], 'boolean'), true);
      });
      it('undefined => boolean (false)', () => {
        return assert.equal(powertools.force(undefined, 'boolean'), false);
      });
      it('null => boolean (false)', () => {
        return assert.equal(powertools.force(null, 'boolean'), false);
      });
    });

    describe('array', () => {
      let result_number = [1, 2, 3];
      let result_string = ['1', '2', '3'];
      let result_boolean = [true, false, true];
      let result_empty = [];

      it('array (number) => array (number)', () => {
        return assert.deepStrictEqual(powertools.force([1, 2, 3], 'array'), result_number);
      });
      it('array (string) => array (string)', () => {
        return assert.deepStrictEqual(powertools.force('1,2,3', 'array'), result_string);
      });
      it('array (number + spaces) => array (string)', () => {
        return assert.deepStrictEqual(powertools.force('1, 2, 3', 'array'), result_string);
      });
      it('array (number + spaces) => array (number)', () => {
        return assert.deepStrictEqual(powertools.force('1, 2, 3', 'array', {force: 'number'}), result_number);
      });
      it('array (boolean) => array (boolean)', () => {
        return assert.deepStrictEqual(powertools.force('true,false,true', 'array', {force: 'boolean'}), result_boolean);
      });
      it('array (boolean) => array (boolean)', () => {
        return assert.deepStrictEqual(powertools.force('true, false, true', 'array', {force: 'boolean'}), result_boolean);
      });
      it('array (boolean) => array (boolean)', () => {
        return assert.deepStrictEqual(powertools.force([true, false, true], 'array', {force: 'boolean'}), result_boolean);
      });

      // Edge
      it('boolean => array', () => {
        return assert.deepStrictEqual(powertools.force(true, 'array', {force: 'boolean'}), [true]);
      });
      it('boolean => array', () => {
        return assert.deepStrictEqual(powertools.force(false, 'array', {force: 'boolean'}), [false]);
      });
      it('empty string => empty array', () => {
        return assert.deepStrictEqual(powertools.force('', 'array'), result_empty);
      });
      it('undefined => empty array', () => {
        return assert.deepStrictEqual(powertools.force(undefined, 'array'), result_empty);
      });
      it('null => empty array', () => {
        return assert.deepStrictEqual(powertools.force(null, 'array'), result_empty);
      });
    });

  });

})
