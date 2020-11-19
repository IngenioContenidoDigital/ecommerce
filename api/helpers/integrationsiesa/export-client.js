module.exports = {
  friendlyName: 'Export Client',
  description: 'Export client to SIESA.',
  inputs: {
    paramsCustomer:{
      type: 'ref',
      required: true
    },
    paramsAddress:{
      type: 'ref',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let soap = require('strong-soap').soap;
    let url = 'http://190.0.46.6:14999/ServiciosWeb/wsGenerarPlano.asmx?wsdl';
    let customer = inputs.paramsCustomer;
    let address = inputs.paramsAddress;
    let idDepto = address.city.code.slice(0,2);
    let idCity = address.city.code.slice(2);
    let customerName = await sails.helpers.parseName(customer.fullName);
    let secondLastName = customerName.secondLastName !== '' ? customerName.secondLastName : customerName.lastName;
    let requestArgs={
      idDocumento: 80028,
      strNombreDocumento: 'Clientes Ocasionales',
      idCompania: 2,
      strCompania: '1',
      strUsuario: 'gt',
      strClave: 'gt',
      strFuenteDatos:
        `<![CDATA[<MyDataSet>
          <Clientes_Ocasionales>
          <F160_ID>${customer.dni}</F160_ID>
          <F160_NIT>${customer.dni}</F160_NIT>
          <F160_ID_TIPO_IDENT>${customer.dniType === 'NIT' ? 'N' : 'C'}</F160_ID_TIPO_IDENT>
          <F160_IND_TIPO_TERCERO>${customer.dniType === 'NIT' ? 1 : 0}</F160_IND_TIPO_TERCERO>
          <F160_RAZON_SOCIAL>${customer.fullName}</F160_RAZON_SOCIAL>
          <F160_APELLIDO_1>${customer.dniType === 'NIT' ? '' : customerName.lastName}</F160_APELLIDO_1>
          <F160_APELLIDO_2>${customer.dniType === 'NIT' ? '' : secondLastName}</F160_APELLIDO_2>
          <F160_NOMBRE>${customer.dniType === 'NIT' ? '' : customerName.name}</F160_NOMBRE>
          <F160_FECHA_INGRESO>${moment().format('YYYYMMDD')}</F160_FECHA_INGRESO>
          <F160_FECHA_NACIMIENTO>${moment().format('YYYYMMDD')}</F160_FECHA_NACIMIENTO>
          <F015_CONTACTO>${customer.fullName}</F015_CONTACTO>
          <F015_DIRECCION1>${address.addressline1}</F015_DIRECCION1>
          <F015_ID_PAIS>169</F015_ID_PAIS>
          <F015_ID_DEPTO>${idDepto}</F015_ID_DEPTO>
          <F015_ID_CIUDAD>${idCity}</F015_ID_CIUDAD>
          <F015_TELEFONO>${customer.mobile}</F015_TELEFONO>
          <F015_EMAIL>${customer.emailAddress}</F015_EMAIL>
          </Clientes_Ocasionales>
          </MyDataSet>]]>`,
      Path: 'E:'
    };

    let options = { endpoint: 'http://190.0.46.6:14999/ServiciosWeb/wsGenerarPlano.asmx'};
    soap.createClient(url, options, (err, client) =>{
      let method = client['ImportarDatosXML'];
      if(err){return exits.error(err);}
      method(requestArgs, async (err, result)=>{
        if(err){return exits.error(err);}
        if(result){
          return exits.success(result);
        }
      });
    });
  }
};
