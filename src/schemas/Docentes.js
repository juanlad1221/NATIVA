const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const docentes_schema = Schema({
    name:                {type:String, requerid:true},
    last_name:           {type:String, requerid:true},
    dni:                 {type:String, requerid:true},
    tipo:                {type:String, requerid:true},
    mes_validado:        {type:Array,  requerid:true},
    cargo:               {type:String, requerid:true},
    active:              {type:Boolean, requerid:true, default:true},
    low_motive:          {type:String,  default:''}
})

//Exporto modelo
module.exports = mongoose.model('docentes',docentes_schema);