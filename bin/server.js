#!/usr/bin/env node

var gith = require("gith").create(7002)
,   fs = require("fs")
,   jn = require("path").join
,   man = require("../lib/manager")
,   log = require("../lib/log")
,   queue = require("../lib/queue")
,   dataDir = jn(__dirname, "../data")
,   wantedFile = jn(dataDir, "wanted.json")
,   pollInterval = 1000 * 10 // 10 seconds, this is slow, may need to increase later
;

// XXX
//  it would be worth detecting a deletion of a branch we are interested in
gith({})
    .on("file:all", function (payload) {
        var branch = payload.branch, repo = payload.repo;
        log.info("Processing request for " + repo + "#" + branch);
        if (!branch || !repo) return;
        log.info("Hook for " + repo + ", branch " + branch);
        var wanted = JSON.parse(fs.readFileSync(wantedFile, "utf8"));
        if (!wanted[repo]) return;
        if (!wanted[repo].branches[branch]) return;
        var stamp = queue.enqueue(repo, branch);
        log.info("Queued " + stamp + " for processing.");
    })
;

function poll () {
    var next = queue.next();
    if (!next) return setInterval(poll, pollInterval);
    log.info("Found item in queue, processing " + JSON.stringify(next));
    man.processRepository(next, function (err) {
        if (err) log.error(err);
        process.nextTick(poll);
    });
}
poll();

