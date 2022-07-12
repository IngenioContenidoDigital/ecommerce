module.exports = {
  friendlyName: 'Find category',
  description: '',
  inputs: {
    category:{
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
      query: inputs.category,
      return: 'id',
      queryParser: 'simple',
      size:10,
      sort:'_score desc',
      queryOptions: '{"defaultOperator":"or","fields":["category"]}',
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
    let buildTree = async (ct) => {
      let cat = await Category.findOne({id:ct});

      if(cat && cat.level>1 && !results.includes(cat.id)){
        results.push(cat.id);
        await buildTree(cat.parent);
      }else{
        return;
      }
    }
    csd.search(params, async (err, data) => {

      if(err){return exits.error(err);}      
      if(data.hits.found>0){
        await buildTree(data.hits.hit[0].id);
      }
      return exits.success(results);
    }); 
  }
};

