var express = require('express');
var router = express.Router();
xlsxj = require("xlsx-to-json");
var multer = require('multer');
var dateFormat = require('dateformat');

var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hotro_hoctap'
});

connection.connect()

router.get('/', function(req, res, next) {
	if(!req.session.idUser){
	    res.redirect("/dang-nhap");
  	} else {
  		connection.query("SELECT * FROM user WHERE idUser = ? ",[req.session.idUser],function(er,data){
        connection.query("SELECT * FROM chatting_mgs",function(er,listMgs){
          listMgs.forEach(function(val,key){
            val.ThoiGian = dateFormat(val.ThoiGian, "h:MM:ss dd-mm-yyyy");
          })
          res.render('pages/chat',{'login' : data[0].idUser, data : data, listMgs : listMgs});
        });
  		});
  	}
});

module.exports = router;