'use strict';


const assert = require('assert');

const nconf = require('nconf');
const path = require('path');
const util = require('util');

const sleep = util.promisify(setTimeout);

const db = require('./mocks/databasemock');
const topics = require('../src/topics');
const posts = require('../src/posts');
const categories = require('../src/categories');
const privileges = require('../src/privileges');
const user = require('../src/user');
const groups = require('../src/groups');
const socketPosts = require('../src/socket.io/posts');
const apiPosts = require('../src/api/posts');
const apiTopics = require('../src/api/topics');
const meta = require('../src/meta');
const file = require('../src/file');
const helpers = require('./helpers');
const utils = require('../src/utils');
const request = require('../src/request');

describe('Post\'s', () => {
	let testUser;
	let globalModUid;
	let postData;
	let topicData;
	let cid;

	before(async () => {
		testUser = await user.create({ username: 'upvotee' });
		globalModUid = await user.create({ username: 'globalmod', password: 'globalmodpwd' });
		({ cid } = await categories.create({
			name: 'Test Category',
			description: 'Test category created by testing script',
		}));

		({ topicData, postData } = await topics.post({
			uid: testUser,
			cid: cid,
			title: 'Test Topic Title',
			content: 'The content of test topic',
		}));
	});
	it('should create a note', async () => {
		const { topicData, postData } = await topics.post({
			uid: testUser,
			cid: cid,
			title: 'Test Topic Title',
			content: 'The content of test topic',
			postType: 'note',
		});
		assert.equal(topicData.type, 'note');
	});
	it('original post should be a question', async () => {
		assert.equal(topicData.type, 'question');
	});
	it('should be able to mark a past as answer', async () => {
		assert.equal(topicData.marked_answer, undefined);
		const reply = await topics.reply({ uid: testUser, tid: topicData.tid, content: 'firstReply' });
		await posts.markAsAnswer(topicData.tid, reply.pid);
		topicData = await topics.getTopicsByTids([topicData.tid], testUser);
		assert.equal(topicData[0].marked_answer, reply.pid);

	});
});