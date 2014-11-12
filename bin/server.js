
var gith = require("gith").create(7002)
,   fs = require("fs")
,   jn = require("path").join
,   git = require("../lib/git")
,   cnf = require("../lib/config")
,   man = require("../lib/manager")
,   rsync = require("../lib/rsync")
,   log = require("./log")
,   dataDir = jn(__dirname, "../data")
,   wantedFile = jn(dataDir, "wanted.json")
,   conf = cnf.readConfiguration()
;

// XXX
//  it would be worth detecting a deletion of a branch we are interested in
gith({})
    .on("file:all", function (payload) {
        // console.log(JSON.stringify(payload, null, 4));
        var branch = payload.branch, repo = payload.repo;
        if (!branch || !repo) return;
        log.info("Hook for " + repo + ", branch " + branch);
        var wanted = JSON.parse(fs.readFileSync(wantedFile, "utf8"));
        if (!wanted[repo]) return;
        if (!wanted[repo].branches[branch]) return;
        function done () {
            rsync.rsync({
                    from:   jn(dataDir, "publish/")
                ,   to:     conf.rsyncRemote + ":" + conf.rsyncPath
                ,   delete: true
                }
            ,   function (err) {
                    if (err) return log.error(err);
                    log.info("Hook of "+ repo + "#" + branch + " OK!");
                }
            );
        }
        var currentCommon
        ,   regen = wanted[repo].regen
        ;
        log.info("Hook regen mode: " + (regen || "default"));
        if (regen === "extracted") currentCommon = man.commonRepositories();
        // what was that promises thing people were talking about?
        git.cloneOrFetch(conf.repoTmpl.replace("{repo}", repo), jn(dataDir, "gits", repo), function (err) {
            if (err) return log.error(err);
            git.publish(jn(dataDir, "gits", repo), branch, jn(dataDir, "publish", wanted[repo].branches[branch]), function (err) {
                if (err) return log.error(err);
                if (regen === "all") {
                    var commonRepositories = man.commonRepositories();
                    man.getRepositories(commonRepositories, conf, function (err) {
                        if (err) return log.error(err);
                        man.publishRepositories(commonRepositories, conf, function (err) {
                            if (err) return log.error(err);
                            man.bikeshedRepositories(commonRepositories, conf, function (err) {
                                if (err) return log.error(err);
                                done();
                            });
                        });
                    });
                }
                else if (regen === "extracted") {
                    // XXX
                    //  this is not actually what we want
                    //  we want repo#branch pairs, that's our unit of work
                    
                    var newCommon = man.commonRepositories()
                    ,   oldCache = []
                    ,   newCache = []
                    ,   cacheMap = {}
                    ,   repoCache = function (arr) {
                            return function (repo) {
                                for (var k in repo.branches) {
                                    var str = repo.repository + "#" + k;
                                    arr.push(str);
                                    cacheMap[str] = repo.branches[k];
                                }
                            };
                        }
                    ;
                    currentCommon.forEach(repoCache(oldCache));
                    newCommon.forEach(repoCache(newCache));
                    var deletedRepos = oldCache.filter(function (it) { return newCache.indexOf(it) === -1; })
                    ,   newRepos = newCache.filter(function (it) { return oldCache.indexOf(it) === -1; })
                    ,   delFile = jn(dataDir, "deleted.json")
                    ;
                    if (deletedRepos.length) {
                        var delList = [];
                        if (fs.existsSync(delFile)) delList = JSON.parse(fs.readFileSync(delFile, "utf8"));
                        fs.writeFileSync(delFile, JSON.stringify(delList.concat(deletedRepos), null, 4), { encoding: "utf8" });
                        deletedRepos.forEach(function (it) {
                            var parts = it.split("#", 2)
                            ,   repo = parts[0]
                            ,   branch = parts[1]
                            ;
                            if (wanted[repo]) {
                                if (wanted[repo].branches[branch]) {
                                    delete wanted[repo].branches[branch];
                                    if (!Object.keys(wanted[repo].branches).length) delete wanted[repo];
                                }
                            }
                        });
                        fs.writeFileSync(wantedFile, JSON.stringify(wanted, null, 4), { encoding: "utf8" });
                    }
                    if (newRepos.length) {
                        var reposAsWanted = [];
                        newRepos.forEach(function (it) {
                            var parts = it.split("#", 2)
                            ,   repo = parts[0]
                            ,   branch = parts[1]
                            ,   obj = {
                                    repository: repo
                                ,   branches:   {}
                                }
                            ;
                            obj.branches[branch] = cacheMap[it];
                            reposAsWanted.push(obj);
                            if (!wanted[repo]) wanted[repo] = { branches: {} };
                            wanted[repo].branches[branch] = cacheMap[it];
                        });
                        fs.writeFileSync(wantedFile, JSON.stringify(wanted, null, 4), { encoding: "utf8" });
                        man.getRepositories(reposAsWanted, conf, function (err) {
                            if (err) return log.error(err);
                            man.publishRepositories(reposAsWanted, conf, function (err) {
                                if (err) return log.error(err);
                                man.bikeshedRepositories(reposAsWanted, conf, function (err) {
                                    if (err) return log.error(err);
                                    done();
                                });
                            });
                        });
                    }
                }
                else {
                    done();
                }
            });
        });
    })
