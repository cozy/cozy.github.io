package registry

import (
	"fmt"
	"time"
)

// CleanOldVersions removes a specific app version of a space
func CleanOldVersions(space *Space, appSlug, channel string, nbMonths int, major, minor int, dryRun bool) error {
	// Finding last versions of the app
	versionsToKeepFromN, err := FindLastNVersions(space, appSlug, channel, major, minor)
	if err != nil {
		return err
	}
	d := time.Now().AddDate(0, -nbMonths, 0)

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
			if dryRun {
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
