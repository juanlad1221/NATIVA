const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const path = require('path');
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
const ejs = require("ejs");
const pdf = require('html-pdf');
const juan = require('../public/ObjExport')


//Shemas
const User = require('../schemas/Users')
const Month = require('../schemas/Month')
const Docentes = require('../schemas/Docentes')
const Licencias = require('../schemas/Licencias')
const Eventos = require('../schemas/Eventos')


//Creo el obj router
const router = express.Router();




router.get('/login', IsNotAuthenticated,function (req, res) {
  res.status(200).render('../views/login')
})//end get

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/home',
  failureRedirect: '/login',
  passReqToCallback: true
}))//end post

router.get("/logout", IsAuthenticated, function (req, res) {
  req.logOut();
  res.redirect('/login');
})//end get

router.get('/home',IsAuthenticated ,async function (req, res) {
  let desdeEsteAño = new Date(new Date().getFullYear(), 0, 1)//principio de año
  let hasta = new Date()//hoy
  let array = []
  let arr = []
  
  //Activas
  let result = await Eventos.where({active:true, confirm:true, down:false}).countDocuments()
  
  //Terminadas este año o año acutual
  let result2 = await Eventos.where({active:false, down:true, fin:{$gte:desdeEsteAño}}).countDocuments()
  
  //No Confirmadas
  let result3 = await Eventos.where({active:false, confirm:false, down:false}).countDocuments()
  
  //Por vencer 
  result6 = await Eventos.where({active:true, confirm:true, down:false})
  let a = 0
  
  result6.forEach(function(e){
  
    //Obtengo los dias restantes
    let dias = juan.Obj.getDaysBetween2DatesObject(e.inicio, e.fin)
  
    if(dias === false){
      console.log('Error in Server: Error en lic. por vencer...')
      a = 'Error'
      return false
    }else{
      if (Number(dias) === 1){
        a++
      }
    }
  })//end for

  
  
  //----Tabla Top3---------------------------------------------
  //Docentes
  let result7 = await Docentes.where({active:true})

  let c = 0
  for(let i in result7){
    //contador en todos los eventos menos los NO confirmados de este año
    c = await Eventos.where({confirm:true, fin:{$gte:desdeEsteAño}, id_docente:ObjectId(result7[i]._id)}).countDocuments()
    
    if(c !== 0){
      //Creo el array de objetos
      arr.push({
        id:result7[i]._id,
        last_name:result7[i].last_name,
        name:result7[i].name,
        cant: c
      })
    }//end if
  }//end for
  
  //elimina los ultimos elementos del array arr
  if(arr.length > 3){
    let iterador = arr.length - 3
    
    for(let i = 0; i < iterador; i++){
      arr.pop()
    }//end for
  }//end if
  
  //Ordeno el array
  arr = juan.Obj.sortArrayOfObjectsByAnyField(arr,'cant')
  //-----FIN TABLA------------------------------------------------------//

  //Mes Validado
  let result4 = await Month.where({isvalidate:true})
  result4.forEach(function(e){
    array.push(Number(e.month))
  })//end
  let mesMayor = juan.Obj.getMayorValueOfArrayOfNumber(array)
  mesMayor = (juan.Obj.getMonthOfNumber(mesMayor)).toUpperCase()


//-------TABLA TOP5-------------------------------------------------------
let array2 = []
let obj = {}
let licencias = await Eventos.where({confirm:true, inicio:{$gte:desdeEsteAño}})

result7.forEach(e => {
  c=0
  licencias.forEach(f => {
    if(String(e._id) === String(f.id_docente)){
      c = c + Number(f.number_of_days)
    }
  })//end for2

  obj = {id:e._id, docente:e.last_name+' '+e.name, cant:c}
  array2.push(obj)
})//end for

//Ordeno el array
let arr2 = juan.Obj.sortArrayOfObjectsByAnyField(array2,'cant')

//Obtengo los primeros 5 elemntos
let arr3 = []
let p=0
for(let i = 0; i < arr2.length; i++){
  if(Number(arr2[i].cant) !== 0){
    //console.log(i)
    arr3.push(arr2[i])
  }
}
//----------fin tabla-----------------------------------------------------


//----Tabla R Particulares------------------------------------------------
c = 0
let arr4 = []
for(let i in result7){
  c = await Eventos.where({confirm:true, inicio:{$gte:desdeEsteAño}, id_docente:ObjectId(result7[i]._id), id_licencia:ObjectId('5e1b0e4dabbb08253c31e896')}).countDocuments()
  if(c !== 0){
    obj = {
      docente:result7[i].last_name+' '+result7[i].name,
      cant:c
    }
    arr4.push(obj)
  } 
}//end for
//------------------fin-------------------------------------------------------

  //Envio datos
  res.status(200).render('../views/home', {user: req.user.username, pin:req.user.pin,
  Activas:result, Baja:result2, No_confirm:result3, PorVencer:a, MesValidado:mesMayor, 
  top3:arr, top5:arr3, rparticulares:arr4 })
})//end get

