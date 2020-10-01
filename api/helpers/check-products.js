module.exports = {


    friendlyName: 'Product checker service',


    description: 'Check and validate a product list',


    inputs: {
        product: { type: 'ref' },
        seller: { type: 'string' },
    },

    exits: {
        success: {
            description: 'All done.',
        },
    },

    fn: async (inputs, exits) => {
            let pro = {}
                pro.name = inputs.product.name.toUpperCase().trim();

                if(!inputs.product.reference){
                    throw new Error(`${pro.name} sin referencia`);
                }

                pro.reference = inputs.product.reference.toUpperCase().trim();
                pro.description = inputs.product.description.toLowerCase().trim();
                pro.descriptionShort = inputs.product.descriptionShort.toLowerCase().trim();

                let cats = await sails.helpers.tools.findCategory(inputs.product.name+' '+inputs.product.reference);
                if(cats.length>0){
                    pro.categories = cats;
                    let main = await Category.find({id:cats}).sort('level DESC');
                    pro.mainCategory = main[0].id;
                }

                if(inputs.product.manufacturer){
                    pro.manufacturer = (await Manufacturer.findOne({ name: inputs.product.manufacturer.toLowerCase() })).id;
                }else{
                    throw new Error(`Ref: ${pro.reference} : ${pro.name} sin marca`);
                }

                let color = await sails.helpers.tools.findColor(inputs.product.name+' '+inputs.product.reference);
                
                if(color && color.length > 0){
                    pro.mainColor = color[0];
                }else{
                    throw new Error(`Ref: ${pro.reference} : ${pro.name} sin color`);
                }

                if (inputs.product.gender) {
                    let gender = await sails.helpers.tools.findGender(inputs.product.name+' '+inputs.product.reference);
                    if (gender && gender.length>0) {
                        pro.gender = gender[0];
                    } else {
                        pro.gender = (await Gender.findOne({ name: 'unisex' })).id;
                    }
                }
                
                if (inputs.product.tax) {
                    tax = (await Tax.findOne({ value: inputs.product.tax.rate }));
                    if(tax)
                        pro.tax = tax.id;
                } else {
                    tax  = (await Tax.findOne({ value: 0 }));
                    if(tax)
                        pro.tax = tax.id;
                }

                pro.seller = inputs.seller;
                pro.externalId = inputs.product.externalId || '';
                pro.active = inputs.product.active;
                pro.width = (inputs.product.width === undefined || inputs.product.width === null || inputs.product.width < 1) ? 15 : inputs.product.width;
                pro.height = (inputs.product.height === undefined || inputs.product.height === null || inputs.product.height < 1) ? 15 : inputs.product.height;
                pro.length = (inputs.product.length === undefined || inputs.product.length === null || inputs.product.length < 1) ? 32 : inputs.product.length;
                pro.weight = (inputs.product.weight === undefined || inputs.product.weight === null || inputs.product.weight === 0) ? 1 : inputs.product.weight;
                pro.price =  (inputs.product.price / (1 + (tax.value/100)));

                return exits.success(pro);
          
    }

};
