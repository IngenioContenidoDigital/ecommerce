module.exports = {
  friendlyName: 'Export Order',
  description: 'Export order to Busint.',
  inputs: {
    params:{
      type:'ref',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let axios = require('axios');
    let urlOrder = 'http://66.206.4.42:80/api/pedidos';
    let urlDetails = 'http://66.206.4.42:80/api/pedidosdetalles';
    let urlPayment = 'http://66.206.4.42:80/api/pedidostipopago';
    let order = await Order.findOne(inputs.params).populate('customer').populate('carrier').populate('currentstatus').populate('addressDelivery');
    if (order) {
      try {
        let resultItems = [];
        let details = [];
        let items = await OrderItem.find({order: order.id}).populate('product').populate('productvariation');
        let address = await Address.findOne({id: order.addressDelivery.id}).populate('country').populate('city').populate('region');
        let customerName = await sails.helpers.parseName(order.customer.fullName);
        items.forEach((ite) => {
          var tempKey = ite.productvariation.id;
          if (!resultItems.hasOwnProperty(tempKey)) {
            ite.quantity = 1;
            resultItems[tempKey] = ite;
          } else {
            resultItems[tempKey].quantity += 1;
          }
        });
        for (const key of Object.keys(resultItems)) {
          const item = resultItems[key];
          const resultItem = {
            orderId: String(order.reference) + 'MKP',
            quantity: item.quantity,
            description: item.productvariation.reference,
            ean: item.productvariation.ean13,
            price: item.price,
            shippingPrice: order.fleteTotal,
            shippingEstimateDate: moment().add(5, 'days').format(),
            courierName: order.carrier.name.toUpperCase(),
            warehouseId: 9.0
          };
          details.push(resultItem);
        }

        let payment = {
          orderId: String(order.reference) + 'MKP',
          paymentSystem: (order.paymentMethod === 'COD' || order.paymentMethod === 'CashOnDeliveryPayment' || order.paymentMethod === 'CashOnDelivery_Payment' ? 4 : 3),
          paymentSystemName: order.paymentMethod,
          value: order.totalOrder
        };

        let requestArgs = {
          orderId: String(order.reference) + 'MKP',
          creationDate: moment().format(),
          clienteName: order.customer.fullName,
          totalValue: order.totalOrder,
          email: order.customer.emailAddress,
          firstName: customerName.name,
          lastName: customerName.secondLastName !== '' ? customerName.lastName + ' ' + customerName.secondLastName : customerName.lastName,
          documentType: order.customer.dniType,
          document:  order.customer.dni,
          phone: String(order.customer.mobile),
          reciverName: order.customer.fullName,
          postalCode: parseInt(address.city.code),
          city: address.city.name.toUpperCase(),
          state: address.region.name.toUpperCase(),
          country: address.country.name.toUpperCase(),
          street: address.addressline1,
          neighborhood: address.addressline2,
          complement: address.notes,
          status: 'P'
        };
        console.log(requestArgs);
        console.log(payment);
        // let responseOrder = await axios({
        //   method: 'post',
        //   url: urlOrder,
        //   headers: {
        //     'content-type': 'application/json',
        //     user: 'milonga',
        //     password: 'milonga11.'
        //   },
        //   data: requestArgs
        // });

        // console.log(responseOrder);

        // if(responseOrder && responseOrder.data){
        //   await axios({
        //     method: 'post',
        //     url: urlPayment,
        //     headers: {
        //       'content-type': 'application/json',
        //       user: 'milonga',
        //       password: 'milonga11.'
        //     },
        //     data: payment
        //   });
        //   for (const detail of details) {
        //     await axios({
        //       method: 'post',
        //       url: urlDetails,
        //       headers: {
        //         'content-type': 'application/json',
        //         user: 'milonga',
        //         password: 'milonga11.'
        //       },
        //       data: detail
        //     });
        //   }
        // }
        return exits.success(true);
      } catch (error) {
        console.log(error.menssage);
        return exits.error(error.menssage);
      }
    } else {
      return exits.error('La orden no fue encontrada');
    }
  }
};
