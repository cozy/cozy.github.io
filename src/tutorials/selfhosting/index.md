# Self-Hosting

## Introduction

Cozycloud offers an [hosted service](https://cozy.io/fr/pricing/) on a freemium model. You can discover it freely and upgrade your offer to suit your needs.

We are commited to protect your data and respect your privacy and are convinced that "You Will Stay Because You Can Leave".
The cozycloud source code is publicly available to be audited and you can decide to host it yourself or ask someone else you trust to host your cozy.

This documentation explains how to self host your cozy instance on your own server.

Cozycloud provides precompiled packages for the last two major versions of Debian and Ubuntu LTS on the amd64 architecture, as well as installation instructions from source code for other architectures and operating systems.

!!! note

    In this documentation, all code blocks are commands you will need to type.
    They can be copy/pasted at once using the small copy button that appears on hover

If you need help when installing your self-hosted cozy-stack environment, please ask us
on [our online forum](https://forum.cozy.io/), somebody will surely be able to help you
and provide some more information. Also please tell us if you find any inaccuracy in this
documentation so that we can fix it.

## Table of content

<!--lint disable list-item-bullet-indent-->

- Requirements
    - [What you need](./requirements/index.md)
    - [CouchDB](./requirements/couchdb.md)
    - [NodeJS](./requirements/nodejs.md)
- Installing cozy-stack
    - [Introduction](./install/index.md)
    - [Installing from precompiled package](./install/package.md)
    - [Installing from source](./install/sources.md)
- Finalize installation
    - [Nginx and certificates](./finalize/nginx.md)
    - [Create your first instance](./finalize/create_instance.md)
- [Administration](./administration/index.md)
    - [Create more instances](./administration/more_instances.md)
    - [Upgrade cozy-stack](./administration/upgrade.md)
    - [Configure mail sending](./administration/mail.md)
    - [Online edition of office documents](./administration/office.md)

<!--lint enable list-item-bullet-indent-->

<div style="text-align: right">
  <a href="./requirements/">Next --&gt;</a>
</div>
