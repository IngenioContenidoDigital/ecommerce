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
        pagination
        data{
          name
          externalId
          description
          reference
          descriptionShort
          active
          price
          manufacturer
          tax{
            name
            rate
          }
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
        pagination
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
        pagination
        data{
          externalId
          reference
          variations{
            reference
            talla
            price
            quantity
            ean13
          }
        }
      }
    }`
};
