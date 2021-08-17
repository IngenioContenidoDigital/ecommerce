module.exports = {
  PAGINATION :
    `query MagentoPaginationQuery($pagination: PaginationInput) {
      MagentoPagination(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
      }
    }`,

  CATALOG :
    `query MagentoProductListQuery($pagination: PaginationInput) {
      MagentoProducts(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        data{
          name
          externalId
          description
          reference
          descriptionShort
          active
          tax{
            name
            rate
          }
          manufacturer
          width
          weight
          height
          length
        }
      }
    }`,

  IMAGES :
    `query MagentoProductImageListQuery($pagination: PaginationInput) {
      MagentoProductImage(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        data{
          reference
          images{
            file
            position
            src
          }
        }
      }
    }`,

  VARIATIONS :
    `query MagentoProductVariationListQuery($pagination: PaginationInput) {
      MagentoProductVariation(listing: { pagination: $pagination}) {
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
