module.exports = {
    PAGINATION :
    `query WooCommercePaginationQuery($pagination: PaginationInput) {
        WooCommercePagination(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
      }
    }`,

    CATALOG :`
            query WooCommerceProductListQuery($pagination: PaginationInput) {
                WooCommerceProduct(listing: { pagination: $pagination}) {
                totalRecords
                pagesCount
                data{
                    name
                    simple
                    externalId
                    description
                    reference
                    descriptionShort
                    active
                    price
                    manufacturer
                    quantity
                    color
                    tax{
                        name
                        rate
                    }
                    product_weight
                    width
                    weight
                    height
                    length
                    }
                }
            }
                
`,

IMAGES : `
        query WooCommerceProductListQuery($pagination: PaginationInput) {
                WooCommerceProduct(listing: { pagination: $pagination}) {
                totalRecords
                pagesCount
                data{
                        externalId
                        simple
                        reference
                        images{
                            file
                            src
                        }
                    }
            }
        }
`,

VARIATIONS : `
        query WooCommerceProductListQuery($pagination: PaginationInput) {
                WooCommerceProduct(listing: { pagination: $pagination}) {
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
                            size
                            color
                            size
                            weight
                            discount{
                                name
                                from
                                to
                                type
                                value
                            }
                        }
                    }
            }
        }
`,
PRODUCT_VARIATION_ID :
`query WooCommerceProductVariationQuery($productId: String) {
    WooCommerceProductVariation(productId: $productId) {
            data{
                reference
                simple
                color
                size
                images{
                    file
                    src
                }
            }
        }
    }`
}