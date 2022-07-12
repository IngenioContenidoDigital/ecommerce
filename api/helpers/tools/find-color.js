module.exports = {
  friendlyName: 'Find color',
  description: '',
  inputs: {
    color:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config1.json');
    let csd = new AWS.CloudSearchDomain({endpoint: 'search-preditor1e-ffenvkc2nojr42drhfjrpvevry.us-east-1.cloudsearch.amazonaws.com'});
    let params = {
      query: inputs.color,
      return: 'id',
      queryParser: 'simple',
      size:5,
      sort:'_score desc',
      queryOptions: '{"defaultOperator":"or","fields":["color"]}',
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
      }
      return exits.success(results);
    }); 
  }
};

