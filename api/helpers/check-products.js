module.exports = {


    friendlyName: 'Product checker service',


    description: 'Check and validate a product list',


    inputs: {
        product: { type: 'ref' },
    },

    exits: {
        success: {
            description: 'All done.',
        },
    },

    fn: function (inputs) {
        return new Promise(async (resolve, reject) => {
            let pro = {}
            let p = inputs.product;
            let images = [];
            let variations = [];

            /*let categorize = async (categoryList) => {

                let clist = categoryList.map(c => c.name.toLowerCase().replace('amp;', ''));
                clist.push('inicio');

                //agregar categoria inicio
                let categories = await Category.find({
                    where: { name: clist },
                    sort: 'level DESC'
                });

                let categoriesids = [];

                for (let c in categories) {
                    if (!categoriesids.includes(categories[c].id)) {
                        categoriesids.push(categories[c].id);
                    }
                }

                let realcats = categories.filter(cat => categoriesids.includes(cat.parent));
                let rcatsids = [];

                for (let rc in realcats) {
                    if (!rc.includes(realcats[rc].id)) {
                        rcatsids.push(realcats[rc].id);
                    }
                }

                return rcatsids;
            }*/

                pro.name = p.name.toUpperCase().trim();

                if(!p.reference){
                    return reject({ name: 'NOPRODUCT', message: 'Producto ' + p.name + ' sin referencia' }) ;
                }

                pro.reference = p.reference.toUpperCase().trim();
                pro.description = p.description.toLowerCase().trim();
                pro.descriptionShort = p.descriptionShort.toLowerCase().trim();

                if (p.images) {
                    pro.images = p.images;
                }

                if(p.categories){
                    pro.categories = await sails.helpers.tools.findCategory(p.categories.join(' '));
                }

                if (pro.categories && pro.categories.length > 0) {
                    //let category = await Category.findOne({parent : pro.categories[0], name : p.gender.toLowerCase()});
                    pro.mainCategory = pro.categories[0];
                }

                if (p.manufacturer) {
                    Manufacturer.findOrCreate({ name: p.manufacturer.toLowerCase() }, { name: p.manufacturer.toLowerCase()}).exec(async (err, record, wasCreated) => {
                        if (err) { return console.log(err) }
                        
                        if(wasCreated) 
                            pro.manufacturer = (await Manufacturer.findOne({ name: record.name })).id;
                          else 
                            pro.manufacturer = (await Manufacturer.findOne({ name: record.name })).id;
                    });
                }else{
                    return reject({ name: 'NOBRANDS', message: 'Producto ' + p.name + ' sin marca' }) ;
                }

                let color = await sails.helpers.tools.findColor(p.name+' '+p.reference);
                
                if(color && color.length > 0){
                    pro.mainColor = color[0];
                }else{
                    return reject({ name: 'NOCOLOR', message: 'Producto ' + p.name + ' sin color' }) ;
                }

                if (p.gender) {
                    let gender = await sails.helpers.tools.findGender(p.name+' '+p.reference);
                    if (gender) {
                        pro.gender = gender[0];
                    } else {
                        pro.gender = (await Gender.findOne({ name: 'unisex' })).id;
                    }
                }
                
                if (p.tax) {
                    tax = (await Tax.findOne({ value: p.tax.rate }));
                    if(tax)
                        pro.tax = tax.id;
                } else {
                    tax  = (await Tax.findOne({ value: 0 }));
                    if(tax)
                        pro.tax = tax.id;
                }

                pro.seller = p.seller;
                pro.active = p.active;
                pro.width = p.width;
                pro.width = p.height;
                pro.length = p.length;
                pro.weight = p.weight;
                pro.price =  parseInt(p.price / (1 + (tax.value / 100)));

                if (p.variations && p.variations.length > 0) {
                    return resolve({...pro, variations : p.variations , images : pro.images});
                } else {
                    return reject({ name: 'NOVARIATION', message: 'Variación ' + p.description + ' no disponible para este producto' }) ;
                }
        });
    }

};
















