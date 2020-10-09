module.exports = {
  PAGINATION :
    `query ShopifyPaginationQuery($pagination: PaginationInput) {
      ShopifyPagination(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
      }
    }`,

  CATALOG :
    `query ShopifyProductListQuery($pagination: PaginationInput) {
      ShopifyProducts(listing: { pagination: $pagination}) {
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
    `query ShopifyProductImageListQuery($pagination: PaginationInput) {
      ShopifyProductImage(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        data{
          externalId
          images{
						file
						position
            src
          }
        }
      }
    }`,

  VARIATIONS :
    `query ShopifyProductVariationListQuery($pagination: PaginationInput) {
      ShopifyProductVariation(listing: { pagination: $pagination}) {
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
