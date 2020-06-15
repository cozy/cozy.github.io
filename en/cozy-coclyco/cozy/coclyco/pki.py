import os
import re
from datetime import datetime, timedelta

from pkg_resources import resource_stream

from .acme import ACME
from .cmd import Cmd
from .logger import Logger
from .utils import list_safe_get


class PKI(ACME):
    DEFAULT_APPS = [
        "settings",
        "home",
        "drive",
        "photos",
        "store"
    ]

    def __init__(self):
        super().__init__()
        self.__private_key = self.__get_private_key()

    def __get_private_key(self):
        file = self._file("cozy.pem")
        if not os.path.isfile(file):
            Logger.info("Creating new master key %s", file)
            key = self._generate_key(format="openssl")
            self._save_key(key, file)
            return key
        else:
            key = self._read_key(file, format="openssl")
            return key

    def __get_csr(self, slug, domain):
        file = self._file("%s.%s.csr" % (slug, domain))
        csr = self._read_csr(file)
        return csr

    def __get_crt(self, slug, domain):
        file = self._file("%s.%s.crt" % (slug, domain))
        if not os.path.isfile(file):
            return None
        crt = self._read_crt(file)
        return crt

    def __slug(self, fqdn):
        slug, *domain = fqdn.split(".", 1)
        domain = list_safe_get(domain, 0)
        return slug, domain

    def __fqdn(self, slug, domain):
        return "%s.%s" % (slug, domain)

    def __domain(self, app, slug, domain):
        return "%s.%s.%s" % (app, slug, domain)

    def __app_from_fqdn(self, fqdn, slug, domain):
        suffix = self.__fqdn(slug, domain)
        suffix = "." + suffix
        suffix = re.compile("^([^.]+)%s$" % re.escape(suffix))
        match = suffix.match(fqdn)
        if not match:
            return None
        return match.group(1)

    def __save_csr(self, csr, slug, domain):
        fqdn = self.__fqdn(slug, domain)
        file = self._file("%s.csr" % fqdn)
        self._save_csr(csr, file)

    def __create_csr(self, slug, domain, apps=None):
        if not apps:
            apps = PKI.DEFAULT_APPS

        fqdn = self.__fqdn(slug, domain)
        domains = [self.__domain(app, slug, domain) for app in apps]

        csr = self._generate_csr(self.__private_key, fqdn, domains)
        self.__save_csr(csr, slug, domain)
        return csr

    def __installed_apps(self, slug, domain):
        fqdn = self.__fqdn(slug, domain)
        o, *_ = Cmd.stack("apps", "ls", "--domain", fqdn)
        for line in o.splitlines():
            yield line.split(" ", 1)[0]

    def __issue_certificate(self, slug, domain):
        apps = self.__installed_apps(slug, domain)
        csr = self.__create_csr(slug, domain, apps=apps)
        self._issue_certificate(csr)

    def __generate_vhost(self, fqdn):
        data = resource_stream("cozy.coclyco", "nginx.conf").read().decode()
        data = data.replace("@@HOST@@", fqdn)

        Logger.info("Generate nginx vhost for %s", fqdn)
        available = os.path.join("/etc/nginx/sites-available", fqdn)
        with open(available, "w") as file:
            file.write(data)

        Logger.info("Enable nginx vhost for %s", fqdn)
        enabled = os.path.join("/etc/nginx/sites-enabled", fqdn)
        if os.path.exists(enabled):
            os.unlink(enabled)
        os.symlink(available, enabled)

        Logger.info("Reload nginx")
        Cmd.exec("systemctl", "reload", "nginx")

    def create_instance(self, args):
        fqdn = args.fqdn
        email = args.email
        Logger.info("Create instance %s with email %s", fqdn, email)

        o, *_ = Cmd.stack("instances", "add", fqdn, "--email", email)
        for line in o.splitlines():
            match = re.search("^Registration token: \"(.*)\"$", line)
            if match:
                token = match.group(1)
                break

        for app in PKI.DEFAULT_APPS:
            Logger.info("Install app %s on %s", app, fqdn)
            cmd = ["apps", "install"]
            if isinstance(app, str):
                cmd += [app]
            else:
                cmd += app
            cmd += ["--domain", fqdn]
            Cmd.stack(*cmd)

        registration_url = "https://%s/?registerToken=%s" % (fqdn, token)

        slug, domain = self.__slug(fqdn)
        self.__issue_certificate(slug, domain)
        self.__generate_vhost(fqdn)

        Logger.info("You can onboard at %s", registration_url)

    def vhost(self, args):
        fqdn = args.fqdn
        self.__generate_vhost(fqdn)

    def regenerate(self, args):
        fqdn = args.fqdn
        slug, domain = self.__slug(fqdn)

        crt = self.__get_crt(slug, domain)
        if crt:
            _, old = self._extract_x509_domains(crt)
        else:
            old = set()

        new = self.__installed_apps(slug, domain)
        new = set([self.__domain(app, slug, domain) for app in new])
        new.add(fqdn)

        if old == new:
            Logger.info("No need to regenerate")
            return

        removed = old.difference(new)
        if removed:
            Logger.info("Removed: %s", removed)
        added = new.difference(old)
        if added:
            Logger.info("Added: %s", added)

        self.__issue_certificate(slug, domain)

    def __renew(self, fqdn):
        fqdn = fqdn
        slug, domain = self.__slug(fqdn)

        crt = self.__get_crt(slug, domain)
        if not crt:
            Logger.info("No certificate for %s", fqdn)
            return

        today = datetime.today()
        date = datetime.strptime(crt.get_notAfter().decode(), "%Y%m%d%H%M%SZ")
        remaining = date - today
        if remaining > timedelta(days=30):
            Logger.info("%s expire in %s, no need to renew", fqdn, remaining)
            return

        Logger.info("%s expire in %s, renew", fqdn, remaining)
        csr = self.__get_csr(slug, domain)
        self._issue_certificate(csr)

    def renew(self, fqdns):
        for fqdn in fqdns:
            self.__renew(fqdn)
