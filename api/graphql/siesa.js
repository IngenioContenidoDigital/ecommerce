module.exports = {
  PAGINATION :
    `query SiesaPaginationQuery($pagination: PaginationInput) {
      SiesaPagination(listing: { pagination: $pagination}) {
          totalRecords
          pagesCount
      }
    }`,

  CATALOG :
    `query SiesaProductListQuery($pagination: PaginationInput) {
      SiesaProducts(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        data{
          name
          reference
          externalId
          description
          descriptionShort
          active
          manufacturer
          color
          width
          weight
          height
          length
        }
      }
    }`,

  VARIATIONS :
    `query SiesaProductVariationListQuery($pagination: PaginationInput) {
      SiesaProductVariation(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        data{
          externalId
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
