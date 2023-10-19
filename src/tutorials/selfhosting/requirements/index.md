# What you need

The installation procedure requires:

- A server to install cozy programs.  If you plan to use precompiled packages, the server must run one of the last two versions of Debian or Ubuntu LTS.
- A domain name (mandatory to host Cozy instances secured with https and accessible from internet. This is a major security feature to isolate applications and avoid bypassing data access permissions).

    In this documentation, we will use `domain.example` as an example domain. You will replace it with your own domain name throughout the explanation.
    The address of your Cozy instance will be `cozy.domain.example`.

- Good system administration knowledge. Despite documentation's goal is to be pretty straightforward to follow, there are some tricky and technical parts.

During installation, you will also need to define:

- a CouchDB administration password
- a CouchDB database access password
- a cozy-stack admin password
- You will need to provide your email address for Let's Encrypt SSL certificate validation and your Cozy instance creation

You can already prepare these elements.

<div style="text-align: right">
  <a href="./couchdb/">Next --&gt;</a>
</div>

