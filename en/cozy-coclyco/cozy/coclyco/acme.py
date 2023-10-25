import os
import sys

import OpenSSL
import acme.challenges
import acme.client
import acme.messages
import josepy as jose
import requests
from cryptography import __version__ as cryptoversion
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, \
    PrivateFormat, NoEncryption
from packaging import version
from pyasn1.codec.der import decoder
from pyasn1_modules.rfc2459 import SubjectAltName

from .logger import Logger


class ACME:
    ACME_STAGING = os.getenv("ACME_STAGING", None)
    if ACME_STAGING:
        Logger.warning("Using Let's Encrypt staging endpoint")
        ACME_DEFAULT_ENDPOINT = "https://acme-staging-v02.api.letsencrypt.org/directory"
    else:
        ACME_DEFAULT_ENDPOINT = "https://acme-v02.api.letsencrypt.org/directory"
    ACME_ENDPOINT = os.getenv("ACME_ENDPOINT", ACME_DEFAULT_ENDPOINT)
    ACME_DIRECTORY = os.getenv("ACME_DIRECTORY", "/etc/ssl/private")
    USER_AGENT = "Cozy Coclyco"
    DEFAULT_BACKEND = default_backend()

    def __init__(self):
        self.__acme = self.__get_client()
        challenges = self._file("acme-challenge")
        if not os.path.isdir(challenges):
            os.mkdir(challenges)

    def __openssl_to_crypto(self, key):
        pem = key.private_bytes(encoding=Encoding.PEM,
                                format=PrivateFormat.TraditionalOpenSSL,
                                encryption_algorithm=NoEncryption())
        key = OpenSSL.crypto.load_privatekey(
            OpenSSL.crypto.FILETYPE_PEM, pem)
        return key

    def _generate_rsa_key(self, size=4096, exponent=65537, format="openssl"):
        Logger.debug("Generate a RSA private key, size=%d, exponent=%d",
                     size, exponent)
        key = ACME.DEFAULT_BACKEND.generate_rsa_private_key(
            key_size=size, public_exponent=exponent)
        if format == "openssl":
            key = self.__openssl_to_crypto(key)
        return key

    def _generate_key(self, curve="secp256r1", format="openssl"):
        Logger.debug("Generate an ECDSA private key, curve=%s", curve)
        curve_name = curve.lower()
        curve = ec._CURVE_TYPES.get(curve_name)
        if not curve:
            raise "Unsupported key curve: " + curve_name

        key = ACME.DEFAULT_BACKEND.generate_elliptic_curve_private_key(
            curve=curve())
        if format == "openssl":
            key = self.__openssl_to_crypto(key)
        return key

    def _save_key(self, key, file):
        if isinstance(key, OpenSSL.crypto.PKey):
            pem = OpenSSL.crypto.dump_privatekey(OpenSSL.crypto.FILETYPE_PEM,
                                                 key)
        else:
            pem = key.private_bytes(encoding=Encoding.PEM,
                                    format=PrivateFormat.TraditionalOpenSSL,
                                    encryption_algorithm=NoEncryption())
        with open(file, "wb") as file:
            file.write(pem)

    def _read_key(self, file, format="openssl"):
        with open(file, "rb") as file:
            pem = file.read()
        if format == "acme":
            # Starting from python-cryptography 39.0.0 load_pem_private_key has an extra unsafe_skip_rsa_key_validation parameter
            if version.parse(cryptoversion) < version.parse("39.0.0"):
                key = ACME.DEFAULT_BACKEND.load_pem_private_key(data=pem, password=None)
            else:
                key = ACME.DEFAULT_BACKEND.load_pem_private_key(
                    data=pem, password=None, unsafe_skip_rsa_key_validation=False
                )
        else:
            key = OpenSSL.crypto.load_privatekey(
                type=OpenSSL.crypto.FILETYPE_PEM, buffer=pem, passphrase=None)
        return key

    def _save_csr(self, csr, file):
        pem = OpenSSL.crypto.dump_certificate_request(
            OpenSSL.crypto.FILETYPE_PEM, csr)
        with open(file, "wb") as file:
            file.write(pem)

    def _read_csr(self, file):
        with open(file, "rb") as file:
            pem = file.read()
        csr = OpenSSL.crypto.load_certificate_request(
            OpenSSL.crypto.FILETYPE_PEM, pem)
        return csr

    def _save_crt(self, crt, file):
        with open(file, "w") as file:
            file.write(crt)

    def _read_crt(self, file):
        with open(file, "rb") as file:
            pem = file.read()
        crt = OpenSSL.crypto.load_certificate(
            OpenSSL.crypto.FILETYPE_PEM, pem)
        return crt

    def _file(self, *path):
        return os.path.join(ACME.ACME_DIRECTORY, *path)

    def __create_client(self, key):
        key = jose.JWKRSA(key=key)
        net = acme.client.ClientNetwork(key, user_agent=ACME.USER_AGENT)
        directory = acme.messages.Directory.from_json(
            net.get(ACME.ACME_ENDPOINT).json())
        client = acme.client.ClientV2(directory, net=net)
        return client

    def __register(self, client):
        tos = client.directory.meta.terms_of_service
        tos = input(
            "Are you agree with Let's Encrypt terms of service available at {}? [y/N] ".format(
                tos)).lower()
        if tos != 'y':
            Logger.error("Terms of service not accepted, aborting...")
            sys.exit(-1)
        email = input("Email address for Let's Encrypt account registration: ")
        account = acme.messages.NewRegistration.from_data(
            email=email, terms_of_service_agreed=True)
        Logger.info("Register account to Let's Encrypt")
        client.new_account(account)

    def __load_registration(self, client):
        net = client.net
        key = net.key
        reg = acme.messages.NewRegistration(
            key=key.public_key(), only_return_existing=True)
        directory = client.directory
        response = client._post(directory['newAccount'], reg)
        regr = client._regr_from_response(response)
        net.account = regr

    def __get_client(self):
        if ACME.ACME_STAGING:
            account_key = self._file("account-staging.pem")
        else:
            account_key = self._file("account.pem")

        if not os.path.isfile(account_key):
            Logger.info("Create new account key %s", account_key)
            key = self._generate_rsa_key(format="acme")
            self._save_key(key, account_key)
            client = self.__create_client(key)
            self.__register(client)
        else:
            key = self._read_key(account_key, format="acme")
            client = self.__create_client(key)
            self.__load_registration(client)

        return client

    def __extract_san(self, x509):
        domain = set()

        if isinstance(x509, OpenSSL.crypto.X509):
            extensions = [x509.get_extension(i) for i in
                          range(x509.get_extension_count())]
        else:
            extensions = x509.get_extensions()

        for extension in extensions:
            if extension.get_short_name() == b"subjectAltName":
                san = extension.get_data()
                san = decoder.decode(san, asn1Spec=SubjectAltName())

                for name in san:
                    if isinstance(name, SubjectAltName):
                        for entry in range(len(name)):
                            component = name.getComponentByPosition(entry)
                            domain.add(str(component.getComponent()))
        return domain

    def _generate_csr(self, key, cn, domains=[]):
        if isinstance(domains, str):
            domains = [domains]
        domains = set(domains)
        domains.add(cn)
        Logger.info("Generate CSR for CN %s & SAN %s" % (cn, domains))

        x509_extensions = [
            OpenSSL.crypto.X509Extension(b"keyUsage", False,
                                         b"Digital Signature, Non Repudiation, Key Encipherment"),
            OpenSSL.crypto.X509Extension(b"basicConstraints", False,
                                         b"CA:FALSE")
        ]

        san = ",".join(["DNS: %s" % domain for domain in domains])
        san = OpenSSL.crypto.X509Extension(b"subjectAltName", False,
                                           san.encode())
        x509_extensions.append(san)

        req = OpenSSL.crypto.X509Req()
        req.get_subject().CN = cn
        req.add_extensions(x509_extensions)

        req.set_pubkey(key)
        req.sign(key, "sha512")

        return req

    def _extract_x509_domains(self, x509):
        cn = x509.get_subject().CN
        domains = self.__extract_san(x509)
        return cn, domains

    def __prepare_http01_challenge(self, domain, challenge):
        Logger.info("Request ACME validation for %s", domain)
        response, validation = challenge.response_and_validation(
            self.__acme.net.key)

        path = self._file("acme-challenge", os.path.basename(challenge.path))
        Logger.info("Write challenge %s on %s", validation, path)
        with open(path, "w") as file:
            file.write(validation)

        url = challenge.chall.uri(domain)
        Logger.info("Verify challenge on %s", url)
        r = requests.get(url, verify=False)
        r.raise_for_status()
        retrieved = r.text

        if validation != retrieved:
            Logger.exception(
                "Invalid token retrieved at %s: expected %s, got %s",
                url, validation, retrieved)

        Logger.info("Notify ACME the challenge is ready on %s", url)
        self.__acme.answer_challenge(challenge, response)

    def __prepare_http01_authorization(self, authorization):
        body = authorization.body
        domain = body.identifier.value

        if body.status == acme.messages.STATUS_VALID:
            Logger.info("Challenge for %s already valid", domain)
            return

        for challenge in body.challenges:
            if isinstance(challenge.chall, acme.challenges.HTTP01):
                self.__prepare_http01_challenge(domain, challenge)
                return

    def __prepare_http01(self, order):
        for authorization in order.authorizations:
            self.__prepare_http01_authorization(authorization)

    def __perform_http01(self, order):
        self.__prepare_http01(order)
        Logger.info("Request certificate to ACME")
        return self.__acme.poll_and_finalize(order)

    def _issue_certificate(self, csr):
        cn, domains = self._extract_x509_domains(csr)
        Logger.info("Issue certificate for %s", domains)

        pem = OpenSSL.crypto.dump_certificate_request(
            OpenSSL.crypto.FILETYPE_PEM, csr)
        Logger.info("Request issuance for %s", domains)
        order = self.__acme.new_order(pem)
        order = self.__perform_http01(order)
        crt = order.fullchain_pem

        file = self._file("%s.crt" % cn)
        Logger.info("Save certificate for %s in %s", domains, file)
        self._save_crt(crt, file)