router.get('/validar_mes',IsAuthenticated ,async function (req, res) {
  let result = await Docentes.where({active:true,tipo:'Grado'})
  let especiales = await Docentes.where({active:true,tipo:'Especial'}).sort({last_name:1})
  let un_docente = result[0].mes_validado
  let obj = {}
  let array = []
  let array2 = []
  let arr = []

  //Obtengo un array con los meses validados es para los docentes de grado
  for(let i = 0; i < un_docente.length; i++){
    array.push(un_docente[i].mes)
  }

  //Docentes Especiales
  especiales.forEach(e => {
    arr = []
    //Armo el obj para cada docente especial sin dias
    obj = {id:e._id, docente: e.last_name+' '+e.name}
    
    //Obtengo el array arr con los meses validados para cada docente especial
    for(let i = 0; i < e.mes_validado.length; i++){
      arr.push(Number(e.mes_validado[i].mes))
    }
    //Asigno dias a cada docente especial
    obj.dias = arr
    array2.push(obj)
  })//end for
  
  res.status(200).render('../views/mes/validar', { user: req.user.username, array, especiales:array2 })
})//end get

router.post('/validar_mes',IsAuthenticated, async function(req, res){
  if(typeof(req.body.mes) !== 'string' ||typeof(req.body.dias) !== 'string' || typeof(req.body.obligaciones) !== 'string'){
    res.status(403).end()
    return false
  }
  
  if(req.body.tipo === 'Grado'){
    //Controlo que el mes a validar no este cargado en BD y que el mes anterior tampoco
    let array = []
    let result = await Docentes.where({active:true,tipo:'Grado'})
    let un_docente = result[0].mes_validado
    for(let i = 0; i < un_docente.length; i++){
      array.push(Number(un_docente[i].mes))
    }
  
    if(array.includes(req.body.mes)){
      //Mes duplicado
      res.status(404).end()
    return false
    }
  
    if(Number(req.body.mes) !== 2){
      let mesAnterior;
      mesAnterior = Number(req.body.mes) - 1
      if(!array.includes(mesAnterior)){
        //Mes anterior no validado
        res.status(405).end()
        return false
      }
    }
  }//end if

  if(req.body.tipo === 'Especial'){
    //Controlo que el mes a validar no este cargado en BD y que el mes anterior tampoco
    let array = []
    let result = await Docentes.where({active:true,tipo:'Especial',_id:ObjectId(req.body.id)})
    let meses = result[0].mes_validado
    for(let i = 0; i < meses.length; i++){
      array.push(Number(meses[i].mes))
    }
    
    if(array.includes(req.body.mes)){
      //Mes duplicado
      res.status(404).end()
      return false
    }
  
    if(Number(req.body.mes) !== 2){
      let mesAnterior;
      mesAnterior = Number(req.body.mes) - 1
      if(!array.includes(mesAnterior)){
        //Mes anterior no validado
        res.status(405).end()
        return false
      }
    }
  }//end if

  
  //Cargo en la BD la validacion
  let obj = {mes:req.body.mes, 
            dias:req.body.dias, 
            obligaciones:req.body.obligaciones, 
            asuetos:req.body.asuetos}

  //Valido el mes
  if(req.body.tipo === 'Grado'){
    await Docentes.updateMany({active:true, tipo:'Grado'},{$push: {mes_validado:obj} })
  }

  if(req.body.tipo === 'Especial'){
    await Docentes.updateOne({active:true, tipo:'Especial', _id:ObjectId(req.body.id)},{$push: {mes_validado:obj} })
  }
  
  console.log('Validacion de mes Exitosa...')
  res.status(200).end()
})//end post

