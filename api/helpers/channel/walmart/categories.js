module.exports = {
    friendlyName: 'Categories Walmart',
    description: 'Categories Walmart.',
    inputs: {
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs,exits) {

        let json = [
                {"Name":"HealthAndBeauty",  
                "Children":{
                    "Category":[
                        {"Name":"MedicalAids", "Children":""},  
                        {"Name":"Optical", "Children":""},
                        {"Name":"MedicineAndSupplements", "Children":""},
                        {"Name":"PersonalCare", "Children":""},
                        {"Name":"HealthAndBeautyElectronics", "Children":""}
                    ]
                }
                },
                {"Name":"FurnitureCategory",
                "Children":{
                    "Category":[
                        {"Name":"Furniture", "Children":""}
                    ]
                }
                },
                {"Name":"Home",  
                "Children":{
                    "Category":[
                        {"Name":"Bedding", "Children":""},  
                        {"Name":"LargeAppliances", "Children":""},
                        {"Name":"HomeOther", "Children":""}
                    ]
                }
                },
                {"Name":"ArtAndCraftCategory",
                "Children":{
                    "Category":[
                        {"Name":"ArtAndCraft", "Children":""}
                    ]
                }
                },
                {"Name":"FoodAndBeverageCategory",  
                "Children":{
                    "Category":[
                        {"Name":"AlcoholicBeverages", "Children":""},
                        {"Name":"FoodAndBeverage", "Children":""}
                    ]
                }
                },
                {"Name":"ToolsAndHardware",  
                "Children":{
                    "Category":[
                        {"Name":"Tools", "Children":""},  
                        {"Name":"Hardware", "Children":""},
                        {"Name":"PlumbingAndHVAC", "Children":""},
                        {"Name":"Electrical", "Children":""},
                        {"Name":"ToolsAndHardwareOther", "Children":""}
                    ]
                }
                },
                {"Name":"Photography",  
                "Children":{
                    "Category":[
                        {"Name":"CamerasAndLenses", "Children":""},  
                        {"Name":"PhotoAccessories", "Children":""}
                    ]
                }
                },
                {"Name":"SportAndRecreation",  
                "Children":{
                    "Category":[
                        {"Name":"Cycling", "Children":""},  
                        {"Name":"SportAndRecreationOther", "Children":""}
                    ]
                }
                },
                {"Name":"Animal",  
                "Children":{
                    "Category":[
                        {"Name":"AnimalHealthAndGrooming", "Children":""},  
                        {"Name":"AnimalAccessories", "Children":""},
                        {"Name":"AnimalFood", "Children":""},
                        {"Name":"AnimalEverythingElse", "Children":""}
                    ]
                }
                },
                {"Name":"GardenAndPatioCategory",  
                "Children":{
                    "Category":[
                        {"Name":"GrillsAndOutdoorCooking", "Children":""},  
                        {"Name":"GardenAndPatio", "Children":""}
                    ]
                }
                },
                {"Name":"OtherCategory",  
                "Children":{
                    "Category":[
                        {"Name":"fuelsAndLubricants", "Children":""}
                    ]
                }
                },
                {"Name":"OccasionAndSeasonal",  
                "Children":{
                    "Category":[
                        {"Name":"DecorationsAndFavors", "Children":""},  
                        {"Name":"Costumes", "Children":""},
                    ]
                }
                },
                {"Name":"ToysCategory",  
                "Children":{
                    "Category":[
                        {"Name":"Toys", "Children":""}
                    ]
                }
                },
                {"Name":"Baby",  
                "Children":{
                    "Category":[
                        {"Name":"BabyFood", "Children":""},  
                        {"Name":"BabyOther", "Children":""},
                        {"Name":"ChildCarSeats", "Children":""},
                        {"Name":"BabyFurniture", "Children":""},
                        {"Name":"BabyToys", "Children":""}
                    ]
                }
                },
                {"Name":"FootwearCategory",  
                "Children":{
                    "Category":[
                        {"Name":"Footwear", "Children":""}
                    ]
                }
                },
                {"Name":"MusicalInstrument",  
                "Children":{
                    "Category":[
                        {"Name":"MusicalInstruments", "Children":""},  
                        {"Name":"SoundAndRecording", "Children":""},
                        {"Name":"MusicCasesAndBags", "Children":""},
                        {"Name":"InstrumentAccessories", "Children":""}
                    ]
                }
                },
                {"Name":"CarriersAndAccessoriesCategory",  
                "Children":{
                    "Category":[
                        {"Name":"CasesAndBags", "Children":""}
                    ]
                }
                },
                {"Name":"WatchesCategory",  
                "Children":{
                    "Category":[
                        {"Name":"Watches", "Children":""}
                    ]
                }
                },
                {"Name":"OfficeCategory",  
                "Children":{
                    "Category":[
                        {"Name":"Office", "Children":""}
                    ]
                }
                },
                {"Name":"Media",  
                "Children":{
                    "Category":[
                        {"Name":"TVShows", "Children":""},
                        {"Name":"Movies", "Children":""},
                        {"Name":"BooksAndMagazines", "Children":""}
                    ]
                }
                },
                {"Name":"Vehicle",  
                "Children":{
                    "Category":[
                        {"Name":"Tires", "Children":""},  
                        {"Name":"VehiclePartsAndAccessories", "Children":""},
                        {"Name":"LandVehicles", "Children":""},
                        {"Name":"WheelsAndWheelComponents", "Children":""},
                        {"Name":"VehicleOther", "Children":""}
                    ]
                }
                },
                {"Name":"ClothingCategory",  
                "Children":{
                    "Category":[
                        {"Name":"Clothing", "Children":""}
                    ]
                }
                },
                {"Name":"JewelryCategory",  
                "Children":{
                    "Category":[
                        {"Name":"Jewelry", "Children":""}
                    ]
                }
                },
                {"Name":"Electronics",  
                "Children":{
                    "Category":[
                        {"Name":"VideoGames", "Children":""},  
                        {"Name":"VideoProjectors", "Children":""},
                        {"Name":"ElectronicsAccessories", "Children":""},
                        {"Name":"ElectronicsCables", "Children":""},
                        {"Name":"ComputerComponents", "Children":""},
                        {"Name":"Software", "Children":""},  
                        {"Name":"TVsAndVideoDisplays", "Children":""},
                        {"Name":"CellPhones", "Children":""},
                        {"Name":"Computers", "Children":""},
                        {"Name":"PrintersScannersAndImaging", "Children":""},
                        {"Name":"ElectronicsOther", "Children":""}
                    ]
                }
                }
            ];
        
        return exits.success(json);
    }
  };