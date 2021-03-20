module.exports = {
  friendlyName: 'Manifest',
  description: 'Manifest dafiti.',
  inputs: {
    manifestCode: {
      type:'string',
      required:true,
    },
    integration:{
      type:'ref',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    const PDFDocument = require('pdf-lib').PDFDocument;
    const integration = inputs.integration;
    try {
      let sign = await sails.helpers.channel.dafiti.sign(integration,'GetManifestDocument',integration.seller,['ManifestCode='+inputs.manifestCode]);
      await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST').then(async (resData)=>{
        resData = JSON.parse(resData);
        if(resData.SuccessResponse.Body.File){
          const resultBuf = Buffer.from(resData.SuccessResponse.Body.File, 'base64');
          const mergedPdf = await PDFDocument.create();
          for (let i = 0; i < 2; i++) {
            const pdf = await PDFDocument.load(resultBuf);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
              mergedPdf.addPage(page);
            });
          }
          const buf = await mergedPdf.save();
          const resultPdf = Buffer.from(new Uint8Array(buf)).toString('base64');
          return exits.success({guia: resultPdf, error: null});
        }else{
          return exits.success({guia: null, error: resData.ErrorResponse.Head.ErrorMessage});
        }
      });
    } catch (error) {
      return exits.success({guia: null, error: error.message});
    }
  }
};