router.get('/cargarDocentes',  (req, res) => {
  let docente = new Docentes()
  docente.last_name = 'Benitez'
  docente.name = 'Elba Raquel'
  docente.dni = '19976060'
  docente.cargo = 'Maestro de Musica'
  docente.tipo = 'Especial'
  docente.mes_validado = [{mes:2, dias:4, obligaciones:1, asuetos:0}, 
    {mes:6, dias:4, obligaciones:1, asuetos:0}]
  docente.save(
    res.send('ok')
  )

  /*let licencia = new Licencias()
  licencia.name = 'Razones Particulares';
  licencia.code = '312';
  licencia.save(
    res.send('ok...')
  )*/
})//end get

router.get('/editar_mes',IsAuthenticated ,async (req, res) => {
  let obj = {}
  //let obj2 = {}
  //let arr = []
  let array = []
  
  let docentes = await Docentes.where({active:true}).sort({tipo:1})
  
  for(let i = 0; i < docentes.length; i++){
    obj = {id:docentes[i]._id, last_name:docentes[i].last_name, name:docentes[i].name, dni:docentes[i].dni, tipo:docentes[i].tipo}
    obj.dias = CreateObject(docentes[i].mes_validado)
    array.push(obj)
  }//end for
  //console.log(array[0])
  res.status(200).render('../views/mes/editar', { user:req.user.username, Docentes:array})
})//end get

router.post('/down', IsAuthenticated, async (req, res) => {
  if(typeof(req.body.id) !== 'string'){
    console.log('Error in server: Tipo de datos incorrecto...')
    res.status(400).end()
    return false;
  }

  //Actualizo
  await Month.where({ isvalidate: true, _id: ObjectId(req.body.id) }).updateOne({ isvalidate: false }).exec()
  res.status(200).end()
})//end post

router.put('/editando',IsAuthenticated ,async (req, res) => {
  //Verifico los datos de entrada
  if(typeof(req.body.id) !== 'string' || typeof(req.body.dias) !== 'string' || typeof(req.body.obligaciones) !== 'string' || typeof(req.body.asuetos) !== 'string'){
    console.log('Error in server: Tipo de datos incorrecto...')
    res.status(400).end()
    return false;
  }
  
  //Actualizo segun tipo
  if(req.body.tipo === 'Grado'){
    //Obtengo docentes y trabajo con el array mes_validado
    let docentes = await Docentes.where({active:true, tipo:'Grado', _id:ObjectId(req.body.id)})
    
    //Creo la query
    let query = CrearQuery(req.body.mes,
      req.body.dias, 
      req.body.obligaciones,
      req.body.asuetos,
      docentes[0].mes_validado)
    
    //Actualizo
    await Docentes.updateMany({active:true, tipo:'Grado'},{$set:query})
    console.log('Acualizacion Exitosa...')
  }//end if

  
  
  if(req.body.tipo === 'Especial'){
    //Obtengo docentes y trabajo con el array mes_validado
    let docentes = await Docentes.where({active:true, tipo:'Especial', _id:ObjectId(req.body.id)})

    //Creo la query
    let query = CrearQuery(req.body.mes,
      req.body.dias, 
      req.body.obligaciones,
      req.body.asuetos,
      docentes[0].mes_validado)
    
    //Actualizo
    await Docentes.updateOne({active:true, tipo:'Especial', _id:ObjectId(req.body.id)},{$set:query})
    console.log('Acualizacion Exitosa...')
  }

  res.status(200).end();
})//end get

router.get('/cargar_licencias',IsAuthenticated ,async (req, res) => {
  let result = await Docentes.where({active:true}).sort({last_name:1})
  let result2 = await Licencias.where({active:true}).sort({code:1})
  let result3 = await Eventos.where({active:false, confirm: false, down:false})
  let result4 = await Eventos.where({active:true, confirm:true, down:false})

  res.status(200).render('../views/licencias/licencias', { user: req.user.username, Docentes:result, 
  Licencias:result2, Eventos:result3, Activas:result4})
})//end get

