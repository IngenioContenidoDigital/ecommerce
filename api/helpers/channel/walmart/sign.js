module.exports = {
    friendlyName: 'Sign Linio',
    description: 'Sign Request for Channel Linio',
    inputs: {
    //   integration:{
    //     type:'string',
    //     required:true,
    //   },
    //   action:{
    //     type:'string',
    //     required:true,
    //   },
    //   seller:{
    //     type:'string',
    //     required:true,
    //   },
    //   params:{
    //     type:'ref'
    //   }
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs, exits) {

        let axios = require('axios');
        let integration = await Integrations.findOne({id : '6025451b026eca25a84520cc'}).populate('channel');

        const params = new URLSearchParams()
        params.append('grant_type', 'client_credentials')

        let auth = `${integration.user}:${integration.key}`;
        const buferArray = Buffer.from(auth);
        let encodedAuth = buferArray.toString('base64');
        
        let options = {
            method: 'post',
            url: `${integration.channel.endpoint}/v3/token`,
            headers: {
                'WM_MARKET' : 'mx',
                'WM_SVC.NAME' : 'Walmart Marketplace',
                'WM_QOS.CORRELATION_ID': '11111111',
                "Content-Type": "application/x-www-form-urlencoded",
                accept: 'application/json',
                'Authorization': `Basic ${encodedAuth}`
            },
            data:params
        };
        let token = await axios(options).catch((e) => {console.log(e.response.data);});
        return exits.success(token.data.access_token);
    }
  };