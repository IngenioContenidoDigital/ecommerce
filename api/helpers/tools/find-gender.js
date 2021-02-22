module.exports = {
  friendlyName: 'Find gender',
  description: '',
  inputs: {
    gender:{
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
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let csd = new AWS.CloudSearchDomain({endpoint: 'search-predictor-1ecommerce-if3tuwyqkbztsy2a2j3voan7bu.us-east-1.cloudsearch.amazonaws.com'});
    let params = {
      query: inputs.gender,
      return: 'id',
      queryParser: 'simple',
      size:5,
      sort:'_score desc',
      queryOptions: '{"defaultOperator":"or","fields":["gender"]}',
      /*cursor: 'STRING_VALUE',
      expr: 'STRING_VALUE',
      facet: 'STRING_VALUE',
      filterQuery: 'STRING_VALUE',
      highlight: 'STRING_VALUE',
      partial: true || false,
      queryParser: simple | structured | lucene | dismax,
      size: 'NUMBER_VALUE',
      sort: 'STRING_VALUE',
      start: 'NUMBER_VALUE',
      stats: 'STRING_VALUE'*/
    };
    let results = [];
    csd.search(params, async (err, data) => {

      if(err){return exits.error(err);}
      if(data.hits.found>0){
        data.hits.hit.forEach(h =>{
          results.push(h.id);
        });
      }else{
        let gender = await Gender.findOne({name:'unisex'});
        results.push(gender.id);
      }
      return exits.success(results);
    }); 
  }


};