router.post('/cargar_licencias',IsAuthenticated ,async (req, res)=>{
  let obj = {}
  let obj2 = {}
  let array = []

  //control de Datos
  if(typeof(req.body.docente) !== 'string' || typeof(req.body.licencia) !== 'string'){
    console.log('Error in server: Tipo de datos incorrecto...')
    res.status(401).end()
    return false;
  }

  //Cargo licencia
  let result = await Docentes.where({active:true, _id:ObjectId(req.body.docente)})
  let result2 = await Licencias.where({active:true, _id:ObjectId(req.body.licencia)})

  //Creo fechas para la BD
  let fecha1 = new Date(req.body.fecha1[2], (Number(req.body.fecha1[1]) - 1), req.body.fecha1[0])
  let fecha2 = new Date(req.body.fecha2[2], (Number(req.body.fecha2[1]) - 1), req.body.fecha2[0])
  let fecha1_ = new Date(req.body.fecha1[2], (Number(req.body.fecha1[1]) - 1), req.body.fecha1[0])
  let fecha2_ = new Date(req.body.fecha2[2], (Number(req.body.fecha2[1]) - 1), req.body.fecha2[0])
  console.log(fecha1, fecha2)
  console.log(fecha1_, fecha2_)
  let arr = []
  

  //Obtengo los meses del rango en un array
  for(let i = fecha1.getMonth(); i <= fecha2.getMonth(); i++){
      array.push(i)
  }
    
  //Obtengo array con las fechas de inicio y fin de los meses del rango
  for(let i = 0; i < array.length; i++){
    arr.push(juan.Obj.getFirstAndLastDateOfOneMounthAndAYear(array[i], new Date().getFullYear()))
  }
    
  let a = 0
  let b = arr.length - 1
    
  arr[a][0] = String(juan.Obj.completeTo2Digits(fecha1.getDate())+'/'+juan.Obj.completeTo2Digits(fecha1.getMonth()+1)+'/'+fecha1.getFullYear()) 
  arr[b][1] = String(juan.Obj.completeTo2Digits(fecha2.getDate())+'/'+juan.Obj.completeTo2Digits(fecha2.getMonth()+1)+'/'+fecha2.getFullYear()) 

  let array2 = []
  let cont = 0
  arr.forEach(function(e){
    obj2 = {
      range2: e,
      mes: cont + 1
    }
    array2.push(obj2)
    cont++
    })//end

  //Obtengo los dias de la licencia
  let days = juan.Obj.getDaysBetween2DatesObject(fecha1, fecha2)
  
  let eventos = new Eventos()
  eventos.id_docente = req.body.docente
  eventos.last_name = result[0].last_name
  eventos.name_docente = result[0].name
  eventos.dni = result[0].dni

  eventos.id_licencia = req.body.licencia
  eventos.name_licencia = result2[0].name
  eventos.code = result2[0].code

  eventos.inicio = fecha1_
  eventos.fin = fecha2_
  eventos.range = array2
  eventos.number_of_days = days
  eventos.save(function(err){
    if(err) throw err
    console.log('Evento Creado Exitosamente...')
    res.status(200).end()
  })//end save
})//end post

router.put('/confirmed',IsAuthenticated, async (req, res) => {
  if(typeof(req.body.id) !== 'string' || typeof(req.body.docente) !== 'string'){
    console.log('Error in server: Tipo de datos incorrecto...')
    res.status(400).end()
    return false;
  }
  
  //Controlar licencias activas para el docente a confirmar
  let result = await Eventos.where({active:true, confirm:true, down:false, id_docente:ObjectId(req.body.docente)}).countDocuments().exec()
  if (result !== 0){
    console.log('Error: Docente con licencia Activa...')
    res.status(401).end()
    return false;
  }
  
  await Eventos.where({active:false, confirm:false, down:false, _id:ObjectId(req.body.id)}).updateOne({active:true, confirm:true}).exec()
  console.log('La Actualizacion Fue Exitosa...')
  res.status(200).end()
})//end put

router.delete('/eliminar',IsAuthenticated, async (req, res) => {
  if(typeof(req.body.id) !== 'string'){
    console.log('Error in server: Tipo de datos incorrecto...')
    res.status(400).end()
    return false;
  }
  //console.log(req.body.id)
  await Eventos.deleteOne({active:false, confirm:false, down:false, _id:ObjectId(req.body.id)}).exec()
  console.log('La Eliminacion Fue Exitosa...')
  res.status(200).end()
})//end put

router.get('/licencias_activas',IsAuthenticated, async (req, res) => {
  let result = await Eventos.where({active:true, confirm:true, down:false}).exec()
  res.status(200).end()
})//end get

