module.exports = {
  friendlyName: 'Export Order',
  description: 'Export order to SAP.',
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
    error: {
      description: 'Ocurrio un error al procesar la solicitud.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let axios = require('axios');
    let url = 'http://190.85.100.77:8051/api/Documento/Create';
    let order = await Order.findOne(inputs.params).populate('customer').populate('currentstatus').populate('addressDelivery');
    if (order) {
      try {
        let resultItems = [];
        let details = [];
        let items = await OrderItem.find({order: order.id}).populate('product').populate('productvariation');
        let address = await Address.findOne({id: order.addressDelivery.id}).populate('country').populate('city').populate('region');
        let customerName = await sails.helpers.parseName(order.customer.fullName);
        let secondLastName = customerName.secondLastName !== '' ? customerName.secondLastName : '';
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
          const discountPercent = ((item.originalPrice - item.price) * 100) / item.originalPrice;
          const resultItem = {
            ItemCode: item.productvariation.reference,
            Quantity: item.quantity,
            WhsCode: 'M240',
            Price: item.originalPrice,
            DiscountPercent: discountPercent,
            OcrCode: '40',
            OcrCode2: '40VTA',
            OcrCode3: '40VTA01',
            TaxCode: 'IVTG',
            CamposUsuario: ''
          };
          details.push(resultItem);
        }
        let requestArgs = {
          DocDueDate: moment().add(1, 'days').format('YYYY-MM-DD'),
          Serie: 170,
          SlpCode: 88,
          CamposUsuario: 'U_Req_auto~Si',
          NumAtCard: order.paymentId,
          CiudadS: address.city.name.toUpperCase(),
          StateS: address.region.name.toUpperCase(),
          DireccionS: address.addressline1,
          CountryS: address.country.iso,
          CiudadB: address.city.name.toUpperCase(),
          StateB: address.city.code,
          DireccionB: address.addressline1,
          CountryB: address.country.iso,
          Comments: `${order.channel} #${order.paymentId} pago: Check \/ Money order email: ${order.customer.emailAddress}`,
          BusinessPartner: {
            LicTradNum: order.customer.dni,
            CardName: `${customerName.lastName} ${secondLastName} ${customerName.name}`.split('  ').join(' '),
            CardFName: secondLastName ? `${customerName.lastName} ${secondLastName}` : customerName.lastName,
            ListNum: 10,
            GroupCode: 167,
            GroupNum: 12,
            Telefono: order.customer.mobile,
            Email: 'servicioalcliente@evacol.com',
            Direccion: address.addressline1,
            Ciudad: address.city.name.toUpperCase(),
            Departamento: address.region.name.toUpperCase(),
            Pais: address.country.iso,
            Sector: '',
            DebitorAccount: '13050504',
            DownPaymentClearAct: '28050501',
            DownPaymentInterimAccount: '28050501',
            CamposUsuario: `U_EXX_RegTrib~PN|U_EXX_TipDoc~13|U_EXX_Munici~${address.city.code}|U_EXX_ActEco~81|U_EXX_RegFis~49|U_EXX_ResFis~ZZ|U_EXX_Nombres~${customerName.name}|U_EXX_ApPaterno~${customerName.lastName}|U_EXX_ApMaterno~${secondLastName || 'NA'}`,
            CamposUsuarioDireccion: 'U_EXX_MM~Y'
          },
          Detalles: details
        };
        const options = {
          method: 'post',
          url: url,
          headers: {
            'content-type': 'application/json'
          },
          data: requestArgs
        };
        await axios(options);
        return exits.success(true);
      } catch (error) {
        console.log(error);
        return exits.error('Error al procesar el pedido');
      }
    } else {
      return exits.error('La orden no fue encontrada');
    }
  }
};
