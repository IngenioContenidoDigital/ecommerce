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

        let categories = inputs.categories;
        let variant = inputs.variant;
        let action = inputs.action;
        let productvariation = inputs.productvariation;
        let images = inputs.images;
        let product = inputs.product;
        let chars = {'á':'&#225;','é':'&#233;','í':'&#237;','ó':'&#243;','ú':'&#250;','ñ':'&#241;','Á':'&#193;','É':'&#221;','Í':'&#205;','Ó':'&#211;','Ú':'&#218;','Ñ':'&#;209'};

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
        let talla;
        let gender;
        let body;
        let variant_name;
        let country = "México";
        country = country.replace(/[áéíóúñ]/gi, m => chars[m]);

        switch (productvariation.variation.name) {
            case 's':
                talla = 'T CH';
                break;
            case 'm':
                talla = 'T M';
                break;
            case 'l':
                talla = 'T G';
                break;
            case 'xl':
                talla = 'T EG';
                break;
            case 'xxl':
                talla = 'T EEG';
                break;           
            default:
                talla = 'Única';
                break;
        }
        console.log(productvariation.variation);
        switch (product.mainColor.name) {
            case 'naranja':
                color = 'Anaranjado';
                break;
            case 'celeste':
                color = 'Turquesa';
                break;
            case 'violeta':
                color = 'Morado';
                break;
            case 'multicolor':
                color = 'Blanco';
                break;      
            default:
                color = (product.mainColor.name.charAt(0).toUpperCase() + product.mainColor.name.slice(1)).replace(/[áéíóúñ]/gi, m => chars[m]);
                break;
        }
        switch (product.gender.name) {
            case 'masculino':
                gender = 'Hombre';
                break;
            case 'femenino':
                gender = 'Mujer';
                break;
            case 'niños':
                gender = 'Niño';
                break;
            case 'niñas':
                gender = 'Niña';
                break;
            case 'bebés niña':
                gender = 'Niña';
                break;
            case 'bebés niño':
                gender = 'Niño';
                break;
            case 'recién nacido':
                color = 'Niño';
                break;
            case 'recién nacida':
                gender = 'Niña';
                break;                
            default:
                gender = 'Unisex' ;
                break;
        }
        let basic_info =    {
            "shortDescription": product.descriptionShort.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,'').replace(/\&nbsp;/g, ' '),
            "keyFeatures": { "keyFeaturesValue": product.description.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,'').replace(/\&nbsp;/g, ' ')},
            "brand": product.manufacturer.name,
            "mainImageUrl": images[0],
            "productSecondaryImageURL": { "productSecondaryImageURLValue": images[1] },
            "modelStyleType": product.reference,
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
            "countryOfOriginAssembly": country
        };

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
                                "color": product.mainColor.name,
                                "shoeSoleMaterial": "N",
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "shoeSize": `${productvariation.variation.cm} cm`,
                                "material": "N",
                                "heelHeight": {
                                    "measure": "0",
                                    "unit": "cm"
                                },
                                "shoeStyle": product.name,
                                "fabricCareInstructions": { "fabricCareInstruction": "None" }
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
                                    "fabricCareInstructions": { "fabricCareInstruction": "None" },
                                    "clothingStyle": product.name,
                                    "colorCategory": { "colorCategoryValue": color },
                                    "clothingSize": talla,
                                    "modelStyleType": product.reference,
                                    "itemsIncluded": product.name
                                }
                            };
                            variant_name = 'clothingSize';
                            break;
                    
                        default:
                            break;
                    }
                    break;    
            case 'JewelryCategory': {
                switch (categories[1]) {
                    case 'Jewelry':
                        sub_category= {
                            "Jewelry": {
                                "itemsIncluded": product.name,
                                "material": "a",
                                "metalStamp": { "metalStampValue": ".800: 80% Plata" },
                                "colorCategory": { "colorCategoryValue": color },
                                "size": talla,
                                "color": product.mainColor.name
                            }
                        };
                    break;
                
                    default:
                        break;
                }
            }
            break;
            case 'Electronics': {
                switch (categories[1]) {
                    case 'VideoGames':
                        sub_category= {
                            "VideoGames": {
                                "mexicoMediaRating": "C (Mayores de 18 Años)",
                                "videoGameType": "Pase de Temporada",
                                "warningText": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "videoGameGenre": { "videoGameGenreValue": "Aventura" }
                            }
                        };
                    break;
                    case 'VideoProjectors':
                        sub_category= {
                            "VideoProjectors": {
                                "wireless": "Sí",
                                "colorCategory": { "colorCategoryValue": color },
                                "screenSize": {
                                    "measure": "0",
                                    "itemsIncluded": product.name,
                                    "unit": "Pulgadas"
                                }
                            }
                        };
                    break;
                    case 'ElectronicsAccessories':
                        sub_category= {
                            "ElectronicsAccessories": {
                                "wireless": "Sí",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "warningText": "a",
                                "volts": {
                                    "measure": "0",
                                    "unit": "VDC"
                                },
                                "screenSize": {
                                    "measure": "0",
                                    "unit": "Pulgadas"
                                }
                            }
                        };
                    break;
                    case 'ElectronicsCables':
                        sub_category= {
                            "ElectronicsCables": {
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "warningText": "a"
                            }
                        };
                    break;
                    case 'ComputerComponents':
                        sub_category= {
                            "ComputerComponents": {
                                "wireless": "No",
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name
                            }
                        };
                    break;
                    case 'Software':
                        sub_category= {
                            "Software": {
                                "softwareCategory": { "softwareCategoryValue": "a" },
                                "itemsIncluded": product.name,
                                "softwareLicense": "Para 5 equipos/usuarios"
                            }
                        };
                    break;
                    case 'TVsAndVideoDisplays':
                        sub_category= {
                            "TVsAndVideoDisplays": {
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "screenSize": {
                                    "measure": "0",
                                    "unit": "Pulgadas"
                                },
                                "displayTechnology": "a",
                                "color": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "watts": {
                                    "measure": "0",
                                    "unit": "W"
                                },
                                "maximumTotalWattage": {
                                    "measure": "0",
                                    "unit": "Joules"
                                }
                            }
                        };
                    break;
                    case 'CellPhones':
                        sub_category= {
                            "CellPhones": {
                                "plugType": { "plugTypeValue": "Americano" },
                                "color": product.mainColor.name,
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
                                "processorType": { "processorTypeValue": "a" },
                                "itemsIncluded": product.name,
                                "wireless": "Sí"
                            }
                        };
                    break;
                    case 'Computers':
                        sub_category= {
                            "Computers": {
                                "color": product.mainColor.name,
                                "screenSize": {
                                    "measure": "0",
                                    "unit": "Pulgadas"
                                },
                                "ramMemory": {
                                    "measure": "0",
                                    "unit": "PB"
                                },
                                "processorType": { "processorTypeValue": "a" },
                                "wireless": "No",
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "hardDriveCapacity": {
                                    "measure": "0",
                                    "unit": "TB"
                                }
                        }
                    };
                    break;
                    case 'PrintersScannersAndImaging':
                        sub_category= {
                            "PrintersScannersAndImaging": {
                                "wireless": "No",
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name
                            }
                        };
                        delete basic_info.countryOfOriginAssembly;
                    break;
                    case 'ElectronicsOther':
                        sub_category= {
                            "ElectronicsOther": {
                                "processorType": { "processorTypeValue": "a" },
                                "screenSize": {
                                    "measure": "0",
                                    "unit": "Pulgadas"
                                },
                                "softwareLicense": "Para 2 equipos/usuarios",
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
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
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
                        };
                        delete basic_info.modelStyleType;
                    break;    
                    default:
                        break;
                }
            }
            break;
            case 'SportAndRecreation': {
                switch (categories[1]) {
                    case 'Cycling':
                        sub_category= {
                            "Cycling": {
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "months"
                                },
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'SportAndRecreationOther':
                        sub_category= {
                            "SportAndRecreationOther": {
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "sport": product.name,
                                "gender": gender,
                                "size": talla,
                                "capacity": "a",
                                "itemsIncluded": product.name,
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                },
                                "numberOfPlayers": {
                                    "minimumNumberOfPlayers": "0",
                                    "maximumNumberOfPlayers": "0"
                                }
                            }
                        };
                        variant_name = 'size';    
                    break;
                }
            }
            break;
            case 'HealthAndBeauty': {
                switch (categories[1]) {
                    case 'MedicalAids':
                        sub_category= {
                            "MedicalAids": {
                                "volts": {
                                    "measure": "0",
                                    "unit": "kV"
                                },
                                "color": product.mainColor.name
                            }
                        };
                    break;
                    case 'Optical':
                        sub_category= {
                            "Optical": {
                                "frameColor": color,
                                "uvProtection": "Sí",
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "isPolarized": "Sí",
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'MedicineAndSupplements':
                        sub_category= {
                            "MedicineAndSupplements": {
                                "itemsIncluded": product.name,
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "months"
                                },
                            }
                        };
                    break;
                    case 'PersonalCare':
                        sub_category= {
                            "PersonalCare": {
                                "color": product.mainColor.name,
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "warrantyText": "a",
                                "scentFamily": "a",
                                "countPerPack": "0",
                                "gender": gender,
                                "spfValue": "0",
                                "colorCategory": { "colorCategoryValue": color }
                            }
                        };
                    break;
                    case 'HealthAndBeautyElectronics':
                        sub_category= {
                            "HealthAndBeautyElectronics": {
                                "volts": {
                                    "measure": "0",
                                    "unit": "kVAC"
                                },
                                "watts": {
                                    "measure": "0",
                                    "unit": "KW"
                                },
                                "gender": gender,
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name
                            }
                        };
                    break;
                }
            }
            break;
            case 'FurnitureCategory':
                switch (categories[1]) {
                    case 'Furniture':
                        sub_category= {
                            "Furniture": {
                                "screenSize": {
                                    "measure": "0",
                                    "unit": "Pulgadas"
                                },
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "material": "N",
                                "isAssemblyRequired": "No",
                                "recommendedUses": { "recommendedUse": "a" }
                            }
                        }
                        break;
                    default:
                        break;
                }
                break;
            case 'Home': {
                switch (categories[1]) {
                    case 'Bedding':
                        sub_category= {
                            "Bedding": {
                                "bedSize": "Matrimonial",
                                "itemsIncluded": "a",
                                "material": "a",
                                "color": product.mainColor.name
                            }
                        };
                    break;
                    case 'LargeAppliances':
                        sub_category= {
                            "LargeAppliances": {
                                "color": product.mainColor.name,
                                "size": "a",
                                "material": "a",
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'HomeOther':
                        sub_category= {
                            "HomeOther": {
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name
                            }
                        };
                    break;
                }
            }
            break;
            case 'ArtAndCraftCategory':
                switch (categories[1]) {
                    case 'ArtAndCraft':
                        sub_category= {
                            "ArtAndCraft": {
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name
                            }
                        }
                        break;
                    default:
                        break;
                }
            break;
            case 'FoodAndBeverageCategory': {
                switch (categories[1]) {
                    case 'AlcoholicBeverages':
                        sub_category= {
                            "AlcoholicBeverages": {
                                "itemsIncluded": product.name,
                                "ingredients": "a"
                            }
                        };
                    break;
                    case 'FoodAndBeverage':
                        sub_category= {
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
                                "calories": {
                                    "measure": "0",
                                    "unit": "kcal"
                                },
                                "totalFat": {
                                    "measure": "0",
                                    "unit": "cal"
                                },
                                "itemsIncluded": product.name,
                                "ingredients": "a",
                                "servingsPerContainer": "0",
                            }
                        };   
                    break;
                }
            }
            break;    
            case 'ToolsAndHardware': {
                switch (categories[1]) {
                    case 'Tools':
                        sub_category= {
                            "Tools": {
                                "isCordless": "No",
                                "material": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'Hardware':
                        sub_category= {
                            "Hardware": {
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'PlumbingAndHVAC':
                        sub_category= {
                            "PlumbingAndHVAC": {
                                "material": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'Electrical':
                        sub_category= {
                            "Electrical": {
                                "material": "a",
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'ToolsAndHardwareOther':
                        sub_category= {
                            "ToolsAndHardwareOther": {
                                "material": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;   
                    default:
                        break;
                }
            }
            break;
            case 'Photography': {
                switch (categories[1]) {
                    case 'CamerasAndLenses':
                        sub_category= {
                            "CamerasAndLenses": {
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "screenSize": {
                                    "measure": "0",
                                    "unit": "Pulgadas"
                                },
                                "itemsIncluded": product.name,
                                "batteryTechnologyType": "Botón",
                                "memoryCardType": { "memoryCardTypeValue": "a" },
                                "keywords": "a",
                                "cameraLensType": "Fijo",
                                "modelStyleType": "a",
                                "graphicsInformation": "1080p (FHD)"
                            }
                        };
                    break;
                    case 'PhotoAccessories':
                        sub_category= {
                            "PhotoAccessories": {
                                "color": product.mainColor.name,
                                "keywords": "a",
                                "itemsIncluded": product.name
                            }
                        };  
                    break;
                }
            }
            break;
            case 'Animal': {
                switch (categories[1]) {
                    case 'AnimalHealthAndGrooming':
                        sub_category= {
                            "AnimalHealthAndGrooming": {
                                "scent": "Pase de Temporada",
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'AnimalAccessories':
                        sub_category= {
                            "AnimalAccessories": {                    
                                "color": product.mainColor.name,
                                "size": talla,
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'AnimalFood':
                        sub_category= {
                            "AnimalFood": {
                                "flavor": "Sí",
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                },
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'AnimalEverythingElse':
                        sub_category= {
                            "AnimalEverythingElse": {
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "size": "a"
                            }
                        };
                    break;

                        default:
                        break;
                }
            }
            break;
            case 'GardenAndPatioCategory': {
                switch (categories[1]) {
                    case 'GrillsAndOutdoorCooking':
                        sub_category= {
                            "GrillsAndOutdoorCooking": {
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "isAssemblyRequired": "No",
                                "recommendedUses": { "recommendedUse": "a" },
                                "material": "a"
                            }
                        };
                    break;
                    case 'GardenAndPatio':
                        sub_category= {
                            "GardenAndPatio": {
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "isAssemblyRequired": "No",
                                "recommendedUses": { "recommendedUse": "a" },
                                "material": "a"
                            }
                        };  
                    break;
                }
            }
            break;
            case 'OtherCategory':
                switch (categories[1]) {
                    case 'fuelsAndLubricants':
                        sub_category= {
                            "fuelsAndLubricants": {
                                "itemsIncluded": product.name
                            }
                        }
                        break;
                    default:
                        break;
                }
                break;
            case 'OccasionAndSeasonal': {
                switch (categories[1]) {
                    case 'DecorationsAndFavors':
                        sub_category= {
                            "DecorationsAndFavors": {
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "size": talla
                            }
                        };
                    break;
                    case 'Costumes':
                        sub_category= {
                            "Costumes": {
                                "colorCategory": { "colorCategoryValue": color },
                                "itemsIncluded": product.name,
                                "clothingSize": talla
                            }
                        };
                        variant_name = 'clothingSize';  
                    break;
                }
            }
            break; 
            case 'ToysCategory':
                switch (categories[1]) {
                    case 'Toys':
                        sub_category= {
                            "Toys": {
                                "isRemoteControlIncluded": "Sí",
                                "collection": "a",
                                "productLine": "a",
                                "isArticulated": "Sí",
                                "warningText": "a",
                                "shoeSize": "25.5 (MX)",
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "gender": gender,
                                "size": talla,
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
                                "material": "a",
                                "seatingCapacity": "5",
                                "recommendedUses": { "recommendedUse": "a" },
                                "itemsIncluded": product.name
                            }
                        };
                        break;
                    default:
                        break;
                }
                break;
            case 'Baby': {
                switch (categories[1]) {
                    case 'BabyFood':
                        sub_category= {
                            "BabyFood": {
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "months"
                                },
                                "recommendedUses": { "recommendedUse": "a" },
                                "warningText": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'BabyOther':
                        sub_category= {
                            "BabyOther": {
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "diaperSize": talla,
                                "material": "a",
                                "gender": gender,
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                },
                                "recommendedUses": { "recommendedUse": "a" }
                            }
                        };
                    break;
                    case 'ChildCarSeats':
                        sub_category= {
                            "ChildCarSeats": {
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "material": "a",
                                "gender": gender,
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                }
                            }
                        };
                    break;
                    case 'BabyFurniture':
                        sub_category= {
                            "BabyFurniture": {
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "material": "a",
                                "gender": gender,
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                }
                            }
                        };
                    break;
                    case 'BabyToys':
                        sub_category= {
                            "BabyToys": {
                                "warningText": "a",
                                "recommendedUses": { "recommendedUse": "a" },
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "material": "a",
                                "gender": gender,
                                "size": "a",
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                }
                            }
                        };
                    break;   
                    default:
                        break;
                }
            }
            break;
            case 'MusicalInstrument': {
                switch (categories[1]) {
                    case 'MusicalInstruments':
                        sub_category= {
                            "MusicalInstruments": {
                                "warrantyText": "a",
                                "powerType": "Continua",
                                "material": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'SoundAndRecording':
                        sub_category= {
                            "SoundAndRecording": {
                                "powerType": "Directa",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "modelStyleType": "a",
                                "itemsIncluded": "a",
                                "wireless": "No",
                                "rmsPowerRating": {
                                    "measure": "500",
                                    "unit": "Watts"
                                },
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'MusicCasesAndBags':
                        sub_category= {
                            "MusicCasesAndBags": {
                                "material": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'InstrumentAccessories':
                        sub_category= {
                            "InstrumentAccessories": {
                                "material": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                    break;   
                    default:
                        break;
                }
            }
            break;
            case 'CarriersAndAccessoriesCategory':
                switch (categories[1]) {
                    case 'CasesAndBags':
                        sub_category= {
                            "CasesAndBags": {
                                "material": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                        break;
                    default:
                        break;
                }
                break;
            case 'WatchesCategory':
                switch (categories[1]) {
                    case 'Watches':
                        sub_category= {
                            "Watches": {
                                "compatibleDevices": "a",
                                "wireless": "Sí",
                                "gender": "Mujer",
                                "material": "a",
                                "colorCategory": { "colorCategoryValue": color },
                                "color": product.mainColor.name,
                                "itemsIncluded": product.name
                            }
                        };
                        break;
                    default:
                        break;
                }
                break;    
            case 'OfficeCategory':
                switch (categories[1]) {
                    case 'Office':
                        sub_category= {
                            "Office": {
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "months"
                                },
                                "warningText": "a",
                                "itemsIncluded": product.name
                            }
                        };
                        break;
                    default:
                        break;
                }
                break;   
            case 'Media': {
                switch (categories[1]) {
                    case 'TVShows':
                        sub_category= {
                            "TVShows": {
                                "mexicoMediaRating": "B15 (Mayores de 15 Años)",
                                "physicalMediaFormat": "DVD",
                                "ratingReason": "a",
                                "subtitledLanguages": { "subtitledLanguage": "a" },
                                "dubbedLanguages": { "dubbedLanguage": "a" },
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'Movies':
                        sub_category= {
                            "Movies": {
                                "mexicoMediaRating": "B15 (Mayores de 15 Años)",
                                "physicalMediaFormat": "DVD",
                                "movieGenre": "a",
                                "ratingReason": "a",
                                "subtitledLanguages": { "subtitledLanguage": "a" },
                                "dubbedLanguages": { "dubbedLanguage": "a" },
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'BooksAndMagazines':
                        sub_category= {
                            "BooksAndMagazines": {
                                "year": "0",
                                "bookCoverType": "Pasta Dura",
                                "bookFormat": "Fisico",
                                "author": { "authorValue": "a" },
                                "publisher": "a",
                                "genre": "Lectores Intermedios",
                                "issue": "a",
                                "edition": "a",
                                "numberOfPages": "0",
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                },
                                "itemsIncluded": product.name,
                                "wireless": "Sí",
                                "screenSize": {
                                    "measure": "0",
                                    "unit": "Pulgadas"
                                }
                            }
                        };
                    break;
                        default:
                        break;
                }
            }
            break;
            case 'Vehicle': {
                switch (categories[1]) {
                    case 'Tires':
                        sub_category= {
                            "Tires": {
                                "vehicleType": "Moto",
                                "warningText": "a",
                                "itemsIncluded": product.name
                            }
                        };
                    break;
                    case 'VehiclePartsAndAccessories':
                        sub_category= {
                            "VehiclePartsAndAccessories": {
                                "bciGroupNumber": "a",
                                "orientation": "Trasera",
                                "compatibleBrands": { "compatibleBrand": "a" },
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "vehicleModel": "a"
                            }
                        };
                    break;
                    case 'LandVehicles':
                        sub_category= {
                            "ChildCarSeats": {
                                "vehicleYear": "0",
                                "vehicleModel": "a",
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color }
                            }
                        };
                    break;
                    case 'WheelsAndWheelComponents':
                        sub_category= {
                            "BabyFurniture": {
                                "warningText": "a",
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "material": "a",
                                "gender": gender,
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                }
                            }
                        };
                    break;
                    case 'VehicleOther':
                        sub_category= {
                            "BabyToys": {
                                "warningText": "a",
                                "recommendedUses": { "recommendedUse": "a" },
                                "itemsIncluded": product.name,
                                "color": product.mainColor.name,
                                "colorCategory": { "colorCategoryValue": color },
                                "material": "a",
                                "gender": gender,
                                "size": "a",
                                "ageRange": {
                                    "RangeMinimum": "0",
                                    "RangeMaximum": "0",
                                    "unit": "years"
                                }
                            }
                        };
                    break;   
                    default:
                        break;
                }
            }
            break;
            default:
            break;
        }

        switch (action) {
            case 'ProductCreate':
                action = 'CREATE';
                break;
            case 'ProductUpdate':
                action = 'REPLACE_ALL';
                break;
            case 'ProductUpdateImage':
                action = 'PARTIAL_UPDATE';
                break;
            default:
                break;
        }
        Object.assign(sub_category[inputs.categories[1]], basic_info)
        if(sub_category){
            if(variant){
                sub_category[categories[1]].variantGroupId = product.id;
                sub_category[categories[1]].variantAttributeNames = { "variantAttributeName": variant_name };
                sub_category[categories[1]].isPrimaryVariant = inputs.primary_variant? "S&#237;" : "No" ;
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
                        "price": productvariation.price.toFixed(3),
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
                        "shippingCountryOfOrigin": country
                    }
                }
            };
            if(action === 'PARTIAL_UPDATE'){delete body.MPItem.MPOffer;}
        }
        console.log(body.MPItem.MPProduct.category);
        console.log(body);

        return exits.success(body);
    }
  };