router.get('/licencias',IsAuthenticated, async (req, res) => {
  //let result = await Eventos.where({})
  res.status(200).render('../views/licencias/ver_licencias', {user: req.user.username})
})//end get

router.get('/licencias2',IsAuthenticated, async (req, res) => {
  let array = []
  let obj = {}
  let result = await Eventos.where({}).sort({last_name:1})
  result.forEach((e)=>{
    obj = {id:e._id,
    last_name:e.last_name,
    name: e.name_docente,
    dni:e.dni,
    name_licencia:e.name_licencia,
    inicio : juan.Obj.convertObjetDateToString(e.inicio),
    fin : juan.Obj.convertObjetDateToString(e.fin)
    }

    if(e.active === true && e.confirm === true && e.down === false){
      obj.status = 'ACTIVA'
    }
    if(e.active === false && e.confirm === true && e.down === true){
      obj.status = "<a atr='"+e.low_motive+"'href='#' class='icon'>"+'TERMINADA'+'</a>'
    }
    if(e.active === false && e.confirm === false && e.down === false){
      obj.status = 'NO CONFIRMADA'
    }
    array.push(obj)
  })//end
  //console.log(array)
  res.status(200).json({data:array})
})//end get


router.get('/test/:id',async function(req, res){
  let none = '--'
  let flag = 'disabled'
  let obj = {}
  let nombre = 'Planilla Anual ' + new Date().getFullYear() + '.pdf'

  //Obtengo datos de los docentes segun el id
  let docente = await Docentes.where({active:true, _id:req.params.id})
  //Obtengo datos de Meses
  let meses = await Month.where({isvalidate:true})
  //Obtengo Eventos
  let eventos = await Eventos.where({active:true, confirm:true, down:false, id_docente:req.params.id})
  
  meses.forEach(function(e){
    switch(e.month){
      case '2':
        calCL2 = juan.Obj.completeTo2Digits(e.days_in_month)
        licencia2 = [{lic:'312'},{lic:'321'},{lic:'323/A'}]
        asueto2 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '3':
        calCL3 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto3 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '4':
        calCL4 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto4 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '5':
        calCL5 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto5 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '6':
        calCL6 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto6 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '7':
        calCL7 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto7 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '8':
        calCL8 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto8 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '9':
        calCL9 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto9 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '10':
        calCL10 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto10 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '11':
        calCL11 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto11 = juan.Obj.completeTo2Digits(e.astute)
      break
      case '12':
        calCL12 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto12 = juan.Obj.completeTo2Digits(e.astute)
      break
    }
  })//end for


  
  let licencia1=[{lic:'312'},{lic:'321'},{lic:'323/A'}]
  

  obj.año = new Date().getFullYear()
  obj.last_name = docente[0].last_name
  obj.name = docente[0].name
  obj.dni = 'DNI: '+ docente[0].dni
  obj.meses = [{mes:'FEBRERO', calendarioCL:calCL2, calendarioOCL:none, asistenciaCL:1,asistenciaOC:1,asueto:asueto2,licencias:licencia2}, 
  {mes:'MARZO', calendarioCL:calCL3, ocl:none, asueto:asueto3}, 
  {mes:'ABRIL', calendarioCL:calCL4, ocl:none, asueto:asueto4,licencias:licencia2},
  {mes:'MAYO', cl:2, ocl:1}, 
  {mes:'JUNIO', cl:2, ocl:1}, 
  {mes:'JULIO', cl:2, ocl:1},
  {mes:'AGOSTO', cl:2, ocl:1},
  {mes:'SEPTIEMBRE', cl:2, ocl:1},
  {mes:'OCTUBRE', cl:2, ocl:1},
  {mes:'NOVIEMBRE', cl:2, ocl:1}, 
  {mes:'DICIEMBRE', cl:2, ocl:1}]

  
//console.log(obj)

  //console.log(obj.año)
  ejs.renderFile(path.join(__dirname, '../views', 'plantilla2.ejs'), {datos:obj}, (err, data) =>{

    if (err) {
      console.log(err)
      res.send(err);
    } else {
      console.log('paso')
    var options = {
      'format': 'legal',
      'orientation': "landscape",
      'base': 'C:/Users/Usuario/Desktop/Sistema Paola/src/public'
      
      }
    }//end else


    pdf.create(data, options).toFile('./' + nombre , function (err, data) {
      if (err) {
          res.send(err);
      } else {
          res.send("File created successfully");
      }
  })


  })//end ejs
  
  
  
  
  
  
})//end test








