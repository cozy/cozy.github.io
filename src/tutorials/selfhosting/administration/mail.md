# Configuring cozy-stack to send mail

Sometimes, cozy-stack needs to send mail. For example, when you share documents
to another cozy, the recipient of the sharing will be notified by email.

For cozy-stack to be able to send email, it must be configured to know how to
join a mail transport agent to send email.

## Mail transport agent (MTA)

First, you need a mail transport agent (SMTP server) for sending mail.

You can use either a local mail transport agent on the local server running
cozy-stack, a remote mail transport agent on another server you manage or
register for a mail sending service offering SMTP relay service.

In all cases, you will need the following information:

- SMTP host
- SMTP port
- Encryption to use. Either plain SMTP (no encryption), STARTTLS over SMTP
  or SMTP over TLS/SSL
- In case you need authentication, you will also need username and password
- SMTP local name to use when talking to SMTP server (usually you server's
  Fully qualified domain name)

!!! warning

    When using a local mail transport agent, be sure that your hosting
    provider let your server send outgoing emails. This is usually disabled
    by your hosting provider by default and should be enabled to let email
    get out of your server. Refer to your hosting provider documentation
    on how to allow outgoing email.

### Installing a local MTA

When installing a local Mail Transport Agent, we recommand using postfix.
Other mail transport agent software are suitable too, but we will let you
handle their configuration.

```bash
sudo apt update && sudo apt install postfix
```

When installing postfix, choose the following answers when asked for an
outgoing only mail transport agent:

- Configuration type: Internet site
- System mail name: The Fully Qualified Domain name of your server

Then configure postfix to only listen incoming connexions from local server:

```bash
postconf inet_interfaces=loopback-only
postconf mydestination='$myhostname, localhost.localdomain, localhost'
systemctl restart postfix
```

## Configuring cozy-stack

Mail sending configuration should ba added at the end of the
`/etc/cozy/cozy.yml.local` configuration file. Its content depends on the
encryption cozy-stack will use to talk to you mail transport agent.
While encryption is not required when running cozy-stack and a local MTA on
the same server, we recommend to encrypt communication between cozy-stack
and a remote MTA.

Below are some examples of mail configuration for cozy-stack. Choose one,
copy it at the end of the `/etc/cozy/.cozy.yml.local` file and adapt it to
your needs

### Local MTA on port 25 (SMTP), no encryption, no authentication

This is the default configuration when no mail configuration has been done
starting from cozy-stack version 1.6.15

```yaml
mail:
  host: localhost
  port: 25
  # No encryption
  disable_tls: true
```

### Remote MTA on submission port using STARTTLS and authentication

```yaml
mail:
  host: smtp.domain.example
  port: 587
  # Authentication
  username: myusername
  password: P@ssword
  # Use STARTTLS, not native TLS/SSL
  disable_tls: false
  use_ssl: false
  skip_certificate_validation: false
  # Hostname sent to the SMTP server with the HELO command
  local_name: myserver.domain.example
```

### Remote MTA on submissions port using native TLS/SSL and authentication

```yaml
mail:
  host: smtp.domain.example
  port: 465
  # Authentication
  username: myusername
  password: P@ssword
  # Use Native TLS/SSL
  disable_tls: false
  use_ssl: true
  skip_certificate_validation: false
  # Hostname sent to the SMTP server with the HELO command
  local_name: myserver.domain.example
```

## Restarting cozy-stack to use new configuration

Don't forget to restart cozy-stack after having modified `cozy.yml.local`

```bash
systemctl restart cozy-stack
```

<div style="text-align: right">
  <a href="../">Index ^</a>
</div>
