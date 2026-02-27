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

### Mark as answer

- dropdown tool rendering process checks if the original post was made by the user and if the topic is a question before allowing user to mark post as endorsed
  probably run through the upvote code logic

just have a title status indicator for now, if resolved

top-level resolved: property, put the PID (link?)
