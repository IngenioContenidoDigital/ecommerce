module.exports = {
  PAGINATION :
    `query MercadolibrePaginationQuery($pagination: PaginationInput) {
      MercadolibrePagination(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
      }
    }`,

  CATALOG :
    `query MercadolibreProductListQuery($pagination: PaginationInput) {
      MercadolibreProducts(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        data{
          name
          externalId
          description
          reference
          descriptionShort
          active
          color
          manufacturer
          width
          weight
          height
          length
        }
      }
    }`,

  IMAGES :
    `query MercadolibreProductImageListQuery($pagination: PaginationInput) {
      MercadolibreProductImage(listing: { pagination: $pagination}) {
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
    `query MercadolibreProductVariationListQuery($pagination: PaginationInput) {
      MercadolibreProductVariation(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        data{
          reference
          discount{
            name
            from
            to
            type
            value
          }
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
