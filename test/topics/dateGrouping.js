/* eslint-disable @stylistic/js/indent */
/* eslint-disable @stylistic/js/no-mixed-operators */
'use strict';

const assert = require('assert');
const dateGrouping = require('../../src/topics/dateGrouping');

describe('Date Grouping', () => {
    describe('groupTopicsByDateRange()', () => {
        const ONE_HOUR = 1000 * 60 * 60;
        const ONE_DAY = 1000 * 60 * 60 * 24;

        function noonToday() {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
        }

        function noonOnDate(daysAgo) {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 12, 0, 0).getTime();
        }

        function getWeekStartMonday(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            d.setDate(d.getDate() + diff);
            d.setHours(0, 0, 0, 0);
            return d;
        }

        it('should return empty array for empty input', () => {
            const result = dateGrouping.groupTopicsByDateRange([]);
            assert.strictEqual(result.length, 0);
        });

        it('should return empty array for null/undefined input', () => {
            assert.strictEqual(dateGrouping.groupTopicsByDateRange(null).length, 0);
            assert.strictEqual(dateGrouping.groupTopicsByDateRange(undefined).length, 0);
        });

        it('should separate pinned topics into their own group', () => {
            const noon = noonToday();
            const topics = [
                { tid: 1, title: 'Pinned 1', timestamp: noon, pinned: true },
                { tid: 2, title: 'Pinned 2', timestamp: noon - 1000, pinned: true },
                { tid: 3, title: 'Regular', timestamp: noon, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            assert.strictEqual(result[0].label, 'Pinned');
            assert.strictEqual(result[0].topics.length, 2);
            assert.strictEqual(result[0].topics[0].tid, 1);
        });

        it('should group topics by "Today"', () => {
            const noon = noonToday();
            const topics = [
                { tid: 1, title: 'Topic 1', timestamp: noon, pinned: false },
                { tid: 2, title: 'Topic 2', timestamp: noon - ONE_HOUR, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            assert.strictEqual(result[0].label, 'Today');
            assert.strictEqual(result[0].topics.length, 2);
        });

        it('should group topics by "Yesterday"', () => {
            const yesterday = noonOnDate(1);
            const topics = [
                { tid: 1, title: 'Yesterday topic', timestamp: yesterday, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            assert.strictEqual(result[0].label, 'Yesterday');
            assert.strictEqual(result[0].topics.length, 1);
        });

        it('should group topics by "This Week"', function () {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
            if (adjustedDay <= 2) {
                this.skip();
                return;
            }
            const mondayThisWeek = getWeekStartMonday(now);
            const mondayNoon = mondayThisWeek.getTime() + ONE_HOUR * 12;

            const topics = [
                { tid: 1, title: 'This week topic', timestamp: mondayNoon, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            const hasThisWeek = result.some(group => group.label === 'This Week');
            assert.strictEqual(hasThisWeek, true);
        });

        it('should group topics by "Last Week"', () => {
            const now = new Date();
            const mondayThisWeek = getWeekStartMonday(now);
            const lastWeekWednesday = new Date(mondayThisWeek.getTime() - ONE_DAY * 7 + ONE_DAY * 2 + ONE_HOUR * 12);
            const topics = [
                { tid: 1, title: 'Last week topic', timestamp: lastWeekWednesday.getTime(), pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            const hasLastWeek = result.some(group => group.label === 'Last Week' || group.label.includes('/'));
            assert.strictEqual(hasLastWeek, true);
        });

        it('should format older weeks as date ranges (M/D-M/D)', () => {
            const threeWeeksAgo = noonOnDate(21);
            const topics = [
                { tid: 1, title: 'Old topic', timestamp: threeWeeksAgo, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            const hasDateRange = result.some(group => /^\d+\/\d+-\d+\/\d+$/.test(group.label));
            assert.strictEqual(hasDateRange, true);
        });

        it('should sort topics within groups by timestamp (most recent first)', () => {
            const noon = noonToday();
            const topics = [
                { tid: 1, title: 'Older today', timestamp: noon - ONE_HOUR * 2, pinned: false },
                { tid: 2, title: 'Newer today', timestamp: noon - ONE_HOUR, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            assert.strictEqual(result[0].topics[0].tid, 2);
            assert.strictEqual(result[0].topics[1].tid, 1);
        });

        it('should handle mixed pinned and regular topics correctly', () => {
            const noon = noonToday();
            const topics = [
                { tid: 1, title: 'Pinned', timestamp: noon, pinned: true },
                { tid: 2, title: 'Today', timestamp: noon, pinned: false },
                { tid: 3, title: 'Yesterday', timestamp: noonOnDate(1), pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            assert.strictEqual(result[0].label, 'Pinned');
            assert.strictEqual(result[0].topics.length, 1);
            assert(result.length >= 3, 'Should have at least Pinned + Today + Yesterday');
        });

        it('should not create a Pinned group if no topics are pinned', () => {
            const noon = noonToday();
            const topics = [
                { tid: 1, title: 'Topic 1', timestamp: noon, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            const pinnedGroup = result.find(g => g.label === 'Pinned');
            assert.strictEqual(pinnedGroup, undefined);
        });

        it('should handle a single topic', () => {
            const noon = noonToday();
            const topics = [
                { tid: 1, title: 'Solo', timestamp: noon, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].topics.length, 1);
        });

        it('should handle all topics being pinned', () => {
            const noon = noonToday();
            const topics = [
                { tid: 1, title: 'Pin 1', timestamp: noon, pinned: true },
                { tid: 2, title: 'Pin 2', timestamp: noon - 1000, pinned: true },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);

            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].label, 'Pinned');
            assert.strictEqual(result[0].topics.length, 2);
        });

        it('should format date ranges without leading zeros', () => {
            const threeWeeksAgo = noonOnDate(21);
            const topics = [
                { tid: 1, title: 'Old', timestamp: threeWeeksAgo, pinned: false },
            ];

            const result = dateGrouping.groupTopicsByDateRange(topics);
            const olderGroup = result.find(g => /^\d+\/\d+-\d+\/\d+$/.test(g.label));

            assert(olderGroup, `Expected M/D-M/D label but got: ${result.map(g => g.label).join(', ')}`);
            const parts = olderGroup.label.match(/(\d+)/g);
            parts.forEach((part) => {
                assert.strictEqual(part, String(parseInt(part, 10)), `"${part}" should not have leading zeros`);
            });
        });

        it('should format older weeks as correct date ranges (M/D-M/D)', () => {
            const threeWeeksAgo = new Date(noonOnDate(21));

            const monday = getWeekStartMonday(threeWeeksAgo);
            const sunday = new Date(monday.getTime() + ONE_DAY * 6);

            const expectedLabel = `${monday.getMonth() + 1}/${monday.getDate()}-${sunday.getMonth() + 1}/${sunday.getDate()}`;

            const topics = [{ tid: 1, title: 'Old', timestamp: threeWeeksAgo.getTime(), pinned: false }];
            const result = dateGrouping.groupTopicsByDateRange(topics);

            const olderGroup = result.find(g => /^\d+\/\d+-\d+\/\d+$/.test(g.label));
            assert(olderGroup, `Expected M/D-M/D label but got: ${result.map(g => g.label).join(', ')}`);
            assert.strictEqual(olderGroup.label, expectedLabel);
        });
    });
});