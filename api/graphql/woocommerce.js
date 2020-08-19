module.exports = {
    CATALOG :`
    {
        WooCommerceProductListQuery{
        name
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
        mainCategory {
            id
            name
            description
            parent
            active
            url
            level
            createdAt
            updateAt
            dafiti
            mercadolibre
            linio
        }
        categories{
            id
            name
            description
            parent
            active
            url
            level
            createdAt
            updateAt
            dafiti
            mercadolibre
            linio
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
`
}