module.exports = {


  friendlyName: 'Request',


  description: 'Request something.',


  inputs: {
    host:{
      type:'string',
      required:true
    },
    route:{
      type:'string',
      required:true
    },
    method:{
      type:'string',
      required:true
    },
    data:{
      type:'ref'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },


  fn: async function (inputs,exits) {
    const https = require('https');
    //const querystring = require('querystring');
    let hostname= inputs.host.replace(/http(s?)*:\/\//gi,'');
    let data = inputs.data;
    let options = {
      hostname: hostname,
      port:443,
      path:inputs.route,
      method:inputs.method.toUpperCase(),
      headers:{'Content-Type':'application/x-www-form-urlencoded'}
    };
    const rq = https.request(options, rs =>{
      let data = '';
      rs.on('data', d =>{
        data+=d.toString();
      });
      rs.on('end', async ()=>{
        return exits.success(data);
      });
    });

    rq.on('error', error => {
      return exits.error(error);
    });

    if(inputs.method.toUpperCase()==='POST'){
      if(inputs.data!==undefined && inputs.data!==null && inputs.data.length>0){
        rq.write(data);
      }
    }
    rq.end();
  }
};

