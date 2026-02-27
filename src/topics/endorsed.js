'use strict';
const posts = require('../posts');
module.exports = function (Topics) {
	Topics.getEndorsedStatus = async (topics) => {
		const mainPids = topics.map(topic => topic.mainPid);
		const endorsers = await posts.getEndorsedUsers(mainPids);
		return endorsers.map(endorsersForAPost => endorsersForAPost.length > 0);
	};
};