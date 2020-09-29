---
title: Share and send mail in development
---

Cozy apps let users [share documents from cozy to cozy](https://docs.cozy.io/en/cozy-stack/sharing/#cozy-to-cozy-sharing).

Meet Alice and Bob.
Alice wants to share a folder with Bob.
Alice clicks on the share button and fills in the email input with Bob's email address.
Bob receives an email with a _« Accept the sharing »_ button.
Bob clicks on that button and is redirected to Alice's cozy to enter his own cozy url to link both cozys.
Bob sees Alice's shared folder in his own cozy.

🤔 But how could we do this scenario on development environment?

## With the docker image

If you develop with the [cozy-app-dev docker image](https://docs.cozy.io/en/cozy-stack/client-app-dev/#with-docker), [MailHog](https://github.com/mailhog/MailHog) is running inside it to catch emails.

If cozy-stack has to send an email, MailHog catches it and exposes it on its web interface on <http://cozy.tools:8025/>.

## With the binary cozy-stack

If you develop with the [cozy-stack CLI](https://docs.cozy.io/en/cozy-stack/cli/cozy-stack/), you have to run [MailHog](https://github.com/mailhog/MailHog) on your computer and tell `cozy-stack serve` where to find the mail server with some [options](https://docs.cozy.io/en/cozy-stack/cli/cozy-stack_serve/#options):

```
./cozy-stack serve --appdir drive:../cozy-drive/build,settings:../cozy-settings/build --mail-disable-tls --mail-port 1025
```

_This commands assumes you `git clone` [cozy-drive](https://github.com/cozy/cozy-drive) and [cozy-settings](https://github.com/cozy/cozy-settings) in the same folder than you `git clone` [cozy-stack](https://github.com/cozy/cozy-stack)._

Then simply run `MailHog` and open <http://cozy.tools:8025/>.

## Retrieve sent emails

With MailHog, **every email** sent by cozy-stack is caught. That means the email address _does not have to be a real one_, ie. `bob@cozy`, `bob@cozy.tools` are perfectly fine. It _could be a real one_, but the email will not reach the real recipient's inbox, say `contact@cozycloud.cc`.
