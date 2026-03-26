
/* eslint-disable strict */
//var request = require('request');

const translatorApi = module.exports;



translatorApi.translate = async function (postData) {
	const TRANSLATOR_API = 'http://17313-team11.s3d.cmu.edu:5000/';
	const response = await fetch(TRANSLATOR_API + '/?content=' + postData.content);
	const data = await response.json();
	return [data.is_english.toString(), data.translated_content];
};
