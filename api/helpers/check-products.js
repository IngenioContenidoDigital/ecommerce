module.exports = {
  friendlyName: 'Product checker service',
  description: 'Check and validate a product list',
  inputs: {
    product: { type: 'ref' },
    seller: { type: 'string' }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async (inputs, exits) => {
    let removeWords = require( '@stdlib/string-remove-words' );

    let words = ['gama', 'usado', 'usados', 'células', 'pólvora', 'narcótico', '-virus-', 'virus', 'remedio', 'celulas', 'célula', 'cono', 'licencia', 'enfermedad', 'engystol', 'ice', 'cura',
      'polvora', 'envio', 'gratis', 'quimicos', 'artrin', 'productos', 'zeel', 'similar', 'envío'];

    let pro = {};
    let gen = null;
    pro.name = inputs.product.name.toLowerCase().trim();

    if(!inputs.product.reference){
      throw new Error(`${pro.name} sin referencia`);
    }

    pro.reference = inputs.product.reference.toUpperCase().trim();
    pro.description = inputs.product.description.trim();
    pro.descriptionShort = inputs.product.descriptionShort.trim();
    pro.color = inputs.product.color || '';
    let textPredictor = inputs.product.textLink ? inputs.product.textLink : inputs.product.name+' '+inputs.product.reference;

    pro.description = pro.description.replace(/\¿\w+\s\w+\?\s.*\s\w+\s\(\+(\d|\s)*\)\sext\.\s\d+/g,'');
    pro.description = pro.description.replace(/(\w+\s\w+){1}\s*\?(\s\w+\s\w+\s\w+\s){1}\(\+(\d|\s)*\)/g,'');

    pro.name = removeWords(pro.name, words, true).replace(/  +/g, ' ');
    pro.description = removeWords(pro.description, words, true).replace(/  +/g, ' ');
    pro.descriptionShort = removeWords(pro.descriptionShort, words, true).replace(/  +/g, ' ');

    if(inputs.product.manufacturer){
      let brand = (await Manufacturer.findOne({ name: inputs.product.manufacturer.toLowerCase() }));
      if(!brand){
        let manufact = await Manufacturer.create({
          name: inputs.product.manufacturer.toLowerCase(),
          logo: '',
          linioname: 'Generico',
          description: inputs.product.manufacturer,
          url: inputs.product.manufacturer.toLowerCase(),
          active: false
        });
        pro.manufacturer = manufact.id;
      } else {
        pro.manufacturer = brand.id;
      }
    }else{
      throw new Error(`Ref: ${pro.reference} : ${pro.name} sin marca`);
    }

    let color = await sails.helpers.tools.findColor(`${pro.color ? (textPredictor + ' ' + pro.color) : textPredictor}`);
    let defaultColor = await Color.findOne({name: 'blanco'});
    if(color && color.length > 0){
      pro.mainColor = color[0];
    }else{
      pro.mainColor = defaultColor.id;
    }

    let gender = await sails.helpers.tools.findGender(textPredictor);
    if (gender && gender.length>0) {
      pro.gender = gender[0];
      gen = await Gender.findOne({id:gender[0]});
    } else {
      pro.gender = (await Gender.findOne({ name: 'unisex' })).id;
    }
    gen = gen ? gen.name : '';
    let cats = await sails.helpers.tools.findCategory(Array.from(new Set(`${textPredictor} ${gen} ${inputs.product.manufacturer}`.toLowerCase().split(' '))).join(' '));
    if(cats.length>0){
      pro.categories = cats;
      let main = await Category.find({id:cats}).sort('level DESC');
      pro.mainCategory = main[0].id;
    }else{
      pro.mainCategory = undefined;
    }

    if (inputs.product.tax) {
      tax = (await Tax.findOne({ value: inputs.product.tax.rate }));
      if(tax)
      {pro.tax = tax.id;}
    } else {
      tax  = (await Tax.findOne({ value: 0 }));
      if(tax)
      {pro.tax = tax.id;}
    }

    pro.seller = inputs.seller;
    pro.externalId = inputs.product.externalId || '';
    pro.register = inputs.product.register || '';
    pro.active = inputs.product.active;
    pro.width = (inputs.product.width === undefined || inputs.product.width === null || inputs.product.width < 1) ? 15 : inputs.product.width;
    pro.height = (inputs.product.height === undefined || inputs.product.height === null || inputs.product.height < 1) ? 15 : inputs.product.height;
    pro.length = (inputs.product.length === undefined || inputs.product.length === null || inputs.product.length < 1) ? 32 : inputs.product.length;
    pro.weight = (inputs.product.weight === undefined || inputs.product.weight === null || inputs.product.weight === 0) ? 1 : (inputs.seller === '60c144f4c90e3d77c4bc0e13' || inputs.seller === '5fdb7430710aa6e66628adf5' || inputs.seller === '612e67c526e3fa4772e1bde7') ? ((inputs.product.weight/1000) < 1 ? 1 : Math.round(inputs.product.weight/1000)) : inputs.product.weight;

    return exits.success(pro);
  }
};
