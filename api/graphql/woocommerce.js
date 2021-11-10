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
                            variationId
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
        }
`,
PRODUCT_VARIATION_ID :
`query WooCommerceProductVariationQuery($id: String) {
    WooCommerceProductVariation(productId: $id) {
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
`query WooCommerceProductIdQuery($id: String) {
    WooCommerceProductId(productId: $id) {
            product{
                name
                simple
                externalId
                description
                reference
                descriptionShort
                active
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
    }`,
    
    ORDERID :
    `query WoocommerceOrderIdQuery($id: String) {
        WooCommerceOrderId(orderId: $id) {
            channelref,
            channel,
            totalShipping,
            paymentMethod,
            paymentId,
            status,
            createdAt,
            customer{
                emailAddress
                emailStatus
                fullName
                dniType
                dni
                mobile
                mobileStatus
            }
            address{
                name
                addressline1
                addressline2
                city
                region
                notes
                zipcode
            }
            items{
                skuId
                quantity
                price
                discount
            }
        }
    }`,
    ADD_WEBHOOK :
        `mutation addWebHook ($webhook :WebHookInputType){
                createWoocommerceWebHook(input:$webhook){
                    id
                    name
                    delivery_url
                    status
                    topic
                }
            }
        `,

    UPDATE_WEBHOOK :
        `mutation updateWebHook ($webhook :WebHookInputType, $id:ID){
                updateWoocommerceWebHook(input:$webhook, webhookId:$id){
                    name
                    delivery_url
                    status
                    topic
                }
        }
    `
}