router.get('/planilla/:id', async (req, res) => {
  let none = '--'
  let flag = 'disabled'
  let obj = {}
  let obj2 = {}
  let iterador=[2,3,4,5,6,7,8,9,10,11,12]
  let calcl2 = none
  let calocl2 = none
  let asuet2 = none

  let calcl3 = none
  let calocl3 = none
  let asuet3 = none

  let calcl4 = none
  let calocl4 = none
  let asuet4 = none
  
  //Obtengo datos de los docentes segun el id
  let docente = await Docentes.where({active:true, _id:req.params.id})
  
  //Obtengo Eventos segun id. Salvos los eventos NO confirmados
  let eventos = await Eventos.where({confirm:true, id_docente:req.params.id})
  
  //Datos Personales
  obj.año = new Date().getFullYear()
  obj.last_name = docente[0].last_name 
  obj.name = docente[0].name
  obj.dni = 'DNI: '+ docente[0].dni
  obj.cargo = docente[0].cargo.toUpperCase()

  docente[0].mes_validado.forEach(e => {
    switch(e.mes){
      case '2':
        calcl2 = e.dias
        calocl2 = e.obligaciones
        asuet2 = e.asuetos
      break
      case '3':
        calcl3 = e.dias
        calocl3 = e.obligaciones
        asuet3 = e.asuetos
      break
      case '4':
        calcl4 = e.dias
        calocl4 = e.obligaciones
        asuet4 = e.asuetos
      break
    }
  })

  //Obtengo datos de calendario asuetos etc
  iterador.forEach(function(e){
    switch(e){
      case 2:
        calCL2 = juan.Obj.completeTo2Digits(calcl2)
        calOCL2 = calocl2,

        asistCL2 = none,
        asistOC2 = none,

        inasisAclaseJ2 = none,
        inasisAclaseI2 = none,
        inasisOCJ2 = none,
        inasisOCI2 = none,

        tardanzasJ2 = none,
        tardanzasI2 = none,

        retirosJ2 = none,
        retirosI2 = none,
        licencias2 = CrearRangeObj2(2, eventos),
        //console.log(licencias2)
        asueto2 = juan.Obj.completeTo2Digits(asuet2)
      break
      case 3:
        calCL3 = juan.Obj.completeTo2Digits(calcl3)
        calOCL3 = calocl3,

        asistCL3 = none,
        asistOC3 = none,

        inasisAclaseJ3=none,
        inasisAclaseI3=none,
        inasisOCJ3 = none,
        inasisOCI3 = none,

        tardanzasJ3 = none,
        tardanzasI3 = none,

        retirosJ3 = none,
        retirosI3 = none,
        licencias3 = CrearRangeObj2(3, eventos)
        asueto3 = juan.Obj.completeTo2Digits(asuet3)
      break
      case 4:
        calCL4 = juan.Obj.completeTo2Digits(calcl4)
        calOCL4 = calocl4,

        asistCL4 = none,
        asistOC4 = none,

        inasisAclaseJ4 = none,
        inasisAclaseI4 = none,
        inasisOCJ4 = none,
        inasisOCI4 = none,

        tardanzasJ4 = none,
        tardanzasI4 = none,

        retirosJ4 = none,
        retirosI4 = none,
        licencias4 = CrearRangeObj2(4, eventos),
        asueto4 = juan.Obj.completeTo2Digits(asuet4)
      break
      case 5:
        calCL5 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto5 = juan.Obj.completeTo2Digits(e.astute)
      break
      case 6:
        calCL6 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto6 = juan.Obj.completeTo2Digits(e.astute)
      break
      case 7:
        calCL7 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto7 = juan.Obj.completeTo2Digits(e.astute)
      break
      case 8:
        calCL8 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto8 = juan.Obj.completeTo2Digits(e.astute)
      break
      case 9:
        calCL9 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto9 = juan.Obj.completeTo2Digits(e.astute)
      break
      case 10:
        calCL10 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto10 = juan.Obj.completeTo2Digits(e.astute)
      break
      case 11:
        calCL11 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto11 = juan.Obj.completeTo2Digits(e.astute)
      break
      case 12:
        calCL12 = juan.Obj.completeTo2Digits(e.days_in_month)
        asueto12 = juan.Obj.completeTo2Digits(e.astute)
      break
    }
  })//end for

  
//Objeto 2 a enviar a plantilla
  obj2 = [{
    mes:'FEBRERO',
    calCL: calCL2,
    calOCL:calOCL2,
    asistCL : asistCL2,
    asistOC : asistOC2,
    inasisAclaseJ:inasisOCJ2,
    inasisAclaseI:inasisOCI2,
    inasisOCJ:inasisAclaseJ2,
    inasisOCI:inasisAclaseI2,
    tardanzasJ: tardanzasJ2,
    tardanzasI: tardanzasI2,
    retirosJ: retirosJ2,
    retirosI: retirosI2,
    licencias: licencias2,
    asueto: asueto2
  },
  {
    mes:'MARZO',
    calCL: calCL3,
    calOCL:calOCL3,
    asistCL : asistCL3,
    asistOC : asistOC3,
    inasisAclaseJ:inasisOCJ3,
    inasisAclaseI:inasisOCI3,
    inasisOCJ:inasisOCJ3,
    inasisOCI:inasisOCI3,
    tardanzasJ: tardanzasJ3,
    tardanzasI: tardanzasI3,
    retirosJ: retirosJ3,
    retirosI: retirosI3,
    licencias: licencias3,
    asueto: asueto3
  },
  {
    mes:'ABRIL',
    calCL: calCL4,
    calOCL:calOCL4,
    asistCL : asistCL4,
    asistOC : asistOC4,
    inasisAclaseJ:inasisOCJ4,
    inasisAclaseI:inasisOCI4,
    inasisOCJ:inasisOCJ4,
    inasisOCI:inasisOCI4,
    tardanzasJ: tardanzasJ4,
    tardanzasI: tardanzasI4,
    retirosJ: retirosJ4,
    retirosI: retirosI4,
    licencias: licencias4,
    asueto: asueto4
  }
]

res.status(200).render('../views/planilla',{persona:obj, tabla:obj2,flag:flag})
})//end get






