const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const month_schema = Schema({
    month:                  {type:String, requerid:true},
    year:                   {type:String, requerid:true},
    days_in_month:          {type:String, requerid:true},
    concurrent_obligations: {type:String, requerid:true},
    astute:                 {type:String, requerid:true},
    isvalidate:             {type:Boolean, requerid:true}
});

//Exporto modelo
module.exports = mongoose.model('month',month_schema);