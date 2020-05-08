module.exports = {

  friendlyName: 'Login',
  description: 'Inicio de sesión de usuario uando email y clave.',
  extendedDescription:
`This action attempts to look up the user record in the database with the
specified email address.  Then, if such a user exists, it uses
bcrypt to compare the hashed password from the database with the provided
password attempt.`,

  inputs: {

    emailAddress: {
      description: 'The email to try in this attempt, e.g. "irl@example.com".',
      type: 'string',
      required: true
    },
    password: {
      description: 'The unencrypted password to try in this attempt, e.g. "passwordlol".',
      type: 'string',
      required: true,
      protect:true,
    }

  },

  exits: {
    success: {
      responseType: 'redirect',
      description: 'The requesting user agent has been successfully logged in.',
      extendedDescription:
`Under the covers, this stores the id of the logged-in user in the session
as the \`userId\` key.  The next time this user agent sends a request, assuming
it includes a cookie (like a web browser), Sails will automatically make this
user id available as req.session.userId in the corresponding action.  (Also note
that, thanks to the included "custom" hook, when a relevant request is received
from a logged-in user, that user's entire record from the database will be fetched
and exposed as \`req.me\`.)`
    },
    admin:{
      responseType:'view',
      viewTemplatePath: 'pages/homepage',
    },
    badCombo: {
      responseType:'view',
      viewTemplatePath: 'pages/configuration/login',
      description: `The provided email and password combination does not
      match any user in the database.`
      // ^This uses the custom `unauthorized` response located in `api/responses/unauthorized.js`.
      // To customize the generic "unauthorized" response across this entire app, change that file
      // (see api/responses/unauthorized).
      //
      // To customize the response for _only this_ action, replace `responseType` with
      // something else.  For example, you might set `statusCode: 498` and change the
      // implementation below accordingly (see http://sailsjs.com/docs/concepts/controllers).
    }

  },

  fn: async function (inputs,exits) {
    // Look up by the email address.
    // (note that we lowercase it to ensure the lookup is always case-insensitive,
    // regardless of which database we're using)
    let userRecord = null;

    userRecord = await User.findOne({emailAddress: inputs.emailAddress.toLowerCase().trim(),});
    if(!userRecord){
      return exits.badCombo({error:'El Email ingresado es Incorrecto'});
    }
    try{
      await sails.helpers.passwords.checkPassword(inputs.password, userRecord.password);
    }catch(err){
      return exits.badCombo({error:err.code+' La Contraseña es incorrecta'});
    }

    if (inputs.rememberMe) {
      if (this.req.isSocket) {
        sails.log.warn(
              'Received `rememberMe: true` from a virtual request, but it was ignored\n'+
              'because a browser\'s session cookie cannot be reset over sockets.\n'+
              'Please use a traditional HTTP request instead.'
        );
      } else {
        this.req.session.cookie.maxAge = sails.config.custom.rememberMeCookieMaxAge;
      }
    }
    this.req.session.user = userRecord;
    let profile = await Profile.findOne({id:userRecord.profile});

    if(profile.name!=='customer'){
      return exits.admin({layout:'layouts/admin'});
    }else{
      return exits.success('/');
    }
    
  }
};
