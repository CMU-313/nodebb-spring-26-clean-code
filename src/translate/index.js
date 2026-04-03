'use strict';

const translatorApi = module.exports;

const TRANSLATOR_URL = 'http://17313-team11.s3d.cmu.edu:5000';

translatorApi.translate = async function (postData) {
	try {
		const response = await fetch(
			`${TRANSLATOR_URL}/?content=${encodeURIComponent(postData.content)}`
		);
		const data = await response.json();
		const isEnglish = data.is_english ? 'true' : 'false';
		const translatedContent = data.translated_content || '';
		return [isEnglish, translatedContent];
	} catch (err) {
		console.log('Translation error!', err, TRANSLATOR_URL);
		return ['true', ''];
	}
};
