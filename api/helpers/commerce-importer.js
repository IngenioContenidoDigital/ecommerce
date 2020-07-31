const jwt = require('jsonwebtoken');
const axios = require('axios');

let signRequest = (data)=>{
    return jwt.sign({
      url: data.apiUrl,
      consumerKey: data.pk,
      consumerSecret: data.sk
  }, 'secret');
};

let getCatalog = async(data)=>{
  return new Promise(async (resolve, reject)=>{
      let token = signRequest(data);

      const query = `
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
              upc
              price
              ean13
          }
          }
      }
  `

    let response =  await axios.post('http://localhost:9000/graphql', { query : query}, { headers : {
    'ips-api-token' : `Bearer ${token}`
    }}).catch((e)=>reject(e));

    if(response && response.data){
        return resolve(response.data.data['WooCommerceProductListQuery']);
    }
  });
}

module.exports = {


  friendlyName: 'Commerce importer',


  description: 'Import data from marketplaces providers',


  inputs: {
    channel: { type: 'string'},
    pk: {
      type: 'string'
    },
    sk: {
      type: 'string'
    },
    apiUrl: {
      type: 'string'
    },
    version: {
      type : 'string'
    },
  },

  exits: {

    success: {
      description: 'All done.',
    },

  },

  fn: function (inputs) {
       return getCatalog(inputs);
  }

};

