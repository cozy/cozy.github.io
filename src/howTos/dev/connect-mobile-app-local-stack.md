---
title: How to connect a mobile app to your local stack
---

Sometimes we need to test a feature on a mobile app by connecting it to our locally installed stack. For this to work, we need to achieve some things.

## Prerequisite

- Have a local stack installed
- Have an Android emulator created

## Start the emulator with the ability to remount its file system as writable

Since we will need to edit the hosts of the emulator, we need to be able to remount its file system as writable. For that, we need to start our emulator with the following command :

```
./emulator -writable-system -avd Pixel_API_27
```

The `emulator` binary is located at `/home/user/Android/Sdk/emulator/` on Linux systems by default. `Pixel_API_27` is the name of the emulator I want to start. If you don't know the name of your emulator, you can get it with :

```
./emulator -list-avds
```

## Root the emulator

Now that the emulator is started, we need to gain root access on it. Run the following command :

```
adb root
```

This restarts the adb daemon with root privileges.

## Remount the file sytem as writable

By default, the file system is read-only. We need it to be writable, so we run this command :

```
adb remount
```

## Pull the emulator's hosts file

To edit the `hosts` file, we need to pull it on our system :

```
adb pull /etc/hosts hosts
```

This creates a `hosts` file in your current directory.

## Edit the hosts

For the emulator to be able to connect to our stack, we need to add the IP address of our machine to the hosts. Actually, we don't really need it since in an Android emulator `10.0.2.2` is automatically pointing to our machine. So we just need to add this to the `hosts` file :

```
10.0.2.2 cozy.tools
```

## Push the new file to the emulator

Now that we have added what's necessary in the file, we have to push it to the emulator :

```
adb push hosts /system/etc/hosts
```

Then try to ping `cozy.tools` to see if everything is working well :

```
adb shell ping api.dev.local
```

You can now enter `http://cozy.tools` in the login page of your mobile app and you will not get an error anymore.