router.get('/baja_prematura2',IsAuthenticated, async (req, res) => {
  //Busco licencias activas
  let result = await Eventos.where({active:true, confirm:true, down:false})
  let arr = []
  let obj = {}
  result.forEach((e)=>{
    obj = {
    id : e._id,
    last_name : e.last_name,
    name : e.name_docente,
    dni : e.dni,
    name_licencia : e.name_licencia,
    inicio : juan.Obj.convertObjetDateToString(e.inicio),
    fin : juan.Obj.convertObjetDateToString(e.fin)
    }
    arr.push(obj)
  })
  
  res.status(200).json({data:arr})
})//end get

router.get('/baja_prematura',IsAuthenticated, async (req, res) => {
  
  res.status(200).render('../views/licencias/baja_prematura', {user: req.user.username})
})//end get

router.delete('/bajaPrematura',IsAuthenticated,IsAuthenticated,async (req, res) => {
  if(typeof(req.body.id) !== 'string'){
    console.log('Error in server: Tipo de datos incorrecto...')
    res.status(400).end()
    return false;
  }

  await Eventos.where({active:true, _id:ObjectId(req.body.id)}).updateOne({active:false, 
     down:true, low_motive:'Baja de Licencia por Usuario' + new Date()})
    console.log('Operacion Exitosa en /bajaPrematura...')
    res.status(200).end()
})//end delete

router.get('/moda',IsAuthenticated, async (req, res) => {
  let c = 0
  let obj = {}
  let array = []

  //Obtengo los tipos de licencias
  let result = await Licencias.where({active:true})
  for(let i in result){
    c = await Eventos.where({confirm:true, id_licencia:result[i]._id}).countDocuments()
   if(c !== 0){
      obj={x:result[i].name, value:c}
      array.push(obj)
    }
  }
  res.status(200).json(array)
})//end get

router.get('/rparticulares',async (req, res) => {
  let c = 0
  let array = []
  let docentes = await Docentes.where({active:true})

  for(let i in docentes){
    c = await Eventos.where({confirm:true, id_docente:ObjectId(docentes[i]._id), code:'312'}).countDocuments()
    if(c !== 0){
      obj = {
        docente:docentes[i].last_name+' '+docentes[i].name,
        cant:c
      }
      array.push(obj)
    } 
  }//end for
  res.status(200).json(array)
})//end get



