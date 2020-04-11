const Obj = {

    //Ajax
    ajax: function(verb, url, data){
        //var t;
        //Validacion de Datos de Entrada
        if(verb === '' || verb === null || typeof(verb) === 'undefined' || typeof(verb) !== 'string'){console.log('Error: Tipo de Dato Incorrecto'); return false;}
        if(url === '' || url === null || typeof(url) === 'undefined' || typeof(url) !== 'string'){console.log('Error: Tipo de Dato Incorrecto'); return false;}
        if(typeof(data) !== 'object' || Object.keys(data).length === 0){console.log('Error: Tipo de Dato Incorrecto'); return false;}
    
        //Obj
        $.ajax({
            type:verb,
            url:url,
            data:data
        }).done(async function(res){
            toastr.success('La Operacion Fue Exitosa', '¡OK!', { timeOut: 3000 })
            await sleep(2000)
            window.location.reload()
        })
        .fail(async function(err){
            toastr.error('La Operacion NO Pudo Resolverse...', 'ERROR', { timeOut: 3000 })
            await sleep(2000)
            window.location.reload()
        })
    },//end ajax

    ajaxConfigMsg: function(verb, url, data, msgok, msgerror, closemodal){
        //Validacion de Datos de Entrada
        if(verb === '' || verb === null || typeof(verb) === 'undefined' || typeof(verb) !== 'string'){console.log('Error: Tipo de Dato Incorrecto'); return false;}
        if(url === '' || url === null || typeof(url) === 'undefined' || typeof(url) !== 'string'){console.log('Error: Tipo de Dato Incorrecto'); return false;}
        if(typeof(data) !== 'object' || Object.keys(data).length === 0){console.log('Error: Tipo de Dato Incorrecto'); return false;}
    
        //Obj
        $.ajax({
            type:verb,
            url:url,
            data:data
        }).done(async function(res){
            if(closemodal !== 'undefined'){
                $(closemodal).modal('hide')
            }
            toastr.success(msgok, '¡OK!', { timeOut: 3000 })
            await sleep(2000)
            window.location.reload()
        })
        .fail(async function(err){
            if(closemodal !== 'undefined'){
                $(closemodal).modal('hide')
            }
            for(let i in msgerror){
                if(msgerror[i].code === err.status){
                    toastr.error(msgerror[i].msg, 'ERROR', { timeOut: 3000 })
                    await sleep(2000)
                    window.location.reload()
                }
            }//end for
        })
    },//end ajaxConfigMsg

    
    //Date String
    equalDateString: function(date1, date2){
        date1 = date1.split('/',3)
        date2 = date2.split('/',3)

        if (date1[2] === date2[2] && date1[1] === date2[1] && date1[0] === date2[0]){
            return true
        }else{
            return false
        }
    },//end equalDateString

    firstDateMayorString: function(date1, date2){
        date1 = date1.split('/',3)
        date2 = date2.split('/',3)

        //Si año fecha 1 es mayor que año fecha 2
        if(Number(date1[2]) > Number(date2[2])){
            return true
        }

        //Si ambos años son iguales pero mes1 es mayor que mes2
        if(Number(date1[2]) === Number(date2[2]) && Number(date1[1]) > Number(date2[1])){
            return true
        }

        //Si ambos años y mese son iguales pero dia1 es mayor que dia2
        if(Number(date1[2]) === Number(date2[2]) && Number(date1[1]) === Number(date2[1]) && Number(date1[0]) > Number(date2[0])){
            return true
        }

        return false
    },//end firstDateMayorString

    convertObjetDateToString: function(date){
        let dia_ = String(date.getDate());
        let mes_ = String((date.getMonth() + 1));
        let año_ = String(date.getFullYear());

        if (dia_.length == 1) {
            dia_ = '0' + dia_;
        }
        if (mes_.length == 1) {
            mes_ = '0' + mes_;
        }
        return String(dia_ + '/' + mes_ + '/' + año_)
    },//end convertObjetDateToString

    
    //Date Object
    equalDateObject: function(date1, date2){
        if (date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()){
            return true
        }else{
            return false
        }
    },//end equalDateObject

    getDaysBetween2DatesObject:function(dmenor, dmayor){
        let dia;
        let c = 0;
        if(dmenor > dmayor){
            return false
        }

        for(let i = 0; i == 0;){
            c++
            if(this.equalDateObject(dmenor,dmayor)){
                return c
                break;
            }else{
                dia = dmenor.getDate() + 1
                dmenor.setDate(dia)
            }
        }
    },//getDaysBetween2DatesObject

    getFirstAndLastDateOfOneMounthAndAYear: function(mes, año){
        let date = new Date(año,mes,1)
        let primerDia = new Date(date.getFullYear(), date.getMonth(), 1)
        let ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return[String(this.completeTo2Digits(primerDia.getDate()) +'/'+ this.completeTo2Digits((Number(mes)) + 1)+ '/' + año), String(this.completeTo2Digits(ultimoDia.getDate())+ '/' + this.completeTo2Digits((Number(mes) + 1))+ '/'+ año)]
    },//getFirstAndLastDateOfOneMounthAndAYear



    //Colors Random
    randomColors: function(num) {
        let r;
        let g;
        let b;
        let colorArray = []
        
        for(let i =0; i < num; i++){
            r = Math.floor(Math.random() * 255);
            g = Math.floor(Math.random() * 255);
            b = Math.floor(Math.random() * 255);
            
            colorArray.push("rgb(" + r + "," + g + "," + b + ")")
        }//end for

        return colorArray
    },//end randomColors

    
    
    
    //Mayor Value in Object
    mayorValueInObject: function(obj){
        let a;
        let keys = []
        let values = []
            
      //Paso el Objeto devuelto a dos Arrays
      for(let i in obj){
          keys.push(i)
          values.push(Number(obj[i]))
      }//end for

      a = keys.sort()
      a.reverse()
      return a[0]
    }//end mayor value

}//end obj


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  