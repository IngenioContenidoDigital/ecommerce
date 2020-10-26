/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Integration = require("../models/Integration");

module.exports = {
  showcategories: async function (req,res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showcategories')){
      throw 'forbidden';
    }

    var error = null;
    let action = null;
    let childs = null;
    let id = null;
    let category = null;
    let parentId = 0;
    if(req.param('id')){
      id = req.param('id');
      category = await Category.findOne({id:id}).populate('parent');
      childs = await sails.helpers.categoryChildren(category.id);
      let parent = await Category.findOne({id:category.parent.id});
      parentId = parent.id;
    }else{
      category = await Category.findOne({name:'inicio'});
      childs = await sails.helpers.categoryChildren(category.id);
      parentId = category.id;
    }
    if(req.param('action')){
      action = req.param('action');
      childs['children'] = [await Category.findOne({name:'inicio'})];
    }
    return res.view('pages/catalog/categories',{layout:'layouts/admin',categories:childs.children,action:action,error:error,current:category,parent:parentId});
  },
  addcategory: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'addcategory')){
      throw 'forbidden';
    }
    var isActive=false;
    var error = null;
    if(req.body.activo==='on'){isActive=true;}
    let current = await Category.findOne({id:req.body.current});
    let dafiticat = '';
    let liniocat = '';
    if(req.body['dafiti[]']!==undefined){
      if(typeof req.body['dafiti[]']!=='string'){
        dafiticat = req.body['dafiti[]'].join(',');
      }else{
        dafiticat = req.body['dafiti[]'];
      }
    }
    if(req.body['linio[]']!==undefined){
      if(typeof req.body['linio[]']!=='string'){
        liniocat = req.body['linio[]'].join(',');
      }else{
        liniocat = req.body['linio[]'];
      }
    }
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/categories');
      await Category.create({
        name:req.body.nombre.trim().toLowerCase(),
        logo:filename[0].filename,
        description:req.body.descripcion,
        dafiti:dafiticat,
        linio: liniocat,
        parent:current.id,
        active:isActive,
        url:(current.name.trim().toLowerCase().replace(/\s/g,'-'))+'-'+(req.body.nombre.trim().toLowerCase()).replace(/\s/g,'-'),
        level:current.level+1
      }).fetch();
    }catch(err){
      error = err.msg;
      if(err.code==='badRequest'){
        await Category.create({
          name:req.body.nombre.trim().toLowerCase(),
          description:req.body.descripcion,
          parent:current.id,
          dafiti:dafiticat,
          linio: liniocat,
          active:isActive,
          url:(current.name.trim().toLowerCase().replace(/\s/g,'-'))+'-'+(req.body.nombre.trim().toLowerCase()).replace(/\s/g,'-'),
          level:current.level+1
        }).fetch();
      }
    }

    await Category.updateOne({id:current.id}).set({hasChildren:true});

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/categories/list');
    }else{
      return res.redirect('/categories/list?error='+error);
    }
  },
  editcategory: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editcategory')){
      throw 'forbidden';
    }
    var isActive=false;
    var error = null;
    const route = 'images/categories';
    let category = await Category.findOne({id:req.param('id')});
    let parent = await Category.findOne({id:req.body.current});
    let dafiticat = '';
    let liniocat = '';
    if(req.body['dafiti[]']!==undefined){
      if(typeof req.body['dafiti[]']!=='string'){
        dafiticat = req.body['dafiti[]'].join(',');
      }else{
        dafiticat = req.body['dafiti[]'];
      }
    }
    if(req.body['linio[]']!==undefined){
      if(typeof req.body['linio[]']!=='string'){
        liniocat = req.body['linio[]'].join(',');
      }else{
        liniocat = req.body['linio[]'];
      }
    }
    if(req.body.activo==='on'){isActive=true;}
    try{
      uploaded = await sails.helpers.fileUpload(req,'logo',2000000,route);
      await Category.updateOne({id:category.id}).set({
        name:req.body.nombre,
        description:req.body.descripcion,
        parent:parent.id,
        dafiti:dafiticat,
        linio: liniocat,
        logo:uploaded[0].filename,
        url:(parent.name.trim().toLowerCase().replace(/\s/g,'-'))+'-'+(category.name.trim().toLowerCase()).replace(/\s/g,'-'),
        active:isActive,
        level:parent.level+1});
    }catch(err){
      error = err.msg;
      if(err.code==='badRequest'){
        await Category.updateOne({id:category.id}).set({
          name:req.body.nombre,
          description:req.body.descripcion,
          parent:parent.id,
          url:(parent.name.trim().toLowerCase().replace(/\s/g,'-'))+'-'+(category.name.trim().toLowerCase()).replace(/\s/g,'-'),
          dafiti:dafiticat,
          linio: liniocat,
          active:isActive,
          level:parent.level+1});
      }
    }
    if(req.body.parent!==parent.id){
      await Category.removeFromCollection(req.body.parent,'children').members([category.id]);
      await Category.addToCollection(parent.id,'children',category.id);
      await Category.updateOne({id:parent.id}).set({hasChildren:true});
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/categories/list');
    }else{
      return res.redirect('/categories/list?error='+error);
    }
  },
  deletecategory:async(req, res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let category = await Category.findOne({id:req.body.category})
    .populate('parent')
    .populate('children')
    .populate('products');
    if(category.children.length>0){
      for(let c in category.children){
        await Category.updateOne({id:category.children[c].id}).set({
          parent:category.parent.id
        });
      }
      await Category.updateOne({id:category.parent.id}).set({hasChildren:true});
    }
    if(category.products.length>0){
      for(let p in category.products){
        await Product.removeFromCollection(category.products[p].id,'categories').members([category.id]);
        await Product.addToCollection(category.products[p].id,'categories').members([category.parent.id]);
      }
    }
    await Category.destroyOne({id:category.id});
    return res.send('deleted');
  },
  getchildren: async function(req,res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var childs = await Category.findOne({id:id}).populate('children');

    return res.send(childs.children);
  },
  getparent: async function(req,res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var parent = await Category.findOne({id:id}).populate('parent');

    return res.send(parent);
  },
  categorystate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'categorystate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.param('active');
    var updatedCategory = await Category.updateOne({id:id}).set({active:state});
    return res.send(updatedCategory);
  },
  dafiticategories: async (req,res)=>{
    if(!req.isSocket){
      return res.badrequest();
    }
    try{
      let keys = await Integrations.find({where:{channel:'dafiti'},limit:1});
      if(keys.length>0){
        let route = await sails.helpers.channel.dafiti.sign('GetCategoryTree',keys[0].seller);
        let response = await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+route,'GET');
        return res.ok(JSON.parse(response));
      }else{
        return res.serverError();
      }
    }catch(err){
      return res.serverError(err);
    }
  },
  liniocategories: async (req,res)=>{
    if(!req.isSocket){
      return res.badrequest();
    }
    try{
      let keys = await Integrations.find({where:{channel:'linio'}, limit:1});
      if(keys.length > 0){
        let route = await sails.helpers.channel.linio.sign('GetCategoryTree', keys[0].seller);
        let response = await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+route,'GET');
        return res.ok(JSON.parse(response));
      }else{
        return res.serverError();
      }
    }catch(err){
      return res.serverError(err);
    }
  },
  categoryindex: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if ((rights.name !== 'superadmin') && !_.contains(rights.permissions,'updateindex')) {
      throw 'forbidden';
    }
    let documents = [];
    let categories = await Category.find({level:{'>=':4}});

    categories.forEach(pr => {
      let doc = {
        type: req.param('action'), // add or delete
        id: pr.id
      };

      if (req.param('action') === 'add') {
        doc['fields'] = {
          id: pr.id,
          category: pr.name
        };
      }
      documents.push(doc);
    });
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let endpoint = 'doc-predictor-1ecommerce-if3tuwyqkbztsy2a2j3voan7bu.us-east-1.cloudsearch.amazonaws.com';
    var csd = new AWS.CloudSearchDomain({ endpoint: endpoint });
    var params = {
      contentType: 'application/json', // required
      documents: JSON.stringify(documents) // required
    };
    csd.uploadDocuments(params, (err, data) => {
      if (err) { console.log(err, err.stack); } // an error occurred
      let index = new AWS.CloudSearch();
      index.indexDocuments({ DomainName: 'predictor-1ecommerce' }, (err, data) => {
        if (err) { console.log(err); }
        console.log(data);
        return res.redirect('/inicio');
      });
    });
  },
  categoryscheme: async (req,res) =>{
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let cloudsearch = new AWS.CloudSearch();  
    let params = {
      AnalysisScheme: { /* required */
        AnalysisSchemeLanguage: 'es', /* required */
        AnalysisSchemeName: 'category_scheme', /* required */
        AnalysisOptions: {
          AlgorithmicStemming: 'full',
          //StemmingDictionary: 'STRING_VALUE',
          Stopwords: JSON.stringify(["de","la","que","el","en","y","a","los","del","se","las","por","un","para","con","no","una","su","al","lo","como","más","pero","sus","le","ya","o","este","sí","porque","esta","entre","cuando","muy","sin","sobre","también","me","hasta","hay","donde","quien","desde","todo","nos","durante","todos","uno","les","ni","contra","otros","ese","eso","ante","ellos","e","esto","mí","antes","algunos","qué","unos","yo","otro","otras","otra","él","tanto","esa","estos","mucho","quienes","nada","muchos","cual","poco","ella","estar","estas","algunas","algo","nosotros","mi","mis","tú","te","ti","tu","tus","ellas","nosotras","vosotros","vosotras","os","mío","mía","míos","mías","tuyo","tuya","tuyos","tuyas","suyo","suya","suyos","suyas","nuestro","nuestra","nuestros","nuestras","vuestro","vuestra","vuestros","vuestras","esos","esas","estoy","estás","está","estamos","estáis","están","esté","estés","estemos","estéis","estén","estaré","estarás","estará","estaremos","estaréis","estarán","estaría","estarías","estaríamos","estaríais","estarían","estaba","estabas","estábamos","estabais","estaban","estuve","estuviste","estuvo","estuvimos","estuvisteis","estuvieron","estuviera","estuvieras","estuviéramos","estuvierais","estuvieran","estuviese","estuvieses","estuviésemos","estuvieseis","estuviesen","estando","estado","estada","estados","estadas","estad","he","has","ha","hemos","habéis","han","haya","hayas","hayamos","hayáis","hayan","habré","habrás","habrá","habremos","habréis","habrán","habría","habrías","habríamos","habríais","habrían","había","habías","habíamos","habíais","habían","hube","hubiste","hubo","hubimos","hubisteis","hubieron","hubiera","hubieras","hubiéramos","hubierais","hubieran","hubiese","hubieses","hubiésemos","hubieseis","hubiesen","habiendo","habido","habida","habidos","habidas","soy","eres","es","somos","sois","son","sea","seas","seamos","seáis","sean","seré","serás","será","seremos","seréis","serán","sería","serías","seríamos","seríais","serían","era","eras","éramos","erais","eran","fui","fuiste","fue","fuimos","fuisteis","fueron","fuera","fueras","fuéramos","fuerais","fueran","fuese","fueses","fuésemos","fueseis","fuesen","siendo","sido","tengo","tienes","tiene","tenemos","tenéis","tienen","tenga","tengas","tengamos","tengáis","tengan","tendré","tendrás","tendrá","tendremos","tendréis","tendrán","tendría","tendrías","tendríamos","tendríais","tendrían","tenía","tenías","teníamos","teníais","tenían","tuve","tuviste","tuvo","tuvimos","tuvisteis","tuvieron","tuviera","tuvieras","tuviéramos","tuvierais","tuvieran","tuviese","tuvieses","tuviésemos","tuvieseis","tuviesen","teniendo","tenido","tenida","tenidos","tenidas","tened"]),
          Synonyms: JSON.stringify({
            "groups": [
              ["cangurera","riñonera"],
              ["morral","mochila"],
              ["balón","bola","pelota","balon"],
              ["termo","caramañola","botilito"],
              ["conjunto deportivo","sudadera"],
              ["chaqueta","chammara"],
              ["cinturón","correa"],
              ["masculino","hombre","señor","caballero","ombre","macho","hombres","viejo"],
              ["femenino","mujer","dama","señora","mujeres","hembra","vieja","femenina"],
              ["niño","muchacho","joven","junior","infante","niños"],
              ["niña","muchacha","jovencita","junior","infanta",]
            ],
            "aliases": {
              "relojes para hombre": ["reloj hombre","reloj deportivo hombre"],
              "relojes para mujer": ["reloj mujer","relojes mujer"],
              "cinturones y correas para hombre": ["correas hombre","cinturon hombre","correa deportiva hombre","correa hombre","cinturón hombre","correa casual hombre","correa casual para hombre","correa travel hombre","correa formal hombre"],
              "anillos para mujer": ["anillos mujer"],
              "aretes para mujer": ["aretes","areta","aretas"],
              "collares y cadenas para mujer": ["collares mujer","cadenas mujer"],
              "cuellos y bufandas para mujer": ["cuellos mujer","bufandas mujer"],
              "pulseras y brazaletes para mujer": ["pulsera mujer","pulzera mujer","brasaleta mujer","brazalete mujer"],
              "billeteras para hombre": ["billetera hombre"],
              "maletas y morrales para hombre": ["maleta hombre","morral hombre","maleta masculino","morral masculino","bolso hombre","bolso travel hombre","bolso formal hombre","portafolio hombre","portfolio hombre","mochila hombre"],
              "maletas y morrales para Mujer": ["maleta mujer","morral mujer","maleta femenino","morral femenino","mochila mujer","bolso nike mujer"],
              "gorras y sombreros casuales para hombre": ["sombrero casual hombre","gorro casual hombre"],
              "gorras y sombreros casuales para mujer": ["sombrero mujer","gorro casual mujer"],
              "gorras y sombreros deportivos para hombre": ["gorra hombre","cachucha hombre","gorra adidas"],
              "cangureras para hombre": ["cangureras hombre","riñonera hombre"],
              "cangureras para mujer": ["cangureras mujer","riñonera mujer"],
              "bolsos y carteras para mujer": ["bolsos","carteras","bolso mujer","cartera dama","manos libres","cartera mujer"],
              "billeteras para mujer": ["billetera mujer","porta documentos","porta billetes","billeteras mujer","billetera dama","monedero","monederos"],
              "tapabocas": ["tapaboca","barbijo","mascarilla n95","mascarilla pro95","kn95","n95","mascarilla válvula","tapabocas termosellado"],
              "bienestar – relajación y estrés": ["suplementos","sumplemento","suplemento","té","estrés","relajarse","mix frutal"],
              "control de peso": ["quemador de grasa","flora intestinal","fibra","regulador de peso","bajar de peso"],
              "cremas corporales y tratamientos": ["tónico","body countour","crema hidratante","loción hidratante","tratamiento cuerpo","crema corporal","moldeador"],
              "cuidado de manos": ["guates silicona","guantes látex","guantes nitrilo","guantes vinilo"],
              "desodorantes y antitranspirantes": ["rollon","roll-on","antitranspirante","desodorante","crema desodorante","anti transpirante"],
              "perfumes para mujer": ["fragancia mujer","perfume femenino","perfume dama"],
              "perfumes para hombre": ["fragancia hombre","perfume masculino","perfume caballero"],
              "pestañinas": ["pestañina","lashes","magnetic lashes"],
              "tratamiento para cejas": ["betun cejas","betún cejas"],
              "delineador de cejas": ["lápiz cejas","delineador cejas","lapiz cejas"],
              "depilación": ["depilador","depilador liquido","depilador crema"],
              "tratamientos faciales": ["mascarilla","perfilador nariz","tratamiento rostro","tratamiento facial","mascarilla rostro","tratamiento cara"],
              "sombras": ["sombra mujer","sombra ojos"],
              "labiales": ["labial","colorete"],
              "bases para el rostro": ["base mujer","base facial","base de maquillaje","primer maquillaje","praimer","praimer maquillaje"],
              "correctores faciales": ["iluminador rostro","contorno rostro","corrector facial","iluminador facial","corrector rostro"],
              "delineadores para ojos": ["delineador ojos","delineador"],
              "brochas y accesorios": ["brochas mujer","kit maquillaje","accesorio maquillaje"],
              "cosmetiqueras y estuches": ["cosmetiquera","estuche cosmeticos","estuche mujer","cosmetiqueras","porta maquillaje","portamaquillaje"],
              "cuidado personal": ["combo bioseguridad","termómetro digital","careta","kit desinfección","lavamanos portatil","monogafa","monogafas","tensiómetro","oxímetro","señaletica","tapete desinfección","antifluido","protector orejas","paños humedos"],
              "balones de futbol": ["balón fútbol","pelota soccer","balon futbol","balon barcelona","balon real madrid"],
              "balones de baloncesto": ["balón basket","pelota","balon baloncesto","balon lakers","balon bulls","balon miami heat","balon celtics"],
              "equipo y elementos de protección": ["equipamiento","equipo","protección","canillera","espinillera"],
              "guayos": ["guayos","guayo"],
              "hidratación": ["botilito","botella","tarro","frasco","caramañola","termo","thermos","thermo mujer","thermo hombre"],
              "boxeo": ["protector bucal","guante boxeo","guantes box","protector boxeo"],
              "accesorios de limpieza": ["dispensador","gel antibacterial","vaporizador desinfectante","desinfectante","esterilizador","atomizador","bomba aspersion","cabina desinfeccion","germicida","lampara gericida","pistola desinfectante","kit desinfección","alcohol","hipoclorito","jabón liquido"],
              "camisas manga larga para hombre": ["camisa manga larga hombre","camisa manga larga masculino"],
              "sacos para hombre": ["sacos hombre","sueter hombre"],
              "abrigos y cardigans para hombre": ["abrigos hombre","cardigans hombre"],
              "chaquetas casuales para hombre": ["chaquetas casuales hombre","cazadora hombre"],
              "chalecos hombre": ["chalecos hombre"],
              "pantalones regulares para hombre": ["pantalones regulares hombre"],
              "jeans regular fit para hombre": ["jeans regular fit hombre"],
              "vestidos para hombre": ["vestidos paño","traje hombre","traje formal"],
              "buzos y hoodies para hombre": ["buzo hombre","buso hombre","judi hombre","hoodie hombre","hoody hombre","camibuso hombre","buso hombre adidas","buzo nike hombre"],
              "chaquetas deportivas para hombre": ["chaqueta entrenamiento hombre","chaqueta entrenar hombre","chammara hombre","chaqueta deportiva"],
              "pantalones deportivos para hombre": ["pantalón deportivo hombre","pantalones deporte","pantalón hombre adidas","pantalon adidas","pantalon nike"],
              "camisetas para hombre": ["camiseta hombre","camiseta masculina","camiseta hombre adidas","camiseta hombre nike","camiseta hombre reebok","camiseta hombre fila"],
              "camisetas para mujer": ["camiseta mujer","camiseta femenina","camiseta mujer adidas","camiseta mujer reebok","camiseta mujer nike","camiseta mujer fila"],
              "camisetas para niños":[ "camiseta niño", "camiseta niños" ],
              "camisetas para niñas":[ "camiseta niña", "camiseta niñas" ],
              "chaquetas deportivas para mujer": ["chaquetas entrenar mujer","chaquetas entrenamiento mujer","chaquetas deportivas femeninas","chaquetas deportivas","chaqueta mujer adidas","chaqueta mujer nike"],
              "pantalones Deportivos para Mujer": ["pantalones entrenamiento para mujer","pantalones deportivos mujer","pantalón deportivo femenino"],
              "shorts y pantalonetas para mujer": ["shorts dama","pantaloneta mujer","shorts mujer","pantaloneta dama","pantaloneta femenina","short mujer"],
              "shorts y pantalones para hombre": ["shorts caballero","pantaloneta hombre","shorts hombre","pantaloneta caballero","pantaloneta masculino"],
              "hoodies y buzos para mujer": ["buzo mujer","buso mujer","judi mujer","hoodie mujer","hoody mujer","buzo dama","buso dama","judi dama","hoodie dama","hoody dama","camibuso para mujer"],
              "medias para hombre": ["medias hombre"],
              "medias para mujer": ["medias mujer"],
              "sudaderas y conjuntos para hombre": ["sudaderas y conjuntos hombre","sudadera hombre","conjunto deportivo hombre","conjunto nike hombre","conjunto adidas mujer"],
              "sudaderas y conjuntos para mujer": ["sudaderas y conjuntos mujer","sudadera mujer","conjunto deportivo mujer","conjunto nike mujer","conjunto adidas mujer"], 
              "sudaderas para niños":[ "conjunto adidas niños", "conjunto nike niños", "sudadera niño" ], 
              "sudaderas para niñas":[ "conjunto adidas niñas", "conjunto nike niñas", "sudadera niña" ],
              "blusa manga larga para mujer": ["blusa manga larga","blusa","blusa ana mendez","blusa mujer"],
              "leggins y lycras": ["chicles","leggins","legin","licra","lycra","elásticos","leggins mujer","leggings"],
              "Enterizos Para Mujer": ["Body mujer"],
              "Tops Para Mujer": ["tops","crop top","top para mujer"],
              "vestido corto para mujer": ["vestido mujer","vestido corto","vestidos cortos para mujer"],
              "potenciadores": ["potenciador","líbido","Ginseng","energía sexual"],
              "proteínas": ["batido","proteina","generador masa muscular","batido energizante","proteina deportiva"],
              "casuales para hombre": ["zapatos casuales hombre","casuales masculino","zapatos de calle","zapato clasico hombre","zapato clásico hombre","zapato hombre"],
              "formales para hombre": ["zapatos vestido","zapatos formales hombre"],
              "sandalias para hombre": ["sandalias hombre"],
              "botines": ["botines"],
              "botas caña alta": ["botas altas","bota tejana mujer"],
              "tacón alto": ["tacón puntilla","zapatos altos"],
              "tacón bajo": ["tacón bajito","zapatos bajos","zapatos bajitos"],
              "botas caña media": ["caña media","botas medias"],
              "botas outdoor para mujer": ["trekking mujer","outdoor mujer","hiking mujer"],
              "calzado outdoor para hombre": ["zapatos outdoor hombre","botas outdoor masculino","outdoor hombre"],
              "tacón medio": ["tacón mediano","zapatos de tacón mediano"],
              "botas casuales para hombre": ["botas casuales hombre"],
              "tenis de moda para hombre": ["lifestyle hombre","zapatillas hombre","sportwear hombre","sportswear hombre","sportwear","urban","urbano"],
              "tenis deportivos para hombre": ["tenis hombre","running hombre","training hombre","zapatilla hombre","atletismo hombre","running hombre","correr hombre","tenis adidas hombre","tenis nike hombre","tenis skechers hombre","tenis puma hombre","zapatillas nike hombre","zapatillas adidas hombre"],
              "tenis deportivos para mujer": ["tenis mujer","running mujer","training mujer","zapatilla mujer","atletismo mujer","running mujer","correr mujer","training mujer","tenis adidas mujer","tenis nike mujer","tenis skechers mujer","tenis puma mujer","zapatillas nike mujer","zapatillas adidas mujer"],
              "tenis de moda para mujer": ["tenis femeninos","tenis mujer","lifestyle mujer","sportwear mujer","sportswearmujer","sportwear","urban","urbano"],
              "botas deportivas para hombre": ["botas deportivas hombre","bota hombre skechers","botas hombre nike","botas hombre adidas","botas hombre puma"],
              "botas deportivas mujer": ["botas deportivas mujer","bota mujer skechers","botas mujer nike","botas mujer adidas","botas mujer puma"],
              "tenis casuales para mujer": ["tenis mujer","tenis casuales","tenis chunky","tenis casual dama"],
              "alpargatas para mujer": ["alpargatas mujer"],
              "casuales para mujer": ["zapatos casuales mujer"],
              "baletas": ["baletas","baleticas","baleta espadrila","baleta"],
              "suecos": ["zapatos suecos","zuecos","zapatos tipo sueco"],
              "plataformas y tacón corrido": ["zapatos plataforma","tacón corrido","plataformas"],
              "playeras para mujer": ["sandalias playa mujer","chanclas playa","chancletas mujer"],
              "deportivos para niños": ["tenis baby","tenis niño","tenis niños","tenis infantil","zapatilla niños","tenis nike niño","tenis adidas niño","tenis skechers niño"],
              "guantes para gimnasio": ["guantes fitness","guantes gym","guantes gimnasio"],
              "deportivos para niñas":[ "tenis niñas", "tenis niña", "tenis nike niña", "tenis adidas niña", "tenis skechers niña" ]
            }
          })
        }
      },
      DomainName: 'predictor-1ecommerce' /* required */
    };
    cloudsearch.defineAnalysisScheme(params, function(err, data) {
      if (err){console.log(err, err.stack);} // an error occurred
      console.log(data);           // successful response
      return res.redirect('/inicio');
    });
  }
};
