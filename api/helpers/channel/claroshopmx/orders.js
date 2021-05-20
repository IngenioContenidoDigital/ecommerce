module.exports = {
    friendlyName: 'Orders',
    description: 'Orders claroshop mx.',
    inputs: {
      integration:{
        type:'string',
        required:true
      },
      seller:{
        type:'string',
        required:true
      },
      params:{
        type:'string',
        required:true
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs,exits) {
        let moment = require('moment');
        let qs = require('qs');

        let integration = await Integrations.findOne({id : inputs.integration}).populate('channel');
        let sign = await sails.helpers.channel.claroshopmx.sign(inputs.integration, moment(new Date()).format("YYYY-MM-DDTHH:mm:ss"));
        let Orders = [];

        let response = await axios.post(`${integration.channel.endpoint}apicm/v1/${integration.user}/${sign.signature}/${sign.date}/pedidos${inputs.params}&page=1&limit=-1`,
                                    {},{ headers : {'Content-Type': 'application/x-www-form-urlencoded'}});

        if(response && response.data &&  (resonse.data.estatus == 'success')){

        }

        let profile = await Profile.findOne({name: 'customer'});
     
      return exits.success();
    }
  };
  