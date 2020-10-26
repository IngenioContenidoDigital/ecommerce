module.exports = {
    friendlyName: 'Imprimir Guia',
    description: 'Guia carrier.',
    inputs: {
      tracking:{
        type:'string',
        required:true
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs,exits) {
        const pdf = require('html-pdf');
        // const pdf2base64 = require('pdf-to-base64');
        let html='<p>hola mundo</p>';
        var options = { format: 'Letter' };
        pdf.create(html, options).toFile('./businesscard.pdf', function(err, res) {
            if (err) return console.log(err);
            console.log(res) ; // { filename: '/app/businesscard.pdf' }
          });
        // console.log(guia);
  
    }
  };
  
  