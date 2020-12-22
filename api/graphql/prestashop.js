module.exports = {
  PAGINATION :
  `query PrestashopProductListQuery($pagination: PaginationInput) {
    PrestashopProducts(listing: { pagination: $pagination}) {
      totalRecords
      pagesCount
    }
  }`,

  CATALOG :
  `query PrestashopProductListQuery($pagination: PaginationInput) {
    PrestashopProducts(listing: { pagination: $pagination}) {
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
  `query PrestashopProductListQuery($pagination: PaginationInput) {
    PrestashopProducts(listing: { pagination: $pagination}) {
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
  `query PrestashopProductVariationQuery($pagination: PaginationInput) {
    PrestashopProductVariation(listing: { pagination: $pagination}) {
      totalRecords
      pagesCount
      data{
        externalId
        reference
        variations{
          quantity
          reference
          talla
          price
        }
        discount{
          name
          from
          to
          type
          value
        }
      }
    }
  }`,

  PRODUCTID :
  `query PrestashopProductIdQuery($productId: String) {
    PrestashopProductId(productId: $productId) {
      product{
        name
        externalId
        description
        reference
        descriptionShort
        active
        price
        tax{
          name
          rate
        }
        manufacturer
        width
        weight
        height
        length
        images{
          file
          src
        }
      }
      productVariations{
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
        }
      }
      productImages{
        images{
          file
          src
        }
      }
    }
  }`
};
