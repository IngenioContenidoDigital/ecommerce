module.exports = {
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
                    gender
                    mainColor
                    width
                    weight
                    height
                    length
                    images{
                        file
                        position
                        product
                        cover
                        src
                    }
                        variations{
                            quantity
                            reference
                            talla
                            gender
                            upc
                            price
                            ean13
                        }
                    }
                }
                }
`
}