module.exports = {
  PAGINATION :
  `query VtexPaginationQuery($pagination: PaginationInput) {
    VtexPagination(listing: { pagination: $pagination}) {
      totalRecords
      pagesCount
    }
  }`,

  CATALOG :
  `query VtexProductListQuery($pagination: PaginationInput) {
    VtexProducts(listing: { pagination: $pagination}) {
      totalRecords
      pagesCount
      data{
        name
        externalId
        description
        reference
        descriptionShort
        active
        price
        manufacturer
        tax
        width
        weight
        height
        length
      }
    }
  }`,

  IMAGES :
  `query VtexProductImageListQuery($pagination: PaginationInput) {
    VtexProductImage(listing: { pagination: $pagination}) {
      totalRecords
      pagesCount
      data{
        externalId
        images{
          file
          src
        }
      }
    }
  }`,

  VARIATIONS :
  `query VtexProductVariationListQuery($pagination: PaginationInput) {
    VtexProductVariation(listing: { pagination: $pagination}) {
      totalRecords
      pagesCount
      data{
        externalId
        variations{
          reference
          talla
          price
          quantity
        }
      }
    }
  }`
};
