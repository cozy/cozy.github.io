export const makeBreadcrumbs = (navigate, categoryName, subcategoryName, t) => {
  const breadcrumbs = [
    {
      name: t('Categories.title.general'),
      onClick: () => navigate('/analysis/categories')
    }
  ]
  if (categoryName) {
    breadcrumbs.push({
      name: t(`Data.categories.${categoryName}`),
      onClick: () => navigate(`/analysis/categories/${categoryName}`)
    })
  }
  if (subcategoryName) {
    breadcrumbs.push({
      name: t(`Data.subcategories.${subcategoryName}`)
    })
  }
  return breadcrumbs
}
