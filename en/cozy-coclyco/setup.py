#!/usr/bin/env python
from setuptools import setup, find_packages

setup(
    name="cozy-coclyco",
    namespace_packages=["cozy"],
    packages=find_packages(),
    version="1.0",
    description="Control Cozy stack",
    author="aeris",
    author_email="aeris@cozycloud.cc",

    include_package_data=True,

    classifiers=[
        "Development Status :: 3 - Alpha",
        "Programming Language :: Python :: 3",
    ],

    install_requires=[
        'pyOpenSSL',
        'cryptography',
        'pyasn1',
        'pyasn1-modules',
        'josepy',
        'acme >=0.20',
        'requests',
        'setuptools',
        'pyyaml',
        'couchdb >=1.1'
    ],
    entry_points={
        "console_scripts": [
            "cozy-coclyco = cozy.coclyco:cli"
        ]
    }
)
