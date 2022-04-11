module.exports = {
  PAGINATION :
    `query WooCommercePaginationQuery($pagination: PaginationInput) {
        WooCommercePagination(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
      }
    }`,

  CATALOG :
  `query WooCommerceProductListQuery($pagination: PaginationInput) {
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
  `query WoocommerceProductImageListQuery($pagination: PaginationInput) {
        WoocommerceProductImage(listing: { pagination: $pagination}) {
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
    `query WoocommerceProductVariationListQuery($pagination: PaginationInput) {
        WoocommerceProductVariation(listing: { pagination: $pagination}) {
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
                    skuId
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
    `,

  UPDATE_VARIATION :
    `mutation updateVariation($data: UpdateVariationInputType, $productId: ID, $variationId: ID){
        updateVariationWoocommerce(productId: $productId, variationId: $variationId, input: $data){
            name
            externalId
            simple
            reference
        }
    }`
};
