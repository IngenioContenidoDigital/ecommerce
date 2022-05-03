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
        color
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
  `query PrestashopProductImageListQuery($pagination: PaginationInput) {
    PrestashopProductImage(listing: {pagination: $pagination}) {
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
  `query PrestashopProductIdQuery($id: String) {
    PrestashopProductId(productId: $id) {
      data{
        product{
          name
          externalId
          description
          reference
          descriptionShort
          active
          color
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
          }
        }
        productImages{
          images{
            file
            src
          }
        }
      }
    }
  }`,

  ORDERID :
  `query PrestashopOrderIdQuery($id: String) {
    PrestashopOrderId(orderId: $id) {
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
  }`
};
