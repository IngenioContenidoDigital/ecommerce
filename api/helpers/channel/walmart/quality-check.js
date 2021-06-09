module.exports = {
    friendlyName: 'Quality Check Walmart',
    description: 'Quality Check Walmart',
    inputs: {},
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs, exits) {
        try{

            let axios = require('axios');
            let channel = await Channel.findOne({name:'walmart'}).populate('currency'); 
            let product_channels = await ProductChannel.find({iscreated:false, channel:channel.id});
            
            for(let i=0; i<product_channels.length; i++){

                let product_channel = product_channels[i];
                let truth_flag_counter = 0;
                
                let integration = await Integrations.findOne({id: product_channel.integration}).populate('channel');
                let resultErrors = [];

                let auth = `${integration.user}:${integration.key}`;
                const buferArray = Buffer.from(auth);
                let encodedAuth = buferArray.toString('base64');
                
                let token = await sails.helpers.channel.walmart.sign(integration);

                let headers = {
                    'Authorization': `Basic ${encodedAuth}`,
                    'WM_SEC.ACCESS_TOKEN':token,               
                        'WM_SEC.ACCESS_TOKEN':token,               
                    'WM_SEC.ACCESS_TOKEN':token,               
                    'WM_MARKET' : 'mx',
                    'WM_SVC.NAME' : 'Walmart Marketplace',
                    'WM_QOS.CORRELATION_ID': '11111111',
                    accept: 'application/json'
                }

                let options = {
                    method: 'get',
                    url: `${integration.channel.endpoint}/v3/feeds/${product_channel.channelid}?includeDetails=true`,
                    headers: headers
                };
                let response = await axios(options).catch((e) => {console.log(e.response.data);});
                          
                if(response){
                    if (response.data.feedStatus === 'PROCESSED') {
                    let items = response.data.itemDetails.itemIngestionStatus;
                    let price_body = `<?xml version="1.0" encoding="UTF-8"?>
                    <PriceFeed xmlns="http://walmart.com/">
                        <PriceHeader>
                            <version>1.5.1</version>
                        </PriceHeader>`;

                    let inventory_body = `<InventoryFeed xmlns="http://walmart.com/">
                    <InventoryHeader>
                      <version>1.4</version>
                    </InventoryHeader>`;
                        
                        for (let index = 0; index < items.length; index++) {
                            const element = items[index];
                            if(element.ingestionStatus === 'SUCCESS'){
                                truth_flag_counter++;
                                let options = {
                                    method: 'get',
                                    url: `${integration.channel.endpoint}/v3/items/${element.sku}`,
                                    headers: headers
                                };
                                let response_publishing = await axios(options).catch((e) => {console.log(e.response.data);});

                                if(response_publishing){
                                    if(response_publishing.data.ItemResponse[0].publishedStatus === 'PUBLISHED'){
                                        let pv = await sails.helpers.channel.walmart.price(product_channel, element.sku);
                                        
                                        let item_price = `<Price xmlns="http://walmart.com/">
                                            <itemIdentifier>
                                                <sku>${element.sku}</sku>
                                            </itemIdentifier>
                                            <pricingList>
                                                <pricing>
                                                     <currentPrice>
                                                       <value currency=${channel.currency.isocode} amount="${pv.price.toString()}"/>
                                                     </currentPrice>
                                                    <currentPriceType>BASE</currentPriceType>
                                                </pricing>
                                            </pricingList>
                                         </Price>`;

                                        let item_inventory = `<inventory xmlns="http://walmart.com/">
                                            <sku>${element.sku}</sku><quantity><unit>EACH</unit>
                                                <amount>${pv.quantity.toString()}</amount>
                                            </quantity>
                                        </inventory>`;
                                        
                                        price_body     = price_body + item_price;
                                        inventory_body = inventory_body + item_inventory;
                                    }
                                }
                            }else if(element.ingestionStatus === 'DATA_ERROR'){
                                let errors_walmart = element.ingestionErrors.ingestionError;
                                for (let index = 0; index < errors_walmart.length; index++) {
                                    const error = errors_walmart[index];
                                    if (!resultErrors.includes(error.field+' : '+error.description)) {
                                        resultErrors.push(error.field+' : '+error.description);
                                    }
                                }
                                await ProductChannel.updateOne({id: product_channel.id}).set({
                                    reason: resultErrors.join(' | ')
                                });
                            }
                        }
                        price_body     = price_body + '</PriceFeed>';
                        inventory_body = inventory_body + '</InventoryFeed>';
                        const buffer_price = Buffer.from(price_body);
                        const buffer_inventory = Buffer.from(inventory_body);
                        headers['content-type'] = 'application/xml';

                        let options_price = {
                            method: 'post',
                            url: `${integration.channel.endpoint}/v3/feeds?feedType=price`,
                            headers: headers,
                            data:buffer_price
                        };

                        let options_inventory = {
                            method: 'post',
                            url: `${integration.channel.endpoint}/v3/feeds?feedType=inventory`,
                            headers: headers,
                            data:buffer_inventory
                        };


                        if(truth_flag_counter == items.length){
                            await ProductChannel.updateOne({id:product_channel.id}).set({
                                iscreated:true,
                                status: true, 
                                reason:''
                            });
                        }

                        await axios(options_price).catch((e) => {console.log(e);});
                        await axios(options_inventory).catch((e) => {console.log(e.response.data);});

                    } else if(response.data.feedStatus === 'ERROR'){
                        await ProductChannel.updateOne({id: product_channel.id}).set({
                            reason: 'Falla en el envío del producto o la API'
                          });
                    }
                }
            }
            return exits.success();
      
        }catch(err){
            console.log(err);
          return exits.error(err);
        }
    }
  };