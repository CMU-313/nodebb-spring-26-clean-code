/* eslint-disable max-len */
/* eslint-disable @stylistic/js/no-mixed-operators */
/* eslint-disable @stylistic/js/indent */
'use strict';

const assert = require('assert');
const nconf = require('nconf');

const db = require('../mocks/databasemock');
const helpers = require('../helpers');
const user = require('../../src/user');
const categories = require('../../src/categories');
const topics = require('../../src/topics');
const groups = require('../../src/groups');
const api = require('../../src/api');
const dateGrouping = require('../../src/topics/dateGrouping');

describe('Grouped Topics Feature', () => {
    let adminUid;
    let regularUid;
    let categoryObj;
    let adminJar;
    let csrf_token;

    before(async () => {
        adminUid = await user.create({ username: 'groupedadmin', password: '123456' });
        regularUid = await user.create({ username: 'groupeduser', password: '123456' });
        await groups.join('administrators', adminUid);
        categoryObj = await categories.create({
            name: 'Grouped Topics Test Category',
            description: 'Category for grouped topics tests',
        });
        const login = await helpers.loginUser('groupedadmin', '123456');
        adminJar = login.jar;
        csrf_token = login.csrf_token;
    });

    // =========================================================================
    // Grouping Utility Function Tests 
    // =========================================================================
    describe('Date Grouping Utility (dateGrouping.groupTopicsByDateRange)', () => {
        const ONE_HOUR = 1000 * 60 * 60;
        const ONE_DAY = 1000 * 60 * 60 * 24;

        function getWeekStartMonday(date) {
            const d = new Date(date);
            const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const diff = day === 0 ? -6 : 1 - day;
            d.setDate(d.getDate() + diff);
            d.setHours(0, 0, 0, 0);
            return d;
        }

        describe('edge cases', () => {
            it('should return empty array for empty input', () => {
                assert.deepStrictEqual(dateGrouping.groupTopicsByDateRange([]), []);
            });

            it('should return empty array for null input', () => {
                assert.deepStrictEqual(dateGrouping.groupTopicsByDateRange(null), []);
            });

            it('should return empty array for undefined input', () => {
                assert.deepStrictEqual(dateGrouping.groupTopicsByDateRange(undefined), []);
            });

            it('should handle a single topic', () => {
                const now = Date.now();
                const topicList = [
                    { tid: 1, title: 'Solo', timestamp: now, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                assert(result.length > 0);
                assert.strictEqual(result[0].topics.length, 1);
                assert.strictEqual(result[0].topics[0].tid, 1);
            });

            it('should handle all topics being pinned', () => {
                const now = Date.now();
                const topicList = [
                    { tid: 1, title: 'Pinned A', timestamp: now, pinned: true },
                    { tid: 2, title: 'Pinned B', timestamp: now - 1000, pinned: true },
                    { tid: 3, title: 'Pinned C', timestamp: now - 2000, pinned: true },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                assert.strictEqual(result.length, 1);
                assert.strictEqual(result[0].label, 'Pinned');
                assert.strictEqual(result[0].topics.length, 3);
            });
        });

        describe('pinned topics separation', () => {
            it('should place pinned topics in a "Pinned" group that appears first', () => {
                const now = Date.now();
                const topicList = [
                    { tid: 1, title: 'Pinned', timestamp: now - ONE_DAY * 5, pinned: true },
                    { tid: 2, title: 'Regular', timestamp: now, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                assert.strictEqual(result[0].label, 'Pinned');
                assert.strictEqual(result[0].topics.length, 1);
                assert.strictEqual(result[0].topics[0].tid, 1);
            });

            it('should not create a "Pinned" group when no topics are pinned', () => {
                const now = Date.now();
                const topicList = [
                    { tid: 1, title: 'Regular', timestamp: now, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                const pinnedGroup = result.find(g => g.label === 'Pinned');
                assert.strictEqual(pinnedGroup, undefined);
            });
        });

        describe('date bucketing', () => {
            it('should group topics posted today into "Today"', () => {
                const now = Date.now();
                const topicList = [
                    { tid: 1, title: 'Now', timestamp: now, pinned: false },
                    { tid: 2, title: 'Earlier today', timestamp: now, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                assert.strictEqual(result[0].label, 'Today');
                assert.strictEqual(result[0].topics.length, 2);
            });

            it('should group topics posted yesterday into "Yesterday"', () => {
                const now = Date.now();
                const yesterday = now - ONE_DAY;
                const topicList = [
                    { tid: 1, title: 'Yesterday topic', timestamp: yesterday, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                assert.strictEqual(result[0].label, 'Yesterday');
                assert.strictEqual(result[0].topics.length, 1);
            });

            it('should group topics from earlier this week into "This Week"', function () {
                const now = Date.now();
                const today = new Date(now);
                const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
                // Monday=1, Tuesday=2 — not enough days before yesterday in this week
                const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // treat Sunday as 7
                if (adjustedDay <= 2) {
                    this.skip(); // Not enough days in current week for a valid "This Week" candidate
                    return;
                }
                // Pick the Monday of this week
                const mondayOfThisWeek = getWeekStartMonday(now);
                // Use Monday at noon as the test timestamp (guaranteed to be before yesterday)
                const thisWeekTimestamp = mondayOfThisWeek.getTime() + ONE_HOUR * 12;

                const topicList = [
                    { tid: 1, title: 'This week topic', timestamp: thisWeekTimestamp, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                const thisWeekGroup = result.find(g => g.label === 'This Week');
                assert(thisWeekGroup, `"This Week" group should exist, got labels: ${result.map(g => g.label).join(', ')}`);
                assert.strictEqual(thisWeekGroup.topics.length, 1);
            });

            it('should group topics from the previous week into "Last Week"', () => {
                const now = Date.now();
                const mondayThisWeek = getWeekStartMonday(now);
                // Wednesday of last week = last Monday + 2 days
                const lastWeekWednesday = new Date(mondayThisWeek.getTime() - ONE_DAY * 7 + ONE_DAY * 2 + ONE_HOUR * 12);
                const topicList = [
                    { tid: 1, title: 'Last week topic', timestamp: lastWeekWednesday.getTime(), pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                const lastWeekGroup = result.find(g => g.label === 'Last Week');
                assert(lastWeekGroup, `"Last Week" group should exist, got labels: ${result.map(g => g.label).join(', ')}`);
                assert.strictEqual(lastWeekGroup.topics.length, 1);
            });

            it('should format older weeks as M/D-M/D without leading zeros', () => {
                const now = Date.now();
                const threeWeeksAgo = now - ONE_DAY * 21;
                const topicList = [
                    { tid: 1, title: 'Old topic', timestamp: threeWeeksAgo, pinned: false },
                ];

                const result = dateGrouping.groupTopicsByDateRange(topicList);
                const olderGroup = result.find(g => /^\d+\/\d+-\d+\/\d+$/.test(g.label));

                assert(olderGroup, `Expected a date range label (M/D-M/D) but got: ${result.map(g => g.label).join(', ')}`);

                const parts = olderGroup.label.match(/(\d+)/g);
                parts.forEach((part) => {
                    assert.strictEqual(
                        part,
                        String(parseInt(part, 10)),
                        `"${part}" should not have leading zeros`
                    );
                });
            });

            it('should use the correct Monday-Sunday range for the week the topic was posted in', () => {
                const now = Date.now();
                const threeWeeksAgo = now - ONE_DAY * 21;
                const topicList = [
                    { tid: 1, title: 'Old topic', timestamp: threeWeeksAgo, pinned: false },
                ];

                const topicDate = new Date(threeWeeksAgo);
                const dayOfWeek = topicDate.getDay();
                const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                const monday = new Date(topicDate);
                monday.setDate(topicDate.getDate() - daysFromMonday);
                monday.setHours(0, 0, 0, 0);

                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);

                const expectedLabel = `${monday.getMonth() + 1}/${monday.getDate()}-${sunday.getMonth() + 1}/${sunday.getDate()}`;

                const result = dateGrouping.groupTopicsByDateRange(topicList);
                const olderGroup = result.find(g => /^\d+\/\d+-\d+\/\d+$/.test(g.label));

                assert(olderGroup, `Expected a date range label (M/D-M/D) but got: ${result.map(g => g.label).join(', ')}`);
                assert.strictEqual(
                    olderGroup.label,
                    expectedLabel,
                    `Expected label "${expectedLabel}" for a topic posted on ${topicDate.toDateString()}`
                );
            });
        });

        describe('sorting within groups', () => {
            it('should sort topics within each group by timestamp descending (most recent first)', () => {
                const now = Date.now();
                const topicList = [
                    { tid: 1, title: 'Older', timestamp: now - 2, pinned: false },
                    { tid: 2, title: 'Newer', timestamp: now - 1, pinned: false },
                    { tid: 3, title: 'Newest', timestamp: now, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                const todayGroup = result.find(g => g.label === 'Today');
                assert(todayGroup);
                assert.strictEqual(todayGroup.topics[0].tid, 3);
                assert.strictEqual(todayGroup.topics[1].tid, 2);
                assert.strictEqual(todayGroup.topics[2].tid, 1);
            });

            it('should sort pinned topics by timestamp descending', () => {
                const now = Date.now();
                const topicList = [
                    { tid: 1, title: 'Old pin', timestamp: now - 1, pinned: true },
                    { tid: 2, title: 'New pin', timestamp: now, pinned: true },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                assert.strictEqual(result[0].label, 'Pinned');
                assert.strictEqual(result[0].topics[0].tid, 2);
                assert.strictEqual(result[0].topics[1].tid, 1);
            });
        });

        describe('topics spanning multiple weeks', () => {
            it('should distribute topics across correct week groups', () => {
                const now = Date.now();
                const mondayThisWeek = getWeekStartMonday(now);
                const lastWeekWednesday = mondayThisWeek.getTime() - ONE_DAY * 5 + ONE_HOUR * 12;
                const threeWeeksAgo = now - ONE_DAY * 21;

                const topicList = [
                    { tid: 1, title: 'Today', timestamp: now, pinned: false },
                    { tid: 2, title: 'Yesterday', timestamp: now - ONE_DAY, pinned: false },
                    { tid: 3, title: 'Last week', timestamp: lastWeekWednesday, pinned: false },
                    { tid: 4, title: 'Three weeks ago', timestamp: threeWeeksAgo, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                const labels = result.map(g => g.label);
                assert(labels.includes('Today'), 'Should have Today group');
                assert(labels.includes('Yesterday'), 'Should have Yesterday group');
                assert(
                    labels.includes('Last Week') || labels.some(l => l.includes('/')),
                    'Should have Last Week or date range group'
                );
                assert(result.length >= 3, `Expected at least 3 groups, got ${result.length}`);
            });

            it('should produce correct group structure: { label: string, topics: Array }', () => {
                const now = Date.now();
                const topicList = [
                    { tid: 1, title: 'Test', timestamp: now, pinned: false },
                ];
                const result = dateGrouping.groupTopicsByDateRange(topicList);
                result.forEach((group) => {
                    assert(typeof group.label === 'string', 'label should be a string');
                    assert(Array.isArray(group.topics), 'topics should be an array');
                    group.topics.forEach((topic) => {
                        assert(topic.tid !== undefined, 'each topic should have a tid');
                        assert(topic.timestamp !== undefined, 'each topic should have a timestamp');
                    });
                });
            });
        });
    });

    // =========================================================================
    // Grouped View User Setting Tests 
    // =========================================================================
    describe('User Setting: categoryGroupedView', () => {
        it('should default categoryGroupedView to true for new users', async () => {
            const newUid = await user.create({ username: 'groupeddefaultuser' });
            const settings = await user.getSettings(newUid);
            assert.strictEqual(settings.categoryGroupedView, true);
        });

        it('should persist categoryGroupedView=false across getSettings calls', async () => {
            const uid = await user.create({ username: 'groupedpersistuser' });
            await user.saveSettings(uid, {
                categoryGroupedView: 0,
                postsPerPage: 20,
                topicsPerPage: 20,
            });
            const settings = await user.getSettings(uid);
            assert.strictEqual(settings.categoryGroupedView, false);
        });

        it('should persist categoryGroupedView=true after re-enabling', async () => {
            const uid = await user.create({ username: 'groupedreenableuser' });
            await user.saveSettings(uid, {
                categoryGroupedView: 0,
                postsPerPage: 20,
                topicsPerPage: 20,
            });
            await user.saveSettings(uid, {
                categoryGroupedView: 1,
                postsPerPage: 20,
                topicsPerPage: 20,
            });
            const settings = await user.getSettings(uid);
            assert.strictEqual(settings.categoryGroupedView, true);
        });

        it('should persist to the database (survives fresh getSettings call)', async () => {
            const uid = await user.create({ username: 'groupeddbuser' });
            await user.saveSettings(uid, {
                categoryGroupedView: 0,
                postsPerPage: 20,
                topicsPerPage: 20,
            });
            const raw = await db.getObjectField(`user:${uid}:settings`, 'categoryGroupedView');
            assert.strictEqual(String(raw), '0');
        });

        it('should update categoryGroupedView via PUT /users/{uid}/settings API', async () => {
            const request = require('../../src/request');
            const { response, body } = await request.put(
                `${nconf.get('url')}/api/v3/users/${adminUid}/settings`,
                {
                    jar: adminJar,
                    headers: { 'x-csrf-token': csrf_token },
                    body: {
                        settings: { categoryGroupedView: 0 },
                    },
                }
            );
            assert.strictEqual(response.statusCode, 200);

            const settings = await user.getSettings(adminUid);
            assert.strictEqual(settings.categoryGroupedView, false);

            await request.put(
                `${nconf.get('url')}/api/v3/users/${adminUid}/settings`,
                {
                    jar: adminJar,
                    headers: { 'x-csrf-token': csrf_token },
                    body: {
                        settings: { categoryGroupedView: 1 },
                    },
                }
            );
        });
    });

    // =========================================================================
    // Grouped Topics API Response in categoriesAPI.getTopics
    // =========================================================================
    describe('categoriesAPI.getTopics grouped response', () => {
        before(async () => {
            for (let i = 0; i < 3; i++) {
                // eslint-disable-next-line no-await-in-loop
                await topics.post({
                    uid: adminUid,
                    cid: categoryObj.cid,
                    title: `Grouped Test Topic ${i}`,
                    content: `Content for grouped test topic ${i}`,
                });
            }
        });

        it('should return grouped:true and dateGroups when categoryGroupedView is enabled', async () => {
            await user.saveSettings(adminUid, {
                categoryGroupedView: 1,
                postsPerPage: 20,
                topicsPerPage: 20,
            });

            const result = await api.categories.getTopics(
                { uid: adminUid },
                { cid: categoryObj.cid, after: 0, query: {} }
            );

            assert.strictEqual(result.grouped, true);
            assert(Array.isArray(result.dateGroups), 'dateGroups should be an array');
            assert(result.dateGroups.length > 0, 'dateGroups should not be empty');
        });

        it('should have dateGroups items with shape { label: string, topics: Array }', async () => {
            await user.saveSettings(adminUid, {
                categoryGroupedView: 1,
                postsPerPage: 20,
                topicsPerPage: 20,
            });

            const result = await api.categories.getTopics(
                { uid: adminUid },
                { cid: categoryObj.cid, after: 0, query: {} }
            );

            result.dateGroups.forEach((group) => {
                assert(typeof group.label === 'string', `label should be string, got ${typeof group.label}`);
                assert(Array.isArray(group.topics), `topics should be array, got ${typeof group.topics}`);
                group.topics.forEach((topic) => {
                    assert(topic.tid, 'each topic should have a tid');
                });
            });
        });

        it('should place pinned topics first in dateGroups when they exist', async () => {
            const pinnedResult = await topics.post({
                uid: adminUid,
                cid: categoryObj.cid,
                title: 'Pinned Grouped Topic',
                content: 'This topic is pinned',
            });
            await topics.tools.pin(pinnedResult.topicData.tid, adminUid);

            await user.saveSettings(adminUid, {
                categoryGroupedView: 1,
                postsPerPage: 20,
                topicsPerPage: 20,
            });

            const result = await api.categories.getTopics(
                { uid: adminUid },
                { cid: categoryObj.cid, after: 0, query: {} }
            );

            assert.strictEqual(result.grouped, true);
            assert.strictEqual(result.dateGroups[0].label, 'Pinned');
            assert(result.dateGroups[0].topics.length >= 1);

            await topics.tools.unpin(pinnedResult.topicData.tid, adminUid);
        });

        it('should return grouped:false and no dateGroups when categoryGroupedView is disabled', async () => {
            await user.saveSettings(adminUid, {
                categoryGroupedView: 0,
                postsPerPage: 20,
                topicsPerPage: 20,
            });

            const result = await api.categories.getTopics(
                { uid: adminUid },
                { cid: categoryObj.cid, after: 0, query: {} }
            );

            assert.strictEqual(result.grouped, false);
            assert.strictEqual(result.dateGroups, undefined);
            assert(Array.isArray(result.topics), 'flat topics array should be present');

            await user.saveSettings(adminUid, {
                categoryGroupedView: 1,
                postsPerPage: 20,
                topicsPerPage: 20,
            });
        });

        it('should include privileges in the response regardless of grouped state', async () => {
            const result = await api.categories.getTopics(
                { uid: adminUid },
                { cid: categoryObj.cid, after: 0, query: {} }
            );

            assert(result.privileges, 'response should include privileges');
            assert(typeof result.privileges === 'object');
        });
    });

    // =========================================================================
    // Collapsible Date Sections (Template/UI via API response)
    // =========================================================================
    describe('Category page grouped topics rendering', () => {
        before(async () => {
            await user.saveSettings(adminUid, {
                categoryGroupedView: 1,
                postsPerPage: 20,
                topicsPerPage: 20,
            });

            const existing = await api.categories.getTopics(
                { uid: adminUid },
                { cid: categoryObj.cid, after: 0, query: {} }
            );
            if (!existing.dateGroups || existing.dateGroups.length === 0) {
                await topics.post({
                    uid: adminUid,
                    cid: categoryObj.cid,
                    title: 'Rendering Test Topic',
                    content: 'Content for rendering test',
                });
            }
        });

        it('should return grouped=true in the category API response', async () => {
            const request = require('../../src/request');
            const { response, body } = await request.get(
                `${nconf.get('url')}/api/category/${categoryObj.slug}`,
                { jar: adminJar }
            );
            assert.strictEqual(response.statusCode, 200);
            assert.strictEqual(body.grouped, true);
        });

        it('should include dateGroups array in category API response', async () => {
            const request = require('../../src/request');
            const { body } = await request.get(
                `${nconf.get('url')}/api/category/${categoryObj.slug}`,
                { jar: adminJar }
            );
            assert(Array.isArray(body.dateGroups), 'dateGroups should be an array');
            assert(body.dateGroups.length > 0, 'dateGroups should not be empty');
        });

        it('should have each dateGroup with a label and topics array', async () => {
            const request = require('../../src/request');
            const { body } = await request.get(
                `${nconf.get('url')}/api/category/${categoryObj.slug}`,
                { jar: adminJar }
            );
            body.dateGroups.forEach((group) => {
                assert(typeof group.label === 'string', 'group label should be a string');
                assert(Array.isArray(group.topics), 'group topics should be an array');
                assert(group.topics.length > 0, `group "${group.label}" should have at least one topic`);
            });
        });

        it('should render "Pinned" group first when pinned topics exist', async () => {
            const pinResult = await topics.post({
                uid: adminUid,
                cid: categoryObj.cid,
                title: 'UI Pinned Topic',
                content: 'Pinned content for UI test',
            });
            await topics.tools.pin(pinResult.topicData.tid, adminUid);

            const request = require('../../src/request');
            const { body } = await request.get(
                `${nconf.get('url')}/api/category/${categoryObj.slug}`,
                { jar: adminJar }
            );

            assert.strictEqual(body.dateGroups[0].label, 'Pinned');
            assert(body.dateGroups[0].topics.some(t => t.tid === pinResult.topicData.tid));

            await topics.tools.unpin(pinResult.topicData.tid, adminUid);
        });

        it('should still include flat topics array alongside dateGroups', async () => {
            const request = require('../../src/request');
            const { body } = await request.get(
                `${nconf.get('url')}/api/category/${categoryObj.slug}`,
                { jar: adminJar }
            );
            assert(Array.isArray(body.topics), 'flat topics array should still exist');
            assert(body.topics.length > 0);
        });

        it('should not include dateGroups when grouped view is disabled', async () => {
            await user.saveSettings(adminUid, {
                categoryGroupedView: 0,
                postsPerPage: 20,
                topicsPerPage: 20,
            });

            const request = require('../../src/request');
            const { body } = await request.get(
                `${nconf.get('url')}/api/category/${categoryObj.slug}`,
                { jar: adminJar }
            );

            assert.strictEqual(body.grouped, false);
            assert.strictEqual(body.dateGroups, undefined);
            assert(Array.isArray(body.topics));

            await user.saveSettings(adminUid, {
                categoryGroupedView: 1,
                postsPerPage: 20,
                topicsPerPage: 20,
            });
        });

        it('should have each topic in dateGroups contain standard topic fields', async () => {
            const request = require('../../src/request');
            const { body } = await request.get(
                `${nconf.get('url')}/api/category/${categoryObj.slug}`,
                { jar: adminJar }
            );

            const requiredFields = ['tid', 'uid', 'cid', 'title', 'slug', 'timestamp', 'postcount'];
            body.dateGroups.forEach((group) => {
                group.topics.forEach((topic) => {
                    requiredFields.forEach((field) => {
                        assert(
                            topic.hasOwnProperty(field),
                            `topic ${topic.tid} in group "${group.label}" missing field "${field}"`
                        );
                    });
                });
            });
        });
    });
});