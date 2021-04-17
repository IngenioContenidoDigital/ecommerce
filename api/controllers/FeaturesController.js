/**
 * ManufacturersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  listfeatures: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'listfeatures')){
      throw 'forbidden';
    }
    let error=null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let features = await Feature.find();
    let feature=null;
    if(id){
      feature = await Feature.findOne({id:id}).populate('categories').populate('channels');
    }
    let category = await Category.findOne({name:'inicio'});
    // let channels = await Channel.find({type:'marketplace'});
    let channels = await Channel.find({name:['linio','dafiti']});
    console.log(channels);
    res.view('pages/catalog/features',{layout:'layouts/admin',features:features, action:action, error:error, feature:feature, category:category, channels:channels});
  },
  addfeature: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'addfeature')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let categories = req.body.categories;
    let channels = [];
    if (req.body.dafiti) {channels.push({channel:await Channel.findOne({name: 'dafiti'}), name:req.body.dafiti})}
    if (req.body.linio) {channels.push({channel:await Channel.findOne({name: 'linio'}), name:req.body.linio})}

    try{
      if(categories.length>0){
        let feature = await Feature.create({
          name:req.body.name.trim().toLowerCase(),
          description:req.body.description,
          active: isActive
        }).fetch();

        await Feature.addToCollection(feature.id,'categories').members(categories);

        for (let index = 0; index < channels.length; index++) {
          const element = channels[index];
          await FeatureChannel.create({
            channel:element.channel.id,
            channelname:element.channel.name,
            feature:feature.id,
            name: element.name
          }).fetch();
        }
      }
    }catch(err){
      error=err;
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/features');
    }else{
      return res.redirect('/features?error='+error);
    }
  },
  editfeature: async (req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editfeature')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    let categories = req.body.categories;
    let channels = [];
    if (req.body.dafiti) {channels.push({channel:await Channel.findOne({name: 'dafiti'}), name:req.body.dafiti})}
    if (req.body.linio) {channels.push({channel:await Channel.findOne({name: 'linio'}), name:req.body.linio})}

    try{
      let feature = await Feature.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        description:req.body.description,
        active:isActive
      });
      await Feature.replaceCollection(feature.id,'categories').members(categories);

      for (let index = 0; index < channels.length; index++) {
        const element = channels[index];
        await FeatureChannel.updateOne({channelname:element.channel.name, feature:feature.id}).set({
          name: element.name
        });
      }

    }catch(err){
      error=err;
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/features');
    }else{
      return res.redirect('/features?error='+error);
    }
  },
  featurestate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'featurestate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.param('active');
    var updatedFeature = await Feature.updateOne({id:id}).set({active:state});
    return res.send(updatedFeature);
  },
  deletefeature:async(req, res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let feature = await Feature.findOne({id:req.body.feature}).populate('categories');
    let result = feature.categories.map(a => a.id);
    await Feature.removeFromCollection(feature.id,'categories').members(result);
    await Feature.destroyOne({id:feature.id});
    await ProductFeature.destroy({feature:feature.id});
    await FeatureChannel.destroy({feature:feature.id});
    return res.send('deleted');
  },
  addproductfeature:async(req, res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let data = req.body.data;
    try{
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        let product = element.product;
        let feature = element.feature;
        let value = element.value;
        let product_feature = null;

        let exists = await ProductFeature.findOne({product:product, feature:feature});
        if (!exists) {
          product_feature = await ProductFeature.create({
            product:product,
            feature:feature,
            value:value
          });
        } else {
          product_feature = await ProductFeature.updateOne({product:product, feature:feature}).set({
            product:product,
            feature:feature,
            value:value
          });
        }
        
      }

    }catch(err){
      console.log(err);
      return res.badRequest();
    }
    return res.send();
  },
  dafitifeatures: async (req,res)=>{
    if(!req.isSocket){
      return res.badrequest();
    }
    try{
      let channel = await Channel.find({name: 'dafiti'});
      let integration = await Integrations.find({where:{channel:channel[0].id},limit:1});
      let features = []; 
      let categories = await Category.find({id:req.body.categories});
      let mkp_categories = [];

      for (let index = 0; index < categories.length; index++) {
        let category = categories[index];

        let cd = category.dafiti.split(',');
        for(let dd of cd){
          mkp_categories.push(dd);
        }
  
        for (let index = 0; index < mkp_categories.length; index++) {
  
          const element = mkp_categories[index];
          if(integration.length>0){
            let route = await sails.helpers.channel.dafiti.sign(integration[0].id,'GetCategoryAttributes',integration[0].seller, [`PrimaryCategory=${element}`]);
            await sails.helpers.request(channel[0].endpoint,'/?'+route,'GET')
            .then(async (resData)=>{
              resData = JSON.parse(resData);
              if (resData.SuccessResponse) {
                features = features.concat(resData.SuccessResponse.Body.Attribute);
              }
            });
          }else{return res.serverError();}
          
        }
  
      }

      let allfeatures = Object.values(feaures = features.reduce((r,o) => {r[o.FeedName] = o; return r;},{}));
      const result = allfeatures.filter(f => f.IsGlobalAttribute !== '1' && f.FeedName !== 'Variation');
      return res.ok(result);

    }catch(err){
      console.log(err);
      return res.serverError(err);
    }
  },
  liniofeatures: async (req,res)=>{
    if(!req.isSocket){
      return res.badrequest();
    }
    if(!req.isSocket){
      return res.badrequest();
    }
    try{
      let channel = await Channel.find({name: 'linio'});
      let integration = await Integrations.find({where:{channel:channel[0].id},limit:1});
      let features = []; 
      let categories = await Category.find({id:req.body.categories});
      let mkp_categories = [];

      for (let index = 0; index < categories.length; index++) {
        let category = categories[index];

        let cd = category.linio.split(',');
        for(let dd of cd){
          mkp_categories.push(dd);
        }
  
        for (let index = 0; index < mkp_categories.length; index++) {
  
          const element = mkp_categories[index];
          if(integration.length>0){
            let route = await sails.helpers.channel.linio.sign(integration[0].id,'GetCategoryAttributes',integration[0].seller, [`PrimaryCategory=${element}`]);
            await sails.helpers.request(channel[0].endpoint,'/?'+route,'GET')
            .then(async (resData)=>{
              resData = JSON.parse(resData);
              if (resData.SuccessResponse) {
                features = features.concat(resData.SuccessResponse.Body.Attribute);
              }
            });
          }else{return res.serverError();}
          
        }
  
      }

      let allfeatures = Object.values(feaures = features.reduce((r,o) => {r[o.FeedName] = o; return r;},{}));
      const result = allfeatures.filter(f => f.IsGlobalAttribute !== '1' && (f.FeedName !== 'Variation' && f.FeedName !=='FilterColor'&& f.FeedName !=='Gender'));
      // console.log(result);
      return res.ok(result);

    }catch(err){
      console.log(err);
      return res.serverError(err);
    }
  },
};

