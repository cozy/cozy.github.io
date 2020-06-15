import argparse
import sys

from .backup import Backup
from .cmd import Cmd
from .pki import PKI


def __instances(fqdns):
    if fqdns:
        yield from fqdns
        return

    o, *_ = Cmd.exec("cozy-stack", "instances", "ls")
    for line in o.splitlines():
        yield line.split(" ", 1)[0]


def cli():
    pki = PKI()
    backup = Backup()

    cli = argparse.ArgumentParser()
    cmds = cli.add_subparsers()

    create = cmds.add_parser("create")
    create.set_defaults(cmd=pki.create_instance)
    create.add_argument("fqdn", help="Instance fqdn")
    create.add_argument("email", help="Email address")

    vhost = cmds.add_parser("vhost")
    vhost.set_defaults(cmd=pki.vhost)
    vhost.add_argument("fqdn", help="Instance fqdn")

    regenerate = cmds.add_parser("regenerate")
    regenerate.set_defaults(cmd=pki.regenerate)
    regenerate.add_argument("fqdn", help="Instance fqdn")

    renew = cmds.add_parser("renew")
    renew.set_defaults(cmd=lambda args: pki.renew(__instances(args.fqdn)))
    renew.add_argument("fqdn", help="Instance fqdn", nargs="*")

    backup_ = cmds.add_parser("backup")
    backup_.set_defaults(cmd=lambda args: backup.backup(__instances(args.fqdn)))
    backup_.add_argument("fqdn", help="Instance fqdn", nargs="*")

    restore = cmds.add_parser("restore")
    restore.set_defaults(
        cmd=lambda args: backup.restore(args.fqdn, args.archive))
    restore.add_argument("fqdn", help="Instance fqdn")
    restore.add_argument("archive", help="Archive to restore")

    if len(sys.argv) < 2:
        sys.argv.append("--help")
    args = cli.parse_args()
    args.cmd(args)