;

// gith.payload({
//   "ref": "refs/heads/gh-pages",
//   "before": "4d2ab4e76d0d405d17d1a0f2b8a6071394e3ab40",
//   "after": "7700ca29dd050d9adacc0803f866d9b539513535",
//   "created": false,
//   "deleted": false,
//   "forced": false,
//   "base_ref": null,
//   "compare": "https://github.com/baxterthehacker/public-repo/compare/4d2ab4e76d0d...7700ca29dd05",
//   "commits": [
//     {
//       "id": "7700ca29dd050d9adacc0803f866d9b539513535",
//       "distinct": true,
//       "message": "Trigger pages build",
//       "timestamp": "2014-10-09T17:10:36-07:00",
//       "url": "https://github.com/baxterthehacker/public-repo/commit/7700ca29dd050d9adacc0803f866d9b539513535",
//       "author": {
//         "name": "Kyle Daigle",
//         "email": "kyle.daigle@github.com",
//         "username": "kdaigle"
//       },
//       "committer": {
//         "name": "Kyle Daigle",
//         "email": "kyle.daigle@github.com",
//         "username": "kdaigle"
//       },
//       "added": [
// 
//       ],
//       "removed": [
// 
//       ],
//       "modified": [
//         "index.html"
//       ]
//     }
//   ],
//   "head_commit": {
//     "id": "7700ca29dd050d9adacc0803f866d9b539513535",
//     "distinct": true,
//     "message": "Trigger pages build",
//     "timestamp": "2014-10-09T17:10:36-07:00",
//     "url": "https://github.com/baxterthehacker/public-repo/commit/7700ca29dd050d9adacc0803f866d9b539513535",
//     "author": {
//       "name": "Kyle Daigle",
//       "email": "kyle.daigle@github.com",
//       "username": "kdaigle"
//     },
//     "committer": {
//       "name": "Kyle Daigle",
//       "email": "kyle.daigle@github.com",
//       "username": "kdaigle"
//     },
//     "added": [
// 
//     ],
//     "removed": [
// 
//     ],
//     "modified": [
//       "index.html"
//     ]
//   },
//   "repository": {
//     "id": 20000106,
//     "name": "public-repo",
//     "full_name": "baxterthehacker/public-repo",
//     "owner": {
//       "name": "baxterthehacker",
//       "email": "baxterthehacker@users.noreply.github.com"
//     },
//     "private": false,
//     "html_url": "https://github.com/baxterthehacker/public-repo",
//     "description": "",
//     "fork": false,
//     "url": "https://github.com/baxterthehacker/public-repo",
//     "forks_url": "https://api.github.com/repos/baxterthehacker/public-repo/forks",
//     "keys_url": "https://api.github.com/repos/baxterthehacker/public-repo/keys{/key_id}",
//     "collaborators_url": "https://api.github.com/repos/baxterthehacker/public-repo/collaborators{/collaborator}",
//     "teams_url": "https://api.github.com/repos/baxterthehacker/public-repo/teams",
//     "hooks_url": "https://api.github.com/repos/baxterthehacker/public-repo/hooks",
//     "issue_events_url": "https://api.github.com/repos/baxterthehacker/public-repo/issues/events{/number}",
//     "events_url": "https://api.github.com/repos/baxterthehacker/public-repo/events",
//     "assignees_url": "https://api.github.com/repos/baxterthehacker/public-repo/assignees{/user}",
//     "branches_url": "https://api.github.com/repos/baxterthehacker/public-repo/branches{/branch}",
//     "tags_url": "https://api.github.com/repos/baxterthehacker/public-repo/tags",
//     "blobs_url": "https://api.github.com/repos/baxterthehacker/public-repo/git/blobs{/sha}",
//     "git_tags_url": "https://api.github.com/repos/baxterthehacker/public-repo/git/tags{/sha}",
//     "git_refs_url": "https://api.github.com/repos/baxterthehacker/public-repo/git/refs{/sha}",
//     "trees_url": "https://api.github.com/repos/baxterthehacker/public-repo/git/trees{/sha}",
//     "statuses_url": "https://api.github.com/repos/baxterthehacker/public-repo/statuses/{sha}",
//     "languages_url": "https://api.github.com/repos/baxterthehacker/public-repo/languages",
//     "stargazers_url": "https://api.github.com/repos/baxterthehacker/public-repo/stargazers",
//     "contributors_url": "https://api.github.com/repos/baxterthehacker/public-repo/contributors",
//     "subscribers_url": "https://api.github.com/repos/baxterthehacker/public-repo/subscribers",
//     "subscription_url": "https://api.github.com/repos/baxterthehacker/public-repo/subscription",
//     "commits_url": "https://api.github.com/repos/baxterthehacker/public-repo/commits{/sha}",
//     "git_commits_url": "https://api.github.com/repos/baxterthehacker/public-repo/git/commits{/sha}",
//     "comments_url": "https://api.github.com/repos/baxterthehacker/public-repo/comments{/number}",
//     "issue_comment_url": "https://api.github.com/repos/baxterthehacker/public-repo/issues/comments/{number}",
//     "contents_url": "https://api.github.com/repos/baxterthehacker/public-repo/contents/{+path}",
//     "compare_url": "https://api.github.com/repos/baxterthehacker/public-repo/compare/{base}...{head}",
//     "merges_url": "https://api.github.com/repos/baxterthehacker/public-repo/merges",
//     "archive_url": "https://api.github.com/repos/baxterthehacker/public-repo/{archive_format}{/ref}",
//     "downloads_url": "https://api.github.com/repos/baxterthehacker/public-repo/downloads",
//     "issues_url": "https://api.github.com/repos/baxterthehacker/public-repo/issues{/number}",
//     "pulls_url": "https://api.github.com/repos/baxterthehacker/public-repo/pulls{/number}",
//     "milestones_url": "https://api.github.com/repos/baxterthehacker/public-repo/milestones{/number}",
//     "notifications_url": "https://api.github.com/repos/baxterthehacker/public-repo/notifications{?since,all,participating}",
//     "labels_url": "https://api.github.com/repos/baxterthehacker/public-repo/labels{/name}",
//     "releases_url": "https://api.github.com/repos/baxterthehacker/public-repo/releases{/id}",
//     "created_at": 1400625583,
//     "updated_at": "2014-07-25T16:37:51Z",
//     "pushed_at": 1412899789,
//     "git_url": "git://github.com/baxterthehacker/public-repo.git",
//     "ssh_url": "git@github.com:baxterthehacker/public-repo.git",
//     "clone_url": "https://github.com/baxterthehacker/public-repo.git",
//     "svn_url": "https://github.com/baxterthehacker/public-repo",
//     "homepage": null,
//     "size": 665,
//     "stargazers_count": 0,
//     "watchers_count": 0,
//     "language": null,
//     "has_issues": true,
//     "has_downloads": true,
//     "has_wiki": true,
//     "has_pages": true,
//     "forks_count": 0,
//     "mirror_url": null,
//     "open_issues_count": 24,
//     "forks": 0,
//     "open_issues": 24,
//     "watchers": 0,
//     "default_branch": "master",
//     "stargazers": 0,
//     "master_branch": "master"
//   },
//   "pusher": {
//     "name": "baxterthehacker",
//     "email": "baxterthehacker@users.noreply.github.com"
//   },
//   "sender": {
//     "login": "baxterthehacker",
//     "id": 6752317,
//     "avatar_url": "https://avatars.githubusercontent.com/u/6752317?v=2",
//     "gravatar_id": "",
//     "url": "https://api.github.com/users/baxterthehacker",
//     "html_url": "https://github.com/baxterthehacker",
//     "followers_url": "https://api.github.com/users/baxterthehacker/followers",
//     "following_url": "https://api.github.com/users/baxterthehacker/following{/other_user}",
//     "gists_url": "https://api.github.com/users/baxterthehacker/gists{/gist_id}",
//     "starred_url": "https://api.github.com/users/baxterthehacker/starred{/owner}{/repo}",
//     "subscriptions_url": "https://api.github.com/users/baxterthehacker/subscriptions",
//     "organizations_url": "https://api.github.com/users/baxterthehacker/orgs",
//     "repos_url": "https://api.github.com/users/baxterthehacker/repos",
//     "events_url": "https://api.github.com/users/baxterthehacker/events{/privacy}",
//     "received_events_url": "https://api.github.com/users/baxterthehacker/received_events",
//     "type": "User",
//     "site_admin": false
//   }
// });
