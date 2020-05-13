module.exports = {
  friendlyName: 'Send email',
  description: '',
  inputs: {
    template: {
      description: 'The relative path to an EJS template within our `views/emails/` folder -- WITHOUT the file extension.',
      extendedDescription: 'Use strings like "foo" or "foo/bar", but NEVER "foo/bar.ejs".  For example, '+
        '"marketing/welcome" would send an email using the "views/emails/marketing/welcome.ejs" template.',
      example: 'email-reset-password',
      type: 'string',
      required: true
    },
    templateData: {
      description: 'A dictionary of data which will be accessible in the EJS template.',
      extendedDescription: 'Each key will be a local variable accessible in the template.  For instance, if you supply '+
        'a dictionary with a \`friends\` key, and \`friends\` is an array like \`[{name:"Chandra"}, {name:"Mary"}]\`),'+
        'then you will be able to access \`friends\` from the template:\n'+
        '\`\`\`\n'+
        '<ul>\n'+
         '<% for (friend of friends){ %><li><%= friend.name %></li><% }); %>\n'+
        '</ul>\n'+
        '\`\`\`'+
        '\n'+
        'This is EJS, so use \`<%= %>\` to inject the HTML-escaped content of a variable, \`<%= %>\` to skip HTML-escaping '+
        'and inject the data as-is, or \`<% %>\` to execute some JavaScript code such as an \`if\` statement or \`for\` loop.',
      type: {},
      defaultsTo: {}
    },
    to: {
      description: 'The email address of the primary recipient.',
      extendedDescription: 'If this is any address ending in "@example.com", then don\'t actually deliver the message. '+
        'Instead, just log it to the console.',
      example: 'foo@bar.com',
      required: true
    },
    subject: {
      description: 'The subject of the email.',
      example: 'Hello there.',
      defaultsTo: ''
    },
    layout: {
      description: 'Set to `false` to disable layouts altogether, or provide the path (relative '+
        'from `views/layouts/`) to an override email layout.',
      defaultsTo: 'email',
      custom: (layout)=>layout===false || _.isString(layout)
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {

    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');

    var path = require('path');
    var url = require('url');
    var util = require('util');

    // Determine appropriate email layout and template to use.
    var emailTemplatePath = path.join('emails/', inputs.template);
    var layout;
    if (inputs.layout) {
      layout = path.relative(path.dirname(emailTemplatePath), path.resolve('layouts/', inputs.layout));
    } else {
      layout = false;
    }

    // Compile HTML template.
    // > Note that we set the layout, provide access to core `url` package (for
    // > building links and image srcs, etc.), and also provide access to core
    // > `util` package (for dumping debug data in internal emails).
    var htmlEmailContents = await sails.renderView(
      emailTemplatePath,
      _.extend({layout, url, util }, inputs.templateData)
    )
    .intercept((err)=>{
      err.message =
      'Could not compile view template.\n'+
      '(Usually, this means the provided data is invalid, or missing a piece.)\n'+
      'Details:\n'+
      err.message;
      return err;
    });

    let params = {
      Destination: { /* required */
        ToAddresses: [inputs.to]
      },
      Source: 'luis.quinones@ingeniocontenido.co', /* required */
      /*ReplyToAddresses: [
        'EMAIL_ADDRESS',
      ],*/
      Message: { /* required */
        Body: { /* required */
          Html: {
            Charset: 'UTF-8',
            Data: htmlEmailContents
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: inputs.subject
        }
      }
    };

    // Create the promise and SES service object
    let sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

    // Handle promise's fulfilled/rejected states
    sendPromise
    .then((data) => {return exits.success(data.MessageId);})
    .catch((err) => {return exits.error(err);});
  }
};

