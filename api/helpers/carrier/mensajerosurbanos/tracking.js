module.exports = {
    friendlyName: 'Shipping tracking',
    description: 'Update shipping status for an order',
    inputs: {
      tracking:{
        type:'string'
      },
      status_id:{
        type:'number'
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
  
  
    fn: async function (inputs, exits) {
      let newstate='';

      switch (inputs.status_id) {
        case 4:
            newstate='enviado';
          break;
        case 5:
            newstate='entregado';
          break;
        case 6:
            newstate='fallido';
          break;              
        default:
          break;
      }

      if(!(newstate==='')){
        let state= await OrderState.findOne({name:newstate});
        let order = await Order.updateOne({tracking:inputs.tracking}).set({currentstatus:state.id});
        await OrderHistory.create({order:order.id,state:state.id});
      }

      return exits.success();
    }
  
  
  };
  
  