module.exports = {
  PAGINATION :
  `query VtexPaginationQuery($pagination: PaginationInput) {
    VtexPagination(listing: { pagination: $pagination}) {
      totalRecords
      pagesCount
    }
  }`,

  CATALOG :
  `query VtexProductListQuery($pagination: PaginationInput) {
    VtexProducts(listing: { pagination: $pagination}) {
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
        textLink
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
  `query VtexProductImageListQuery($pagination: PaginationInput) {
    VtexProductImage(listing: { pagination: $pagination}) {
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
  `query VtexProductVariationListQuery($pagination: PaginationInput) {
    VtexProductVariation(listing: { pagination: $pagination}) {
      totalRecords
      pagesCount
      data{
        externalId
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
    `query VtexProductIdQuery($id: String) {
      VtexProductId(productId: $id) {
        product{
          name
          externalId
          description
          reference
          descriptionShort
          active
          price
          textLink
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
            skuId
          }
        }
        productImages{
          images{
            file
            src
          }
        }
      }
    }`,

  ORDERID :
    `query VtexOrderIdQuery($id: String) {
      VtexOrderId(orderId: $id) {
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
