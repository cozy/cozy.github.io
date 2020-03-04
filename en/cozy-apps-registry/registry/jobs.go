package registry

import (
	"fmt"
	"time"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/space"
)

// RunType is the type for telling if it's a dry run or a real one.
type RunType bool

const (
	// DryRun will just simulate the job and tell what would happen with a real
	// run.
	DryRun RunType = true
	// RealRun will really delete the old versions.
	RealRun RunType = false
)

// CleanOldVersions removes a specific app version of a space
func CleanOldVersions(space *space.Space, appSlug, channel string, params base.CleanParameters, run RunType) error {
	// Finding last versions of the app
	versionsToKeepFromN, err := FindLastNVersions(space, appSlug, channel, params.NbMajor, params.NbMinor)
	if err != nil {
		return err
	}
	d := time.Now().AddDate(0, -params.NbMonths, 0)

	// Finding all the versions of apps from a date
	versionsToKeepFromDate, err := FindLastsVersionsSince(space, appSlug, channel, d)
	if err != nil {
		return err
	}

	// Concat the two lists without duplicates
	versionsToKeep := versionsToKeepFromDate

	var found bool

	for _, y := range versionsToKeepFromN {
		for _, v := range versionsToKeepFromDate {
			if v.ID == y.ID {
				found = true
				break
			}
		}
		if !found {
			versionsToKeep = append(versionsToKeep, y)
		}
	}
	c, err := StrToChannel(channel)
	if err != nil {
		return err
	}

	// Get versions and filter ones to expire
	versions, err := GetAppChannelVersions(space, appSlug, c)
	if err != nil {
		return err
	}
	for _, v := range versions {
		toExpire := true
		for _, vk := range versionsToKeep {
			if v.ID == vk.ID {
				toExpire = false
				break
			}
		}

		if toExpire {
			fmt.Printf("Removing %s\n", v.Slug+"/"+v.Version)
			if run == DryRun {
				continue
			}
			err := v.Delete(space)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
