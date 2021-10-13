export const makeBreadcrumbs = (router, categoryName, subcategoryName, t) => {
  const breadcrumbs = [
    {
      name: t('Categories.title.general'),
      onClick: () => router.push('/analysis/categories')
    }
  ]
  if (categoryName) {
    breadcrumbs.push({
      name: t(`Data.categories.${categoryName}`),
      onClick: () => router.push(`/analysis/categories/${categoryName}`)
    })
  }
  if (subcategoryName) {
    breadcrumbs.push({
      name: t(`Data.subcategories.${subcategoryName}`)
    })
  }
  return breadcrumbs
}
