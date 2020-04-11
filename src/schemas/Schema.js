const mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
const Schema = mongoose.Schema;


const schema_schema = Schema({
    id:                     {type:ObjectId, requerid:true},
    name:                   {type:String, requerid:true},
    address:                {type:String, requerid:true},
    phone:                  {type:Number},
    movil:                  {type:Number},
    location:               {type:String, requerid:true},
    dates:                  [{type:Date, requerid:true}],
    active:                 {type:Boolean, requerid:true, default:true}
});

//Exporto modelo
module.exports = mongoose.model('schema',schema_schema);