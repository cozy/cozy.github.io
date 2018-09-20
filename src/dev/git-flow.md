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

A new release of an app or a konnector is always based on the current state of `master`, so just create a new branch for the given release version and bump `master` to a new minor version.

Example with `master` being versionned to `1.4.0`:
```sh
git checkout master
git checkout -b release-1.4.0
git checkout master
# Update app version to 1.5.0 in package.json and manifest.webapp
git add package.json manifest.webapp
git commit -m "chore: Bump version to 1.5.0"
```

Once the release branch is made, tag a new beta version.

Following the previous example:
```sh
git checkout release-1.4.0
git tag 1.4.0-beta.1
```

If this tagged version has issue which need to be fixed, every fix will be merged into the `release-1.4.0` branch.

Fixes must only be pushed fixes only in a release branch.

Meanwhile, developments can continue to be merged into `master` without impacting `release-1.4.0`. Once fixes are done, a new beta tag is made.

```sh
git tag 1.4.0-beta.2
```
> NB: Version number in package.json and manifest.webapp is still `1.4.0`

Once a beta version is validated and ready to be released, a stable tag is created.

```sh
git tag 1.4.0
```
The release branch must then be merged into `master` to retrieve all the fixes it contains. Then the release branch can be deleted.

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
```
After this checkout a patch branch is managed the same way than a release branch, except that:

* A beta version tag is not created right after checkout but once fixes have been made (because the beta version would be exactly the same as the version that need to be patched)
* After the stable version has been tagged, the commits are cherry-picked instead of merging the whole branch. A merge is still possible, but it implies to manage conflicts in `package.json` and `manifest.webapp` about version number (remember, we bumped the version so it will conflict with `master` current's one).
