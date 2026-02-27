'use strict';

/**
 * Groups topics by date ranges (Pinned, Today, Yesterday, This Week, etc.)
 * @param {Array} topics - Array of topic objects with timestamp and pinned fields
 * @returns {Array} Array of group objects with label and topics
 */
function groupTopicsByDateRange(topics) {
	if (!Array.isArray(topics) || topics.length === 0) {
		return [];
	}

	const groups = [];
	const pinnedTopics = [];
	const regularTopics = [];

	// Step 1: Separate pinned from regular topics
	topics.forEach((topic) => {
		if (topic.pinned) {
			pinnedTopics.push(topic);
		} else {
			regularTopics.push(topic);
		}
	});

	// Step 2: Add pinned group if any pinned topics exist
	if (pinnedTopics.length > 0) {
		groups.push({
			label: 'Pinned',
			topics: sortTopicsByTime(pinnedTopics),
		});
	}

	// Step 3: Group regular topics by date ranges
	const dateGroups = groupByDateRanges(regularTopics);
	groups.push(...dateGroups);

	return groups;
}

function sortTopicsByTime(topics) {
	// Sort by timestamp, most recent first
	return topics.sort((a, b) => b.timestamp - a.timestamp);
}

function groupByDateRanges(topics) {
	if (topics.length === 0) {
		return [];
	}

	const now = Date.now();
	const dateMap = new Map();

	// Categorize each topic by date range
	topics.forEach((topic) => {
		const label = getDateRangeLabel(topic.timestamp, now);
		if (!dateMap.has(label)) {
			dateMap.set(label, []);
		}
		dateMap.get(label).push(topic);
	});

	// Convert map to array and sort topics within each group
	const groups = [];
	const orderedLabels = getOrderedLabels(Array.from(dateMap.keys()), now);

	orderedLabels.forEach((label) => {
		if (dateMap.has(label)) {
			groups.push({
				label: label,
				topics: sortTopicsByTime(dateMap.get(label)),
			});
		}
	});

	return groups;
}

function getDateRangeLabel(timestamp, now) {
	const topicDate = new Date(timestamp);
	const currentDate = new Date(now);

	// Reset hours for day comparison
	const topicDayStart = new Date(topicDate.getFullYear(), topicDate.getMonth(), topicDate.getDate());
	const currentDayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

	const daysDiff = Math.floor((currentDayStart - topicDayStart) / (1000 * 60 * 60 * 24));

	// Future dates or Today
	if (daysDiff <= 0) {
		return 'Today';
	}

	// Yesterday
	if (daysDiff === 1) {
		return 'Yesterday';
	}

	// This Week (Monday-Sunday, current week)
	const currentWeekStart = getWeekStart(currentDate);
	if (topicDayStart >= currentWeekStart && daysDiff > 1) {
		return 'This Week';
	}

	// Last Week
	const lastWeekStart = new Date(currentWeekStart);
	lastWeekStart.setDate(lastWeekStart.getDate() - 7);
	if (topicDayStart >= lastWeekStart && topicDayStart < currentWeekStart) {
		return 'Last Week';
	}

	// Older weeks: format as "M/D-M/D"
	const weekStart = getWeekStart(topicDate);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 6);

	return formatWeekRange(weekStart, weekEnd);
}

function getWeekStart(date) {
	const d = new Date(date);
	const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
	const diff = day === 0 ? -6 : 1 - day; // Adjust so Monday is start of week
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function formatWeekRange(startDate, endDate) {
	const startMonth = startDate.getMonth() + 1;
	const startDay = startDate.getDate();
	const endMonth = endDate.getMonth() + 1;
	const endDay = endDate.getDate();
	const startYear = startDate.getFullYear();
	const endYear = endDate.getFullYear();

	// If years are different, include year
	if (startYear !== endYear) {
		return `${startMonth}/${startDay}/${String(startYear).slice(-2)}-${endMonth}/${endDay}/${String(endYear).slice(-2)}`;
	}

	// Same year
	return `${startMonth}/${startDay}-${endMonth}/${endDay}`;
}

function getOrderedLabels(labels, now) {
	// Define the standard order
	const standardOrder = ['Today', 'Yesterday', 'This Week', 'Last Week'];
	const weekRanges = [];
	const currentDate = new Date(now);

	labels.forEach((label) => {
		if (!standardOrder.includes(label)) {
			weekRanges.push(label);
		}
	});

	// Sort week ranges by date (most recent first)
	weekRanges.sort((a, b) => {
		const dateA = parseWeekRangeStart(a, currentDate.getFullYear());
		const dateB = parseWeekRangeStart(b, currentDate.getFullYear());
		return dateB - dateA;
	});

	// Combine in order
	const result = [];
	standardOrder.forEach((label) => {
		if (labels.includes(label)) {
			result.push(label);
		}
	});
	result.push(...weekRanges);

	return result;
}

function parseWeekRangeStart(label, currentYear) {
	// Parse "M/D-M/D" or "M/D/YY-M/D/YY" format
	const parts = label.split('-')[0].split('/');
	const month = parseInt(parts[0], 10) - 1;
	const day = parseInt(parts[1], 10);
	let year = currentYear;

	if (parts.length === 3) {
		year = 2000 + parseInt(parts[2], 10);
	}

	return new Date(year, month, day);
}

module.exports = {
	groupTopicsByDateRange,
};