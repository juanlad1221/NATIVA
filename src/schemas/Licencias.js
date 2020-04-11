const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const licencias_schema = Schema({
    name:                {type:String, requerid:true},
    code:                {type:String, requerid:true},  
    active:              {type:Boolean, requerid:true, default:true},
    low_motive:          {type:String, default:''}
});

//Exporto modelo
module.exports = mongoose.model('licencias',licencias_schema);