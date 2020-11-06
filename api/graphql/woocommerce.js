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
`
}