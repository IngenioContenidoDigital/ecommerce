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
                            color
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
PRODUCTID :
    `query WoocommerceProductIdQuery($productId: String) {
        WooCommerceProductId(productId: $productId) {
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
                discount{
                    name
                    from
                    to
                    type
                    value
                }
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
        }
    }`
}