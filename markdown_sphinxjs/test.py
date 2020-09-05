import markdown
from jsdoc_reference import JSDocReferenceExtension

ext = JSDocReferenceExtension(directory='/Users/cozy/code/cozy/konnector-libs/packages/cozy-konnector-libs/src')
m = markdown.Markdown(extensions=[ext])

html = m.convert(
    """
## Hello

How are you ?

--->findDuplicates


!!!!note
    salut
"""
)
print(html)
