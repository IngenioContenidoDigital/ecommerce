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
                        color
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
                quantity
                price
                reference
                externalId
                simple
                color
                size
                images{
                    file
                    src
                }
            }
        }
    }`,
PRODUCTID :
`query WooCommerceProductIdQuery($productId: String) {
    WooCommerceProductId(productId: $productId) {
            product{
                name
                simple
                externalId
                description
                reference
                descriptionShort
                active
                price
                manufacturer
                color
                quantity
                tax{
                    name
                    rate
                }
                width
                weight
                height
                length
                images{
                    file
                    src
                }
                variations{
                    quantity
                    reference
                    talla
                    price
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
    }`
}