router.get('/informes',async (req, res) => {
  
  let result = await Docentes.where({active:true}).sort({last_name:1})

  res.status(200).render('../views/informes', {user: 'req.user.username'})
})//end get

router.get('/informes2',async (req, res) => {
 let result = await Docentes.where({active:true}).sort({last_name:1})
  let dato = {data:result}
  res.status(200).json(dato)
})//end get





router.get('/hoho', function(req,res){
  res.render('../views/test')
})








//Functions
//Objeto que convierte string en capitalize
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function IsAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

function IsNotAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/home");
  }
}

function CrearRangeObj2(mes, eventos){
  let obj = {}
  let array = []
  let Mes = Number(mes) - 1;
  eventos.forEach(function(e){
    e.range.forEach(function(f){
      if (f.mes === Mes){
       obj = {
         desde:f.range2[0],
         hasta:f.range2[1],
         lic:e.code,
         days:e.days_in_month
       } 
       array.push(obj)
      }
    })//end for2
  })//for

  if(array.length === 0){
    obj = {
      desde:'--',
      hasta:'--',
      lic:'--',
      days:'--'
    }
    array.push(obj)
    return array
  }else{
    return array
  }
}//end

function CreateObject(arr){
  let obj3 = [{mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'2'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'3'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'4'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'5'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'6'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'7'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'8'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'9'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'10'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'11'},
  {mes:'',dias:'',obligaciones:'',asuetos:'',idcol:'12'}]
  let arr2 = []
  
  arr.forEach(e => {

      for(let i in obj3){
        if (obj3[i].idcol === String(e.mes)){
          obj3[i].mes = String(e.mes)
          obj3[i].dias = String(e.dias)
          obj3[i].obligaciones = String(e.obligaciones)
          obj3[i].asuetos = String(e.asuetos)
        }
      }
  })//end
  return obj3
}//end

function CrearQuery(mes, dias, obligaciones, asuetos, array){
  let index = juan.Obj.getIndexOfObjectArray(array, String(mes))
  
  if(index === 0 ){
    return {'mes_validado.0.dias': dias,'mes_validado.0.obligaciones': obligaciones, 'mes_validado.0.asuetos': asuetos}
  }
  if(index === 1 ){
    return {'mes_validado.1.dias': dias,'mes_validado.1.obligaciones': obligaciones, 'mes_validado.1.asuetos': asuetos}
  }
  if(index === 2 ){
    return {'mes_validado.2.dias': dias,'mes_validado.2.obligaciones': obligaciones, 'mes_validado.2.asuetos': asuetos}
  }
  if(index === 3 ){
    return {'mes_validado.3.dias': dias,'mes_validado.3.obligaciones': obligaciones, 'mes_validado.3.asuetos': asuetos}
  }
  if(index === 4 ){
    return {'mes_validado.4.dias': dias,'mes_validado.4.obligaciones': obligaciones, 'mes_validado.4.asuetos': asuetos}
  }
  if(index === 5 ){
    return {'mes_validado.5.dias': dias,'mes_validado.5.obligaciones': obligaciones, 'mes_validado.5.asuetos': asuetos}
  }
  if(index === 6 ){
    return {'mes_validado.6.dias': dias,'mes_validado.6.obligaciones': obligaciones, 'mes_validado.6.asuetos': asuetos}
  }
  if(index === 7 ){
    return {'mes_validado.7.dias': dias,'mes_validado.7.obligaciones': obligaciones, 'mes_validado.7.asuetos': asuetos}
  }
  if(index === 8 ){
    return {'mes_validado.8.dias': dias,'mes_validado.8.obligaciones': obligaciones, 'mes_validado.8.asuetos': asuetos}
  }
  if(index === 9 ){
    return {'mes_validado.9.dias': dias,'mes_validado.9.obligaciones': obligaciones, 'mes_validado.9.asuetos': asuetos}
  }
  if(index === 10 ){
    return {'mes_validado.10.dias': dias,'mes_validado.10.obligaciones': obligaciones, 'mes_validado.10.asuetos': asuetos}
  }
}//end

//Exporto las rutas
module.exports = router;
