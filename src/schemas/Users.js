const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const users_schema = Schema({
    username:            {type:String, requerid:true},
    password:            {type:String, requerid:true},
    pin:                 {type:Number, requerid:true},
    active:              {type:Boolean, requerid:true, default:true},
    low_motive:          {type:String, default:''}
});

//Exporto modelo
module.exports = mongoose.model('users',users_schema);