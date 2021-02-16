module.exports = {
    friendlyName: 'Product Walmart',
    description: 'Product Walmart.',
    inputs: {
      categories:{
        type:'ref',
        required:true,
      },
      variant:{
        type:'boolean',
        required:true,
      },
      action:{
        type:'string',
        required:true,
      },
      productvariation:{
        type:'ref',
        required:true,
      },
      images:{
        type:'ref',
        required:true,
      },
      product:{
        type:'ref',
        required:true,
      },
      primary_variant:{
        type:'boolean',
        required:true,
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs,exits) {

        var jsonxml = require('jsontoxml');

        let categories = inputs.categories;
        let variant = inputs.variant;
        let action = inputs.action;
        let productvariation = inputs.productvariation;
        let images = inputs.images;
        let product = inputs.product;

        let json = {
            "MPItem": {
            "processMode": "PARTIAL_UPDATE",
            "sku": "a",
            "productIdentifiers": {
                "productIdentifier": {
                "productIdType": "EAN",
                "productId": "a"
                }
            },
            "MPProduct": {
                "productName": "a",
                "category": {
                "HealthAndBeauty": {
                    "MedicalAids": {
                    "volts": {
                        "measure": "0",
                        "unit": "kV"
                    },
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Suecia: Suiza"
                    },
                    "Optical": {
                    "frameColor": "Bronce",
                    "uvProtection": "Sí",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "isPolarized": "Sí",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Uzbekistán",
                    "modelStyleType": "a"
                    },
                    "MedicineAndSupplements": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "itemsIncluded": "a",
                    "modelStyleType": "a",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "months"
                    },
                    "countryOfOriginAssembly": "Corea del Sur"
                    },
                    "PersonalCare": {
                    "warningText": "a",
                    "countryOfOriginAssembly": "Palaos",
                    "itemsIncluded": "a",
                    "warrantyText": "a",
                    "scentFamily": "a",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "countPerPack": "0",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "colorCategory": { "colorCategoryValue": "Camello" },
                    "gender": "Unisex",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "spfValue": "0",
                    "modelStyleType": "a"
                    },
                    "HealthAndBeautyElectronics": {
                    "volts": {
                        "measure": "0",
                        "unit": "kVAC"
                    },
                    "watts": {
                        "measure": "0",
                        "unit": "KW"
                    },
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "modelStyleType": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Rojo" },
                    "gender": "Unisex",
                    "countryOfOriginAssembly": "Santo Tomé y Príncipe",
                    "itemsIncluded": "a",
                    "warningText": "a",
                    "shortDescription": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    }
                    }
                },
                "FurnitureCategory": {
                    "Furniture": {
                    "countryOfOriginAssembly": "Omán",
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    },
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Transparente" },
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "isAssemblyRequired": "No",
                    "recommendedUses": { "recommendedUse": "a" },
                    "modelStyleType": "a",
                    "itemsIncluded": "a"
                    }
                },
                "Home": {
                    "Bedding": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "bedSize": "Matrimonial",
                    "countryOfOriginAssembly": "Kuwait",
                    "itemsIncluded": "a",
                    "modelStyleType": "a",
                    "brand": "a"
                    },
                    "LargeAppliances": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "size": "a",
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Croacia"
                    },
                    "HomeOther": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "countryOfOriginAssembly": "Pakistán",
                    "modelStyleType": "a",
                    "itemsIncluded": "a"
                    }
                },
                "ArtAndCraftCategory": {
                    "ArtAndCraft": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Madera" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Liechtenstein",
                    "warningText": "a"
                    }
                },
                "FoodAndBeverageCategory": {
                    "AlcoholicBeverages": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "alcoholContentByVolume": "a",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "countryOfOriginAssembly": "Noruega",
                    "ingredients": "a"
                    },
                    "FoodAndBeverage": {
                    "saturatedFatPerServing": {
                        "measure": "0",
                        "unit": "cal"
                    },
                    "sodiumPerServing": {
                        "measure": "0",
                        "unit": "mg"
                    },
                    "sugarPerServing": {
                        "measure": "0",
                        "unit": "mg"
                    },
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "calories": {
                        "measure": "0",
                        "unit": "kcal"
                    },
                    "totalFat": {
                        "measure": "0",
                        "unit": "cal"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "countryOfOriginAssembly": "San Marino",
                    "ingredients": "a",
                    "servingsPerContainer": "0",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    }
                    }
                },
                "ToolsAndHardware": {
                    "Tools": {
                    "isCordless": "No",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Vino" },
                    "countryOfOriginAssembly": "Rusia",
                    "modelStyleType": "a",
                    "itemsIncluded": "a"
                    },
                    "Hardware": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "color": "a",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Alemania"
                    },
                    "PlumbingAndHVAC": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Café" },
                    "countryOfOriginAssembly": "Australia",
                    "itemsIncluded": "a",
                    "modelStyleType": "a"
                    },
                    "Electrical": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "color": "a",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Bahamas"
                    },
                    "ToolsAndHardwareOther": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Beige" },
                    "countryOfOriginAssembly": "Chad",
                    "modelStyleType": "a",
                    "itemsIncluded": "a"
                    }
                },
                "Photography": {
                    "CamerasAndLenses": {
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Mauritania",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Acero Inox" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "batteryTechnologyType": "Botón",
                    "memoryCardType": { "memoryCardTypeValue": "a" },
                    "keywords": "a",
                    "cameraLensType": "Fijo",
                    "modelStyleType": "a",
                    "graphicsInformation": "1080p (FHD)"
                    },
                    "PhotoAccessories": {
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Nueva Zelanda",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "keywords": "a",
                    "modelStyleType": "a"
                    }
                },
                "SportAndRecreation": {
                    "Cycling": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Acero Inox" },
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "months"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "República Democrática del Congo"
                    },
                    "SportAndRecreationOther": {
                    "numberOfPlayers": {
                        "minimumNumberOfPlayers": "0",
                        "maximumNumberOfPlayers": "0"
                    },
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Vino" },
                    "sport": "a",
                    "gender": "Niña",
                    "size": "a",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "years"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "capacity": "a",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Rusia"
                    }
                },
                "Animal": {
                    "AnimalHealthAndGrooming": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "scent": "Frutal",
                    "colorCategory": { "colorCategoryValue": "Bronce" },
                    "countryOfOriginAssembly": "Australia",
                    "modelStyleType": "a",
                    "itemsIncluded": "a"
                    },
                    "AnimalAccessories": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Silver" },
                    "size": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Somalia"
                    },
                    "AnimalFood": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "flavor": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "countryOfOriginAssembly": "Japón",
                    "itemsIncluded": "a",
                    "modelStyleType": "a",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "years"
                    }
                    },
                    "AnimalEverythingElse": {
                    "countryOfOriginAssembly": "Bulgaria",
                    "itemsIncluded": "a",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "size": "a",
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Rosa Dorado" },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "modelStyleType": "a"
                    }
                },
                "GardenAndPatioCategory": {
                    "GrillsAndOutdoorCooking": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Cedro" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "isAssemblyRequired": "No",
                    "recommendedUses": { "recommendedUse": "a" },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Yibuti",
                    "material": "a"
                    },
                    "GardenAndPatio": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Plateado" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "isAssemblyRequired": "Sí",
                    "recommendedUses": { "recommendedUse": "a" },
                    "material": "a",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Países Bajos"
                    }
                },
                "OtherCategory": {
                    "fuelsAndLubricants": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Islas Salomón",
                    "modelStyleType": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    }
                    }
                },
                "OccasionAndSeasonal": {
                    "DecorationsAndFavors": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "size": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "colorCategory": { "colorCategoryValue": "Silver" },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Dinamarca"
                    },
                    "Costumes": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "colorCategory": { "colorCategoryValue": "Verde" },
                    "clothingSize": "Extra Grande",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "months"
                    },
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Guinea",
                    "itemsIncluded": "a"
                    }
                },
                "ToysCategory": {
                    "Toys": {
                    "isRemoteControlIncluded": "Sí",
                    "collection": "a",
                    "productLine": "a",
                    "isArticulated": "Sí",
                    "warningText": "a",
                    "shoeSize": "25.5 (MX)",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Chocolate" },
                    "gender": "Unisex",
                    "size": "a",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "years"
                    },
                    "educationalFocus": { "educationalFocus": "Lectura" },
                    "character": "a",
                    "activity": "Pinceles",
                    "numberOfPlayers": {
                        "minimumNumberOfPlayers": "0",
                        "maximumNumberOfPlayers": "0"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "material": "a",
                    "seatingCapacity": "5",
                    "recommendedUses": { "recommendedUse": "a" },
                    "countryOfOriginAssembly": "Kenia",
                    "itemsIncluded": "a",
                    "modelStyleType": "a"
                    }
                },
                "Baby": {
                    "BabyFood": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "months"
                    },
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Lituania",
                    "modelStyleType": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "recommendedUses": { "recommendedUse": "a" },
                    "warningText": "a",
                    "colorCategory": { "colorCategoryValue": "Fucsia" },
                    "color": "a"
                    },
                    "BabyOther": {
                    "warningText": "a",
                    "itemsIncluded": "a",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Azul" },
                    "diaperSize": "a",
                    "material": "a",
                    "gender": "Niña",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "years"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Trinidad y Tobago",
                    "recommendedUses": { "recommendedUse": "a" }
                    },
                    "ChildCarSeats": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Tabaco" },
                    "material": "a",
                    "gender": "Niño",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "months"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "recommendedUses": { "recommendedUse": "a" },
                    "warningText": "a",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Bosnia y Herzegovina"
                    },
                    "BabyFurniture": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Café" },
                    "gender": "Mujer",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "years"
                    },
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Lesoto",
                    "warningText": "a"
                    },
                    "BabyToys": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Madera" },
                    "material": "a",
                    "gender": "Mujer",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "months"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "recommendedUses": { "recommendedUse": "a" },
                    "warningText": "a",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Lituania",
                    "size": "a"
                    }
                },
                "FootwearCategory": {
                    "Footwear": {
                    "shoeLength": {
                        "measure": "a",
                        "unit": "cm"
                    },
                    "shoeSoleMaterial": "a",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Verde" },
                    "shoeSize": "27.5 cm",
                    "material": "a",
                    "heelHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "shoeStyle": "a",
                    "fabricCareInstructions": { "fabricCareInstruction": "a" },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "countryOfOriginAssembly": "Croacia"
                    }
                },
                "MusicalInstrument": {
                    "MusicalInstruments": {
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Reino Unido",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Negro" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "warrantyText": "a",
                    "powerType": "Continua",
                    "material": "a",
                    "modelStyleType": "a"
                    },
                    "SoundAndRecording": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "powerType": "Directa",
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Dorado" },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "wireless": "No",
                    "rmsPowerRating": {
                        "measure": "500",
                        "unit": "Watts"
                    },
                    "countryOfOriginAssembly": "Siria"
                    },
                    "MusicCasesAndBags": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Gris" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "material": "a",
                    "countryOfOriginAssembly": "Serbia",
                    "itemsIncluded": "a",
                    "modelStyleType": "a"
                    },
                    "InstrumentAccessories": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Encino" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "material": "a",
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Gabón",
                    "itemsIncluded": "a"
                    }
                },
                "CarriersAndAccessoriesCategory": {
                    "CasesAndBags": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "material": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Senegal",
                    "colorCategory": { "colorCategoryValue": "Verde" }
                    }
                },
                "WatchesCategory": {
                    "Watches": {
                    "compatibleDevices": "a",
                    "wireless": "Sí",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "gender": "Mujer",
                    "material": "a",
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Nogal" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Bután"
                    }
                },
                "OfficeCategory": {
                    "Office": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Malasia",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "months"
                    },
                    "warningText": "a"
                    }
                },
                "Media": {
                    "TVShows": {
                    "mexicoMediaRating": "B15 (Mayores de 15 Años)",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "physicalMediaFormat": "DVD",
                    "ratingReason": "a",
                    "subtitledLanguages": { "subtitledLanguage": "a" },
                    "dubbedLanguages": { "dubbedLanguage": "a" },
                    "brand": "a",
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "itemsIncluded": "a",
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "República Democrática del Congo"
                    },
                    "Movies": {
                    "itemsIncluded": "a",
                    "mexicoMediaRating": "C (Mayores de 18 Años)",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "physicalMediaFormat": "DVD",
                    "ratingReason": "a",
                    "movieGenre": "a",
                    "subtitledLanguages": { "subtitledLanguage": "a" },
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Lituania",
                    "dubbedLanguages": { "dubbedLanguage": "a" },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "brand": "a"
                    },
                    "BooksAndMagazines": {
                    "year": "0",
                    "bookCoverType": "Pasta Dura",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "bookFormat": "Fisico",
                    "author": { "authorValue": "a" },
                    "publisher": "a",
                    "genre": "Lectores Intermedios",
                    "issue": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "edition": "a",
                    "numberOfPages": "0",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Nueva Zelanda",
                    "brand": "a",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "years"
                    },
                    "wireless": "Sí",
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    }
                    }
                },
                "Vehicle": {
                    "Tires": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "warningText": "a",
                    "modelStyleType": "a",
                    "vehicleType": "Moto",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Letonia"
                    },
                    "VehiclePartsAndAccessories": {
                    "bciGroupNumber": "a",
                    "orientation": "Trasera",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "compatibleBrands": { "compatibleBrand": "a" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "vehicleModel": "a",
                    "colorCategory": { "colorCategoryValue": "Camello" },
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Senegal",
                    "modelStyleType": "a"
                    },
                    "LandVehicles": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "vehicleYear": "0",
                    "vehicleModel": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Chad",
                    "warningText": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "colorCategory": { "colorCategoryValue": "Cedro" },
                    "itemsIncluded": "a"
                    },
                    "WheelsAndWheelComponents": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "vehicleType": "Moto",
                    "itemsIncluded": "a",
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Francia",
                    "colorCategory": { "colorCategoryValue": "Plateado" }
                    },
                    "VehicleOther": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "colorCategory": { "colorCategoryValue": "Encino" },
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Filipinas",
                    "modelStyleType": "a",
                    "compatibleBrands": { "compatibleBrand": "a" },
                    "form": "Mascarilla"
                    }
                },
                "ClothingCategory": {
                    "Clothing": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "colorCategory": { "colorCategoryValue": "Dorado" },
                    "fabricCareInstructions": { "fabricCareInstruction": "a" },
                    "clothingStyle": "a",
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "countryOfOriginAssembly": "Nueva Zelanda"
                    }
                },
                "JewelryCategory": {
                    "Jewelry": {
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Suazilandia",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "material": "a",
                    "metalStamp": { "metalStampValue": ".800: 80% Plata" },
                    "colorCategory": { "colorCategoryValue": "Rosa" },
                    "modelStyleType": "a",
                    "size": "a",
                    "color": "a"
                    }
                },
                "Electronics": {
                    "VideoGames": {
                    "colorCategory": { "colorCategoryValue": "Café" },
                    "mexicoMediaRating": "C (Mayores de 18 Años)",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "countryOfOriginAssembly": "China",
                    "itemsIncluded": "a",
                    "videoGameType": "Pase de Temporada",
                    "warningText": "a",
                    "videoGameGenre": { "videoGameGenreValue": "Aventura" },
                    "modelStyleType": "a"
                    },
                    "VideoProjectors": {
                    "wireless": "Sí",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "modelStyleType": "a",
                    "colorCategory": { "colorCategoryValue": "Camello" },
                    "countryOfOriginAssembly": "Turkmenistán",
                    "itemsIncluded": "a",
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    }
                    },
                    "ElectronicsAccessories": {
                    "wireless": "Sí",
                    "shortDescription": "a",
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Lila" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Benín",
                    "warningText": "a",
                    "volts": {
                        "measure": "0",
                        "unit": "VDC"
                    },
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    }
                    },
                    "ElectronicsCables": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Cedro" },
                    "warningText": "a",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a"
                    },
                    "ComputerComponents": {
                    "wireless": "No",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "warningText": "a",
                    "colorCategory": { "colorCategoryValue": "Madera" },
                    "countryOfOriginAssembly": "Liechtenstein",
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "color": "a"
                    },
                    "Software": {
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "softwareCategory": { "softwareCategoryValue": "a" },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "modelStyleType": "a",
                    "itemsIncluded": "a",
                    "countryOfOriginAssembly": "Uganda",
                    "softwareLicense": "Para 5 equipos/usuarios"
                    },
                    "TVsAndVideoDisplays": {
                    "warningText": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    },
                    "displayTechnology": "a",
                    "color": "a",
                    "itemsIncluded": "a",
                    "modelStyleType": "a",
                    "countryOfOriginAssembly": "Túnez",
                    "watts": {
                        "measure": "0",
                        "unit": "W"
                    },
                    "shortDescription": "a",
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "maximumTotalWattage": {
                        "measure": "0",
                        "unit": "Joules"
                    }
                    },
                    "CellPhones": {
                    "plugType": { "plugTypeValue": "Americano" },
                    "brand": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    },
                    "cellPhoneServiceProvider": "a",
                    "hardDriveCapacity": {
                        "measure": "0",
                        "unit": "GB"
                    },
                    "ramMemory": {
                        "measure": "0",
                        "unit": "PB"
                    },
                    "itemsIncluded": "a",
                    "processorType": { "processorTypeValue": "a" },
                    "countryOfOriginAssembly": "Corea del Sur",
                    "wireless": "Sí",
                    "modelStyleType": "a",
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "shortDescription": "a"
                    },
                    "Computers": {
                    "colorCategory": { "colorCategoryValue": "Beige" },
                    "itemsIncluded": "a",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "color": "a",
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    },
                    "ramMemory": {
                        "measure": "0",
                        "unit": "PB"
                    },
                    "processorType": { "processorTypeValue": "a" },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "wireless": "No",
                    "countryOfOriginAssembly": "Tailandia",
                    "modelStyleType": "a",
                    "hardDriveCapacity": {
                        "measure": "0",
                        "unit": "TB"
                    }
                    },
                    "PrintersScannersAndImaging": {
                    "wireless": "No",
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "color": "a",
                    "modelStyleType": "a",
                    "colorCategory": { "colorCategoryValue": "Beige" },
                    "itemsIncluded": "a"
                    },
                    "ElectronicsOther": {
                    "processorType": { "processorTypeValue": "a" },
                    "screenSize": {
                        "measure": "0",
                        "unit": "Pulgadas"
                    },
                    "itemsIncluded": "a",
                    "softwareLicense": "Para 2 equipos/usuarios",
                    "countryOfOriginAssembly": "Australia",
                    "watts": {
                        "measure": "0",
                        "unit": "KW"
                    },
                    "hasOpticalConnection": "No",
                    "volts": {
                        "measure": "0",
                        "unit": "VAC"
                    },
                    "rmsPowerRating": {
                        "measure": "100",
                        "unit": "Watts"
                    },
                    "maximumTotalWattage": {
                        "measure": "0",
                        "unit": "Horsepower"
                    },
                    "shortDescription": "a",
                    "keyFeatures": { "keyFeaturesValue": "a" },
                    "brand": "a",
                    "mainImageUrl": "http://www.altova.com/",
                    "productSecondaryImageURL": { "productSecondaryImageURLValue": "http://www.altova.com/" },
                    "assembledProductLength": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWidth": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductHeight": {
                        "measure": "0",
                        "unit": "cm"
                    },
                    "assembledProductWeight": {
                        "measure": "0",
                        "unit": "kg"
                    },
                    "color": "a",
                    "colorCategory": { "colorCategoryValue": "Verde" },
                    "wireless": "Sí",
                    "ageRange": {
                        "RangeMinimum": "0",
                        "RangeMaximum": "0",
                        "unit": "years"
                    },
                    "hardDriveCapacity": {
                        "measure": "0",
                        "unit": "TB"
                    }
                    }
                }
                }
            },
            "MPOffer": {
                "msiEligible": "No",
                "price": "0",
                "ShippingDimensionsWidth": {
                "measure": "0",
                "unit": "cm"
                },
                "ShippingDimensionsHeight": {
                "measure": "0",
                "unit": "cm"
                },
                "ShippingDimensionsDepth": {
                "measure": "0",
                "unit": "cm"
                },
                "ShippingWeight": {
                "measure": "0",
                "unit": "kg"
                },
                "ProductTaxCode": "0",
                "sellerWarranty": "a",
                "sellerWarrantyPeriod": "25",
                "shippingCountryOfOrigin": "Mónaco"
            }
            }
        };
        let sub_category = {};
        let color;
        let body;
        let variant_name;
        
        switch (product.mainColor.name) {
            case 'blanco':
                color = 'Blanco';
                break;
            case 'negro':
                color = 'Negro';
                break;
            case 'café':
                color = 'Café';
                break;
            case 'azul':
                color = 'Azul';
                break;
            case 'verde':
                color = 'Verde';
                break;
            case 'amarillo':
                color = 'Amarillo';
                break;
            case 'rojo':
                color = 'Rojo';
                break;
            case 'naranja':
                color = 'Anaranjado';
                break;
            case 'fucsia':
                color = 'Fucsia';
                break;
            case 'lila':
                color = 'Lila';
                break;
            case 'celeste':
                color = 'Turquesa';
                break;
            case 'rosa':
                color = 'Rosa';
                break;
            case 'beige':
                color = 'Beige';
                break;
            case 'chocolate':
                color = 'Chocolate';
            break;
            case 'dorado':
                color = 'Dorado';
                break;
            case 'plateado':
                color = 'Plateado';
                break;
            case 'violeta':
                color = 'Morado';
                break;
            case 'multicolor':
                color = 'Blanco';
                break;      
            default:
                break;
        }

        switch (categories[0]) {
            case 'FootwearCategory':
                switch (categories[1]) {
                    case 'Footwear':
                        sub_category= {
                            "Footwear": {
                                "shoeLength": {
                                    "measure": productvariation.variation.cm.toString(),
                                    "unit": "cm"
                                },
                                "shoeSoleMaterial": "N",
                                "shortDescription": (product.descriptionShort).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''),
                                "keyFeatures": { "keyFeaturesValue": (product.description).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,'')},
                                "brand": product.manufacturer.name,
                                "mainImageUrl": images[0],
                                "productSecondaryImageURL": { "productSecondaryImageURLValue": images[1] },
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "shoeSize": `${productvariation.variation.cm} cm`,
                                "material": "N",
                                "heelHeight": {
                                    "measure": "0",
                                    "unit": "cm"
                                },
                                "shoeStyle": categories[2],
                                "fabricCareInstructions": { "fabricCareInstruction": "None" },
                                "modelStyleType": product.reference,
                                "itemsIncluded": product.name,
                                "assembledProductWeight": {
                                    "measure": product.weight,
                                    "unit": "kg"
                                },
                                "assembledProductHeight": {
                                    "measure": product.height,
                                    "unit": "cm"
                                },
                                "assembledProductWidth": {
                                    "measure": product.width,
                                    "unit": "cm"
                                },
                                "assembledProductLength": {
                                    "measure": product.length,
                                    "unit": "cm"
                                },
                                "countryOfOriginAssembly": "México"
                            }
                        }
                        variant_name = 'shoeSize';
                        break;
                
                    default:
                        break;
                }
                break;
            case 'ClothingCategory':
                    switch (categories[1]) {
                        case 'Clothing':
                            sub_category= {
                                "Clothing": {
                                    "shortDescription": (product.descriptionShort).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''),
                                    "keyFeatures": { "keyFeaturesValue": (product.description).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,'')},
                                    "brand": product.manufacturer.name,
                                    "mainImageUrl": images[0],
                                    "productSecondaryImageURL": { "productSecondaryImageURLValue": images[1] },
                                    "colorCategory": { "colorCategoryValue": color },
                                    "fabricCareInstructions": { "fabricCareInstruction": "None" },
                                    "clothingStyle": categories[2],
                                    "modelStyleType": product.reference,
                                    "itemsIncluded": product.name,
                                    "assembledProductWeight": {
                                        "measure": product.weight,
                                        "unit": "kg"
                                    },
                                    "assembledProductHeight": {
                                        "measure": product.height,
                                        "unit": "cm"
                                    },
                                    "assembledProductWidth": {
                                        "measure": product.width,
                                        "unit": "cm"
                                    },
                                    "assembledProductLength": {
                                        "measure": product.length,
                                        "unit": "cm"
                                    },
                                    "countryOfOriginAssembly": "México"
                                }
                            }
                            variant_name = 'clothingSize';
                            break;
                    
                        default:
                            break;
                    }
                    break;    
            default:
                break;
        }

        switch (action) {
            case 'ProductCreate':
                action = 'CREATE'
                break;
            case 'ProductUpdate':
                action = 'REPLACE_ALL'
                break;
            case 'OfferUpdate':
                action = 'PARTIAL_UPDATE'
                break;
            default:
                break;
        }

        if(sub_category){
            if(variant){
                sub_category.variantGroupId= product.id;
                sub_category.variantAttributeNames= { "variantAttributeName": variant_name };
                sub_category.isPrimaryVariant = inputs.primary_variant? "Sí" : "No" ;
                sub_category[variant_name] = productvariation.variation.name ;;
            }
            body = {
                "MPItem": {
                    "processMode": action,
                    "sku": productvariation.id,
                    "productIdentifiers": {
                        "productIdentifier": {
                        "productIdType": "EAN",
                        "productId": productvariation.ean13 !=='' ? productvariation.ean13 : productvariation.id
                        }
                    },
                    "MPProduct": {
                        "productName": product.name,
                        "category": {[inputs.categories[0]]:sub_category}
                    },
                    "MPOffer": {
                        "msiEligible": "No",
                        "price": productvariation.price,
                        "ShippingDimensionsWidth": {
                        "measure": product.width,
                        "unit": "cm"
                        },
                        "ShippingDimensionsHeight": {
                        "measure": product.height,
                        "unit": "cm"
                        },
                        "ShippingDimensionsDepth": {
                        "measure": product.length,
                        "unit": "cm"
                        },
                        "ShippingWeight": {
                        "measure": product.weight,
                        "unit": "kg"
                        },
                        "ProductTaxCode": "0",
                        "sellerWarranty": "Defectos de fábrica",
                        "sellerWarrantyPeriod": "3",
                        "shippingCountryOfOrigin": "México"
                    }
                }
            };
        }

        return exits.success(body);
    }
  };