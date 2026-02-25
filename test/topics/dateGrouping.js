/* eslint-disable @stylistic/js/no-mixed-operators */
'use strict';

const assert = require('assert');
const dateGrouping = require('../../src/topics/dateGrouping');

describe('Date Grouping', () => {
	describe('groupTopicsByDateRange()', () => {
		it('should return empty array for empty input', () => {
			const result = dateGrouping.groupTopicsByDateRange([]);
			assert.strictEqual(result.length, 0);
		});

		it('should return empty array for null/undefined input', () => {
			assert.strictEqual(dateGrouping.groupTopicsByDateRange(null).length, 0);
			assert.strictEqual(dateGrouping.groupTopicsByDateRange(undefined).length, 0);
		});

		it('should separate pinned topics into their own group', () => {
			const now = Date.now();
			const topics = [
				{ tid: 1, title: 'Pinned 1', timestamp: now, pinned: true },
				{ tid: 2, title: 'Pinned 2', timestamp: now - 1000, pinned: true },
				{ tid: 3, title: 'Regular', timestamp: now, pinned: false },
			];

			const result = dateGrouping.groupTopicsByDateRange(topics);
			
			assert.strictEqual(result[0].label, 'Pinned');
			assert.strictEqual(result[0].topics.length, 2);
			assert.strictEqual(result[0].topics[0].tid, 1); // Most recent first
		});

		it('should group topics by "Today"', () => {
			const now = new Date();
			// Use noon today to avoid midnight boundary issues in CI
			const noonToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
			const topics = [
				{ tid: 1, title: 'Topic 1', timestamp: noonToday, pinned: false },
				{ tid: 2, title: 'Topic 2', timestamp: noonToday - 1000 * 60 * 30, pinned: false }, // 30 min earlier, still today
			];
		
			const result = dateGrouping.groupTopicsByDateRange(topics);
		
			assert.strictEqual(result[0].label, 'Today');
			assert.strictEqual(result[0].topics.length, 2);
		});

		it('should group topics by "Yesterday"', () => {
			const now = Date.now();
			const yesterday = now - 1000 * 60 * 60 * 24;
			const topics = [
				{ tid: 1, title: 'Yesterday topic', timestamp: yesterday, pinned: false },
			];

			const result = dateGrouping.groupTopicsByDateRange(topics);
			
			assert.strictEqual(result[0].label, 'Yesterday');
			assert.strictEqual(result[0].topics.length, 1);
		});

		it('should group topics by "This Week"', () => {
			const now = Date.now();
			const threeDaysAgo = now - 1000 * 60 * 60 * 24 * 3;
			const topics = [
				{ tid: 1, title: 'This week topic', timestamp: threeDaysAgo, pinned: false },
			];

			const result = dateGrouping.groupTopicsByDateRange(topics);
			
			// Should be "This Week" if within current Monday-Sunday week
			const hasThisWeek = result.some(group => group.label === 'This Week');
			assert.strictEqual(hasThisWeek, true);
		});

		it('should group topics by "Last Week"', () => {
			const now = Date.now();
			const tenDaysAgo = now - 1000 * 60 * 60 * 24 * 10;
			const topics = [
				{ tid: 1, title: 'Last week topic', timestamp: tenDaysAgo, pinned: false },
			];

			const result = dateGrouping.groupTopicsByDateRange(topics);
			
			// Should be "Last Week" or a date range
			const hasLastWeek = result.some(group => group.label === 'Last Week' || group.label.includes('/'));
			assert.strictEqual(hasLastWeek, true);
		});

		it('should format older weeks as date ranges (M/D-M/D)', () => {
			const now = Date.now();
			const threeWeeksAgo = now - 1000 * 60 * 60 * 24 * 21;
			const topics = [
				{ tid: 1, title: 'Old topic', timestamp: threeWeeksAgo, pinned: false },
			];

			const result = dateGrouping.groupTopicsByDateRange(topics);
			
			// Should have a date range format
			const hasDateRange = result.some(group => /^\d+\/\d+-\d+\/\d+$/.test(group.label));
			assert.strictEqual(hasDateRange, true);
		});

		it('should sort topics within groups by timestamp (most recent first)', () => {
			const now = Date.now();
			const topics = [
				{ tid: 1, title: 'Older today', timestamp: now - 1000 * 60 * 60 * 2, pinned: false },
				{ tid: 2, title: 'Newer today', timestamp: now - 1000 * 60 * 60, pinned: false },
			];

			const result = dateGrouping.groupTopicsByDateRange(topics);
			
			assert.strictEqual(result[0].topics[0].tid, 2); // Newer first
			assert.strictEqual(result[0].topics[1].tid, 1); // Older second
		});

		it('should handle mixed pinned and regular topics correctly', () => {
			const now = Date.now();
			const topics = [
				{ tid: 1, title: 'Pinned', timestamp: now - 1000 * 60 * 60 * 24 * 5, pinned: true },
				{ tid: 2, title: 'Today', timestamp: now, pinned: false },
				{ tid: 3, title: 'Yesterday', timestamp: now - 1000 * 60 * 60 * 24, pinned: false },
			];

			const result = dateGrouping.groupTopicsByDateRange(topics);
			
			assert.strictEqual(result[0].label, 'Pinned');
			assert.strictEqual(result[1].label, 'Today');
			assert.strictEqual(result[2].label, 'Yesterday');
		});

		it('should handle topics from future dates', () => {
			const now = Date.now();
			const future = now + 1000 * 60 * 60 * 24;
			const topics = [
				{ tid: 1, title: 'Future topic', timestamp: future, pinned: false },
			];

			const result = dateGrouping.groupTopicsByDateRange(topics);
			
			// Future topics should go in "Today"
			assert.strictEqual(result[0].label, 'Today');
		});
	});
});