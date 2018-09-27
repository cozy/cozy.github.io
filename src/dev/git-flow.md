# Git Flow

We recommand to use the following git flow four our applications and konnectors.

## Development

`master` is the current state of the development.

Every commit must:

* provide a working application without introducing blocking regressions
* validate lint and unit tests

Every feature, improvement or fix is merged via a pull request.

For large features with huge impacts on the whole codebase, use feature branches, for example `feature/something-new`. A feature branch is merged into master when it's totally functional and validated.

## Releases

> TL;DR
>
> * Create release branch
> * Bump `master` version
> * Tag beta versions from release branch until it passes all tests
> * Tag stable version from release branch
> * Delete release branch

The goal of a release is to have a new stable version of an application or a konnector.  A new release is always based on the current state of `master`, so it consists in creating a new branch `release-0.0.0` (with the correct version).

Right after starting a new release, `master`'s version must be bumped, as the previous version is now "frozen" into the release branch. It is done now to not forget to do it later, or to not have a new unexpected commit before the next version.

Example with `master` being versionned to `1.4.0`, `origin` being the remote Cozy repository:

```sh
git checkout master
git checkout -b release-1.4.0
git push --set-upstream-to=origin/release-1.4.0 release-1.4.0
git checkout master
# Update app version to 1.5.0 in package.json and manifest.webapp
git add package.json manifest.webapp
git commit -m "chore: Bump version to 1.5.0"
git push origin HEAD
# Go back to work on our release, we will next tag a first beta
git checkout release-1.4.0
```

Once the release branch is created, i.e. the release has started, it must be validated, so a first beta tag is created.

Following the previous example:
```sh
git tag 1.4.0-beta.1
git push origin 1.4.0-beta.1
```
> NB: Version number in package.json and manifest.webapp is still `1.4.0`


If this beta version is ok, it can be tagged as `stable`

```sh
git tag 1.4.0
git push origin 1.4.0
```

But if the beta is not ok, fixes are committed into the release branch and a new beta version is tagged.

```sh
git tag 1.4.0-beta.2
git push origin 1.4.0-beta.2
```

This process is repeated until a beta version is validated and ready to be tagged as stable.

During the release, development continues in `master` without impacting `release-1.4.0`.

Once a stable version has been tagged, the release branch must then be merged into `master` to retrieve all the fixes it contains. Then the release branch can be deleted.

```sh
git checkout master
git pull
git merge release-1.0.4
git branch -D release-1.0.4
git push origin :release-1.0.4
git push origin HEAD
```

> NB: We take care to get only one release branch at a time.

## Patches

> TL;DR
>
> * Create a patch branch from a stable tag
> * Bump to new patch version
> * Fixes issues and tag new beta versions until everything is ok
> * Tag stable version
> * Cherry-pick fixes into `master`
> * Delete patch branch

If a bug is detected on a stable version, we address it with a patch branch.

For example for the version `1.1.0`:
```sh
git checkout 1.0.0 -b patch-1.1.1
# Update app version to 1.1.1 in package.json and manifest.webapp
git add package.json manifest.webapp
git commit -m "chore: Bump version to 1.1.1"
git push --set-upstream-to=origin/patch-1.1.0 patch-1.1.0
```
After this checkout a patch branch is managed the same way as a release branch, except that:

* A beta version tag is not created right after checkout but once fixes have been made (otherwise the beta version would be exactly the same as the version which need to be patched)
* After the stable version has been tagged, the commits are cherry-picked instead of merging the whole branch. A merge is still possible, but it implies to manage conflicts in `package.json` and `manifest.webapp` about version number (remember, we bumped the version so it will conflict with `master` current's one).
