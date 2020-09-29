---
title: Install the desktop client on your GNU/Linux system
summary: And synchronize your Cozy data with your desktop
---

# Install the desktop client on your GNU/Linux system

To ease the use of Cozy Drive on any distribution, we distribute the application using the [AppImage](https://appimage.org/) format. This way, you have nothing to install, just download the application and run it.

We provide packages for both [32 bits](https://nuts.cozycloud.cc/download/channel/stable/32) and [64 bits](https://nuts.cozycloud.cc/download/channel/stable/64) systems. All you have to do is download the file, move it to some dedicated folder, make it executable and run it.

_[List of known to work distributions](https://cozy-labs.github.io/cozy-desktop/doc/usage/linux#supported-distributions)_

## Detailed instructions on Gnome

Click on one of these links to download Cozy Drive for your OS:

- [Cozy Drive for GNU/Linux 32 bits](https://nuts.cozycloud.cc/download/channel/stable/32);
- [Cozy Drive for GNU/Linux 64 bits](https://nuts.cozycloud.cc/download/channel/stable/64);

Once the binary file downloaded, go to the folder where your browser has stored it. For example, if you use Firefox, click on the folder icon in the download list.

![Go to download folder](../../img/sync/open-download-folder.png)

To be able to run the application, you have to edit its properties to make it executable. Just right click on the application and select `Properties` inside the context menu:
![Edit the properties of the application](../../img/sync/right-click-properties.png)

Then go to the `Permissions` tab and check the box to make the application executable:
![Allow to launch the application](../../img/sync/make-executable.png)

There’s no need to install the application, you can just run it from the folder you have downloaded it, but we recommend to move it to a dedicated folder to be able to find it easily. You can create an `Applications` folder inside your home directory and move the application there:

![Create a new folder](../../img/sync/new-folder.png)

![Name the new folder](../../img/sync/new-folder-name.png)

![Move the application to the folder](../../img/sync/move-appimage.png)

Tip: you can add this folder to your bookmarks to find it easily:

![Bookmark the folder](../../img/sync/new-bookmark.png)

From 3.26 onwards, GNOME removed the systray (that little bar with some icons) which is the interface for _Cozy Drive_. You will need to install an extension such as [TopIcons](https://extensions.gnome.org/extension/1031/topicons/) in order to see the cozy-desktop application and launch it.

That’s all. You can now double-click on the application to launch it and connect it to your server. Have fun!

## More

[More in deep insights on the GNU/Linux client](https://cozy-labs.github.io/cozy-desktop/doc/usage/linux).

If your distribution is not supported, you can try the [manual build guide](https://cozy-labs.github.io/cozy-desktop/doc/usage/build.html).
