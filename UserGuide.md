## Features

### TA/Instructor endorsement

A TA or instructor should be able to endorse posts and replies.

#### User Testing

1. Sign into the admin account
1. Make a new group called either `instructor` or `ta` (case-insensitive)
1. Upvote one of the posts
1. You should see a badge like the one below:
   ![alt text](readme-images/endorse-post.png)
   And if you've upvoted the first post in the topic, you should also see this on the category page:

   ![alt text](readme-images/endorse-topic.png)

#### Unit testing

Two new tests have been added to `test/posts.js`

The test `voting as normal user should have post be returned as not endorsed` upvotes a post as a regular user and checks that the post has not been endorsed.

The test `voting as ta should have post be returned as endorsed` has the user join a `ta` group first before upvoting the post. We then assert that the user has been added to the `endorsedVotes` list.

This covers the backend code changes

### TA/Instructor badges

This feature forces all users in the instructor and TA groups to have a badge (either TA or INSTRUCTOR) next to their replies and posts. By default, NodeBB does offer badges, but it's opt-in per user and is by-default disabled when a user joins a group. This change makes it by-default enabled and does not allow users to hide the badge once they've joined a group. (this restriction does not apply to groups not called "ta" or "instructor")

#### User Testing

1. Create a `ta` or `instructor` group
1. Click `Edit` to edit group settings
   ![alt text](readme-images/edit-group-settings.png)
1. Enable `Show Badge`. Feel free to customize the title, icon, and color of the badge.
   ![alt text](readme-images/show-badge.png)
1. Press Save Changes
1. You should now see the `TA` badge next to your username
   ![alt text](readme-images/ta-badge.png)

#### Unit Testing

In `test/user.js`, I wrote the test 'should force instructor group onto groupTitleArray even if user deselects it' to test functionality. We set up the test by creating and joining the groups `ta`, `instructor`, and `other-group`. The subsequent `User.updateProfile(testUid, { groupTitle: '[]', uid: testUid })` call is akin to the user going into their settings and setting the group badge display to be false for all groups. We then verify that when getting user data, the `ta` and `instructor` groups are still present in the `groupTitleArray` field. This test covers all of the changed lines of code.

### Date/Pinned Grouped Topic View

When enabled, this feature causes all topics on a category page to be organized into collapsible date sections instead of a flat list. Topics are grouped into buckets such as "Today", "Yesterday", "This Week", "Last Week", and older weeks displayed as date ranges (e.g., "1/1-1/7", "1/8-1/14", ect.). Pinned topics always appear in their own "Pinned" section at the top. Each section header shows a chevron icon, the group label, and a topic count. Clicking a header collapses or expands that section with an animation. All sections are expanded by default. The setting defaults to enabled for all new users and is persisted server-side.

#### User Testing

1. Navigate to your user settings page at `/user/<username>/settings`
2. Scroll to the **Browsing Settings** section
3. Confirm the "group-topics-by-date" toggle is present and checked by default
<img width="2206" height="592" alt="image" src="https://github.com/user-attachments/assets/c5ead5bb-d977-49fd-a1c3-f5f85104bc91" />
4. Navigate to any category page with topics
5. You should see topics organized under date group headers like "Today", "Yesterday", "This Week", ect.:
<img width="2754" height="1630" alt="image" src="https://github.com/user-attachments/assets/2334f78f-abd8-4f4f-96a8-2fe591768fea" />
6. Click a group header to collapse the section 
7. Click again to expand (topics should slide back down)
8. Pin a topic and it should appear under a "Pinned" section at the top of the list
<img width="2668" height="1598" alt="image" src="https://github.com/user-attachments/assets/fed4d666-7c7c-4788-b565-d6e5583cff06" />
9. Go back to settings and uncheck "group-topics-by-date" and save your settings
<img width="2202" height="602" alt="image" src="https://github.com/user-attachments/assets/7f7c663f-1215-449c-b1d4-c21e4d848019" />
10. Return to the category page and topics should now display as a standard flat list
<img width="2670" height="1584" alt="image" src="https://github.com/user-attachments/assets/c47707b9-3ff5-4146-9e5f-d6104b95bdfc" />

#### Unit Testing

Tests are split across two files:

**`test/topics/dateGrouping.js`** contains unit tests for the `groupTopicsByDateRange()` utility function in `src/topics/dateGrouping.js`. These tests verify:
- Empty, null, and undefined inputs return an empty array
- Pinned topics are separated into a "Pinned" group that appears first
- Topics are correctly bucketed into "Today", "Yesterday", "This Week", "Last Week", and older week ranges like "1/1-1/7", "1/8-1/14", ect
- Older week ranges use the `M/D-M/D` format without leading zeros
- Topics within each group are sorted by timestamp descending (most recent first)
- Mixed pinned and regular topics are handled correctly

**`test/topics/groupedTopics.js`** contains tests covering:
- **User setting persistence**: `categoryGroupedView` defaults to `true` for new users, persists `false` after being disabled, survives a fresh `getSettings()` call, and can be updated via the `PUT /api/v3/users/{uid}/settings` API endpoint
- **API response shape**: `categoriesAPI.getTopics()` returns `grouped: true` with a `dateGroups` array when the setting is enabled, and `grouped: false` with a flat `topics` array when disabled. Each `dateGroups` item has the shape `{ label: string, topics: Topic[] }`
- **Category page rendering**: the Read API response at `/api/category/{slug}` includes `grouped` and `dateGroups` fields, the "Pinned" group appears first when pinned topics exist, and each topic in `dateGroups` contains standard topic fields (`tid`, `uid`, `cid`, `title`, `slug`, `timestamp`, `postcount`)