// gith.payload({
//   "ref": "refs/heads/master",
//   "before": "73de039b5d3b4938f1517ab5f940476762c66c0d",
//   "after": "bf85cb313401ff660d09ec937d09c5e9d627f5f5",
//   "created": false,
//   "deleted": false,
//   "forced": false,
//   "base_ref": null,
//   "compare": "https://github.com/webspecs/html-aria/compare/73de039b5d3b...bf85cb313401",
//   "commits": [
//     {
//       "id": "bf85cb313401ff660d09ec937d09c5e9d627f5f5",
//       "distinct": true,
//       "message": "Testing hook",
//       "timestamp": "2014-11-13T16:50:04+01:00",
//       "url": "https://github.com/webspecs/html-aria/commit/bf85cb313401ff660d09ec937d09c5e9d627f5f5",
//       "author": {
//         "name": "Robin Berjon",
//         "email": "robin@berjon.com",
//         "username": "darobin"
//       },
//       "committer": {
//         "name": "Robin Berjon",
//         "email": "robin@berjon.com",
//         "username": "darobin"
//       },
//       "added": [
// 
//       ],
//       "removed": [
// 
//       ],
//       "modified": [
//         "index.bs"
//       ]
//     }
//   ],
//   "head_commit": {
//     "id": "bf85cb313401ff660d09ec937d09c5e9d627f5f5",
//     "distinct": true,
//     "message": "Testing hook",
//     "timestamp": "2014-11-13T16:50:04+01:00",
//     "url": "https://github.com/webspecs/html-aria/commit/bf85cb313401ff660d09ec937d09c5e9d627f5f5",
//     "author": {
//       "name": "Robin Berjon",
//       "email": "robin@berjon.com",
//       "username": "darobin"
//     },
//     "committer": {
//       "name": "Robin Berjon",
//       "email": "robin@berjon.com",
//       "username": "darobin"
//     },
//     "added": [
// 
//     ],
//     "removed": [
// 
//     ],
//     "modified": [
//       "index.bs"
//     ]
//   },
//   "repository": {
//     "id": 26213514,
//     "name": "html-aria",
//     "full_name": "webspecs/html-aria",
//     "owner": {
//       "name": "webspecs",
//       "email": ""
//     },
//     "private": false,
//     "html_url": "https://github.com/webspecs/html-aria",
//     "description": "Specifies implementer and author stuff for ARIA in HTML",
//     "fork": false,
//     "url": "https://github.com/webspecs/html-aria",
//     "forks_url": "https://api.github.com/repos/webspecs/html-aria/forks",
//     "keys_url": "https://api.github.com/repos/webspecs/html-aria/keys{/key_id}",
//     "collaborators_url": "https://api.github.com/repos/webspecs/html-aria/collaborators{/collaborator}",
//     "teams_url": "https://api.github.com/repos/webspecs/html-aria/teams",
//     "hooks_url": "https://api.github.com/repos/webspecs/html-aria/hooks",
//     "issue_events_url": "https://api.github.com/repos/webspecs/html-aria/issues/events{/number}",
//     "events_url": "https://api.github.com/repos/webspecs/html-aria/events",
//     "assignees_url": "https://api.github.com/repos/webspecs/html-aria/assignees{/user}",
//     "branches_url": "https://api.github.com/repos/webspecs/html-aria/branches{/branch}",
//     "tags_url": "https://api.github.com/repos/webspecs/html-aria/tags",
//     "blobs_url": "https://api.github.com/repos/webspecs/html-aria/git/blobs{/sha}",
//     "git_tags_url": "https://api.github.com/repos/webspecs/html-aria/git/tags{/sha}",
//     "git_refs_url": "https://api.github.com/repos/webspecs/html-aria/git/refs{/sha}",
//     "trees_url": "https://api.github.com/repos/webspecs/html-aria/git/trees{/sha}",
//     "statuses_url": "https://api.github.com/repos/webspecs/html-aria/statuses/{sha}",
//     "languages_url": "https://api.github.com/repos/webspecs/html-aria/languages",
//     "stargazers_url": "https://api.github.com/repos/webspecs/html-aria/stargazers",
//     "contributors_url": "https://api.github.com/repos/webspecs/html-aria/contributors",
//     "subscribers_url": "https://api.github.com/repos/webspecs/html-aria/subscribers",
//     "subscription_url": "https://api.github.com/repos/webspecs/html-aria/subscription",
//     "commits_url": "https://api.github.com/repos/webspecs/html-aria/commits{/sha}",
//     "git_commits_url": "https://api.github.com/repos/webspecs/html-aria/git/commits{/sha}",
//     "comments_url": "https://api.github.com/repos/webspecs/html-aria/comments{/number}",
//     "issue_comment_url": "https://api.github.com/repos/webspecs/html-aria/issues/comments/{number}",
//     "contents_url": "https://api.github.com/repos/webspecs/html-aria/contents/{+path}",
//     "compare_url": "https://api.github.com/repos/webspecs/html-aria/compare/{base}...{head}",
//     "merges_url": "https://api.github.com/repos/webspecs/html-aria/merges",
//     "archive_url": "https://api.github.com/repos/webspecs/html-aria/{archive_format}{/ref}",
//     "downloads_url": "https://api.github.com/repos/webspecs/html-aria/downloads",
//     "issues_url": "https://api.github.com/repos/webspecs/html-aria/issues{/number}",
//     "pulls_url": "https://api.github.com/repos/webspecs/html-aria/pulls{/number}",
//     "milestones_url": "https://api.github.com/repos/webspecs/html-aria/milestones{/number}",
//     "notifications_url": "https://api.github.com/repos/webspecs/html-aria/notifications{?since,all,participating}",
//     "labels_url": "https://api.github.com/repos/webspecs/html-aria/labels{/name}",
//     "releases_url": "https://api.github.com/repos/webspecs/html-aria/releases{/id}",
//     "created_at": 1415181448,
//     "updated_at": "2014-11-05T09:57:28Z",
//     "pushed_at": 1415893805,
//     "git_url": "git://github.com/webspecs/html-aria.git",
//     "ssh_url": "git@github.com:webspecs/html-aria.git",
//     "clone_url": "https://github.com/webspecs/html-aria.git",
//     "svn_url": "https://github.com/webspecs/html-aria",
//     "homepage": null,
//     "size": 144,
//     "stargazers_count": 0,
//     "watchers_count": 0,
//     "language": null,
//     "has_issues": true,
//     "has_downloads": true,
//     "has_wiki": true,
//     "has_pages": false,
//     "forks_count": 0,
//     "mirror_url": null,
//     "open_issues_count": 0,
//     "forks": 0,
//     "open_issues": 0,
//     "watchers": 0,
//     "default_branch": "master",
//     "stargazers": 0,
//     "master_branch": "master",
//     "organization": "webspecs"
//   },
//   "pusher": {
//     "name": "darobin",
//     "email": "robin@berjon.com"
//   },
//   "organization": {
//     "login": "webspecs",
//     "id": 8255462,
//     "url": "https://api.github.com/orgs/webspecs",
//     "repos_url": "https://api.github.com/orgs/webspecs/repos",
//     "events_url": "https://api.github.com/orgs/webspecs/events",
//     "members_url": "https://api.github.com/orgs/webspecs/members{/member}",
//     "public_members_url": "https://api.github.com/orgs/webspecs/public_members{/member}",
//     "avatar_url": "https://avatars.githubusercontent.com/u/8255462?v=3"
//   },
//   "sender": {
//     "login": "darobin",
//     "id": 38491,
//     "avatar_url": "https://avatars.githubusercontent.com/u/38491?v=3",
//     "gravatar_id": "",
//     "url": "https://api.github.com/users/darobin",
//     "html_url": "https://github.com/darobin",
//     "followers_url": "https://api.github.com/users/darobin/followers",
//     "following_url": "https://api.github.com/users/darobin/following{/other_user}",
//     "gists_url": "https://api.github.com/users/darobin/gists{/gist_id}",
//     "starred_url": "https://api.github.com/users/darobin/starred{/owner}{/repo}",
//     "subscriptions_url": "https://api.github.com/users/darobin/subscriptions",
//     "organizations_url": "https://api.github.com/users/darobin/orgs",
//     "repos_url": "https://api.github.com/users/darobin/repos",
//     "events_url": "https://api.github.com/users/darobin/events{/privacy}",
//     "received_events_url": "https://api.github.com/users/darobin/received_events",
//     "type": "User",
//     "site_admin": false
//   }
// });
