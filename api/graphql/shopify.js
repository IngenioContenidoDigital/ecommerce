module.exports = {
  PAGINATION :
    `query ShopifyPaginationQuery($pagination: PaginationInput) {
      ShopifyPagination(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
      }
    }`,

  CATALOG :
    `query ShopifyProductListQuery($pagination: PaginationInput) {
      ShopifyProducts(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        pagination
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
    `query ShopifyProductImageListQuery($pagination: PaginationInput) {
      ShopifyProductImage(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        pagination
        data{
          externalId
          images{
						file
						position
            src
          }
        }
      }
    }`,

  VARIATIONS :
    `query ShopifyProductVariationListQuery($pagination: PaginationInput) {
      ShopifyProductVariation(listing: { pagination: $pagination}) {
        totalRecords
        pagesCount
        pagination
        data{
          externalId
          reference
          variations{
            reference
            talla
            price
            quantity
            ean13
            skuId
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
    `query ShopifyProductIdQuery($id: String) {
      ShopifyProductId(productId: $id) {
        data{
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
              ean13
            }
          }
          productImages{
            images{
              file
              position
              src
            }
          }
        }
      }
    }`,

  ORDERID :
    `query ShopifyOrderIdQuery($id: String) {
      ShopifyOrderId(orderId: $id) {
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
    `mutation addWebhookShopify($webhook: WebHookShopifyInputType){
      createShopifyWebHook(input: $webhook){
        id
        address
        topic
        version
      }
    }`,

  DELETE_WEBHOOK :
    `mutation deleteWebhookShopify($id: String){
      deleteShopifyWebHook(webhookId: $id){
        id
      }
    }`,

  UPDATE_VARIATION_PRICE :
    `mutation updateVariationShopify($data: UpdateVariationInputType, $productId: ID, $variationId: ID){
      updateVariationShopify(productId: $productId, variationId: $variationId, input: $data){
          name
          externalId
          reference
      }
    }`,

  UPDATE_VARIATION_STOCK :
    `mutation updateVariationShopifyStock($data: UpdateVariationInputType, $productId: ID, $variationId: ID){
      updateVariationShopifyStock(productId: $productId, variationId: $variationId, input: $data){
          inventoryId
          quantity
      }
    }`
};
