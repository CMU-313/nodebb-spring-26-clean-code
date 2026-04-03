'use strict';

const assert = require('assert');

const db = require('./mocks/databasemock');

describe('Translate', () => {
	let originalFetch;

	beforeEach(() => {
		originalFetch = global.fetch;
		// Clear the module cache so each test gets a fresh require
		delete require.cache[require.resolve('../src/translate/index')];
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	it('should return [true, ""] when fetch throws a network error', async () => {
		global.fetch = async () => {
			throw new Error('network error');
		};
		const translate = require('../src/translate/index');
		const result = await translate.translate({ content: 'hello world' });
		assert.deepStrictEqual(result, ['true', '']);
	});

	it('should return [false, translated text] for non-English response', async () => {
		global.fetch = async () => ({
			json: async () => ({ is_english: false, translated_content: 'hello world' }),
		});
		const translate = require('../src/translate/index');
		const result = await translate.translate({ content: 'hola mundo' });
		assert.deepStrictEqual(result, ['false', 'hello world']);
	});

	it('should return [true, ""] for English response', async () => {
		global.fetch = async () => ({
			json: async () => ({ is_english: true, translated_content: '' }),
		});
		const translate = require('../src/translate/index');
		const result = await translate.translate({ content: 'hello world' });
		assert.deepStrictEqual(result, ['true', '']);
	});

	it('should return [true, ""] for emoji content with English response', async () => {
		global.fetch = async () => ({
			json: async () => ({ is_english: true, translated_content: '' }),
		});
		const translate = require('../src/translate/index');
		const result = await translate.translate({ content: '😀🎉' });
		assert.deepStrictEqual(result, ['true', '']);
	});

	it('should return [true, ""] when response contains malformed JSON', async () => {
		global.fetch = async () => ({
			json: async () => { throw new SyntaxError('Unexpected token'); },
		});
		const translate = require('../src/translate/index');
		const result = await translate.translate({ content: 'hello world' });
		assert.deepStrictEqual(result, ['true', '']);
	});
});
