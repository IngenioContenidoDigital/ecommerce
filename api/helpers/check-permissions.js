module.exports = {
  friendlyName: 'Check permissions',
  description: 'Verificar los permisos del usuario para ejecutar cualquier acción',
  inputs: {
    profile:{
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
    let profile = await Profile.findOne({id:inputs.profile}).populate('permissions');
    let permissions = [];
    for(let p of profile.permissions){
      permissions.push(p.name);
    }
    profile.permissions = permissions;
    return exits.success(profile);
  }
};

