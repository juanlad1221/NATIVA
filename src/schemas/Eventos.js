const mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
const Schema = mongoose.Schema;


const eventos_schema = Schema({
    id_docente:          {type:ObjectId, requerid:true},
    name_docente:        {type:String, requerid:true},
    last_name:           {type:String, requerid:true},
    dni:                 {type:String, requerid:true},

    id_licencia:         {type:ObjectId, requerid:true},
    name_licencia:       {type:String, requerid:true},
    code:                {type:String, requerid:true},

    inicio:              {type:Date, requerid:true},
    fin:                 {type:Date, requerid:true},
    down:                {type:Boolean, requerid:true, default:false},
    confirm:             {type:Boolean, requerid:true, default:false},
    number_of_days:      {type:String, requerid:true},
    range:               {type:Object},

    active:              {type:Boolean, requerid:true, default:false},
    low_motive:          {type:String, default:''}
});

//Exporto modelo
module.exports = mongoose.model('eventos',eventos_schema);