module.exports = {
  friendlyName: 'Create client',
  description: 'Create client SIIGO',
  inputs: {
    seller:{
      type: 'string',
      required:true
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let axios = require('axios');
    try {
      let seller = await Seller.findOne({id: inputs.seller});
      let address = await Address.findOne({id: seller.mainAddress}).populate('city').populate('region').populate('country');
      let accessToken = await sails.helpers.siigo.init();
      let contactName = await sails.helpers.parseName(seller.contact);
      let lastName = contactName.secondLastName !== '' ? contactName.lastName+ ' ' +contactName.secondLastName : contactName.lastName;
      let data = {
        'type': 'Customer',
        'person_type': 'Company',
        'id_type': '31',
        'identification': seller.dni,
        'name': [
          seller.name
        ],
        'branch_office': 0,
        'active': true,
        'vat_responsible': false,
        'fiscal_responsibilities': [
          {
            'code': 'R-99-PN'
          }
        ],
        'address': {
          'address': address.addressline1,
          'city': {
            'country_code': address.country.iso === 'CO' ? 'Co' : '',
            'state_code': address.city.code.slice(0,2),
            'city_code': address.city.code
          },
          'postal_code': address.zipcode
        },
        'phones': [
          {
            'indicative': String(address.country.prefix),
            'number': String(seller.phone),
          }
        ],
        'contacts': [
          {
            'first_name': contactName.name,
            'last_name': lastName,
            'email': seller.email,
          }
        ]
      };

      let options = {
        method: 'post',
        url: 'https://api.siigo.com/v1/customers',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: data
      };
      let result = await axios(options);
      if (result.data && result.data.id) {
        await Seller.updateOne({id: seller.id}).set({idSiigo: result.data.id});
      }
      return exits.success();
    } catch (error) {
      console.log(error);
      return exits.success();
    }
  }
};
