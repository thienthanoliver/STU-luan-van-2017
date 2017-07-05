var express = require('express');
var router = express.Router();
xlsxj = require("xlsx-to-json");
var multer = require('multer');
var dateFormat = require('dateformat');
var nodemailer =  require('nodemailer');

var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hotro_hoctap'
});
connection.connect();

router.get('/load-comments/:idBaiViet/:idHoiDap', function(req, res, next) {
	idBaiViet = req.params.idBaiViet;
	idHoiDap = req.params.idHoiDap;
	query = idBaiViet > 0 ? " b.idBaiViet="+idBaiViet : " b.idHoiDap= "+idHoiDap;
	html = "";
	connection.query("SELECT b.*,u.HoTen FROM binhluan b join user u on u.idUser = b.idUser WHERE "+ query+" ORDER BY b.id DESC" , function(er,data){
		connection.query("SELECT t.*, u.HoTen FROM traloibinhluan t join user u on u.idUser = t.idUser",function(err,traloi){
			data.forEach(function(val,key){
				html += '<div class="row" id="delAll"><div class="row">';
        html += '<div class="col-md-1"><img style="width : 52px" src="/images/user.png" alt=""></div>';
        html += '<div class="col-md-6"><strong style="color: #365899">'+ val.HoTen +'</strong>';
        html += '<pre>'+ val.NoiDung +'</pre></div><div class="col-md-2"><br>';
        html += '<strong> <a class="thich" idBinhLuan="'+val.id+'" href="javascript:void(0)" title="">Like</a> (<span class="thich">'+ val.Thich +'</span>) </strong><br><strong><a idUser="'+val.idUser+'" idBinhLuan="'+val.id+'" style="color: red" href="javascript:void(0)" title="">Xoá</a> </strong></div><div class="col-md-1"></div><div class="col-md-2"> <br>'+ dateFormat(val.Time,"HH'h'MM'ps' dd-mm-yyyy") +'</div>';
        html += '</div><div id="'+ val.id +'-binhluan">';
        	traloi.forEach(function(v,k){
	        	if(val.id == v.idBinhLuan ){
	        		html += '<div class="row"><div class="col-md-1"></div><div class="col-md-1"><img style="width : 52px" src="/images/user.png" alt=""></div>';
	            html += '<div class="col-md-6"><strong style="color: #365899">'+ v.HoTen +'</strong>';
	            html += '<pre>'+ v.NoiDung +'</pre></div><div class="col-md-2"><br>';
	            html += '<strong> <a class="thich" idRepBL="'+v.id+'" href="javascript:void(0)" title="">Like</a> (<span class="thich">'+ v.Thich +'</span>) </strong><br><strong> <a idUser="'+ v.idUser +'" idRepBL="'+v.id+'" style="color: red" href="javascript:void(0)" title="">Xoá</a> </strong></div><div class="col-md-2"> <br>'+ dateFormat(v.Time,"HH'h'MM'ps' dd-mm-yyyy") +'</div></div>';
	        	}
        	});
        html += '</div><div class="col-md-1"></div><div class="col-md-6">';
        html += '<input class="form-control" style="height:30px" name="reply" placeholder="Trả lời..." ></input></div>';
        html += '<div class="col-md-2"><button id="'+ val.id +'-binhluan" type="button" class="btn btn-success reply" style="height:30px"> Trả lời </button></div></div>';
			});
			res.send(html += "<hr>");
		});
	});
});

router.get('/insert-comments/:idBaiViet/:idHoiDap/:NoiDung', function(req, res, next) {
	date = new Date();
	connection.query("INSERT INTO binhluan VALUES (null,?,?,?,?,0,?) ",
		[req.params.idBaiViet,req.params.idHoiDap,req.session.idUser,req.params.NoiDung,date],function(er,data){
			binhluan ="";
			binhluan += '<div class="row" id="delAll"><div class="row">';
		  binhluan += '<div class="col-md-1"><img style="width : 52px" src="/images/user.png" alt=""></div>';
		  binhluan += '<div class="col-md-6"><strong style="color: #365899">'+ req.session.HoTen +'</strong>';
		  binhluan += '<pre>'+ req.params.NoiDung +'</pre></div><div class="col-md-2"><br>';
		  binhluan += '<strong> <a href="javascript:void(0)" title="">Like</a> </strong><br><strong><a idUser="'+req.session.idUser+'" idBinhLuan="'+data.insertId+'" style="color: red" href="javascript:void(0)" title="">Xoá</a> </strong></div><div class="col-md-1"></div><div class="col-md-2"><br>'+ dateFormat(date,"HH'h'MM'ps' dd-mm-yyyy") +'</div></div><div id="'+ data.insertId +'-binhluan">';
		  binhluan += '</div><div class="col-md-6">';
		  binhluan += '<input class="form-control" style="height:30px" name="reply" placeholder="Trả lời..." ></input></div>';
		  binhluan += '<div class="col-md-2"><butto id="'+ data.insertId +'-binhluan" type="button" class="btn btn-success reply" style="height:30px"> Trả lời </button></div></div><hr>';
			res.send(binhluan);
		});
})

router.get('/reply-comments/:idBinhLuan/:NoiDung',function(req,res){
	noidun = req.params.NoiDung;
	date = new Date();
	connection.query("INSERT INTO traloibinhluan VALUES(null,?,?,?,0,?)",
		[req.params.idBinhLuan,req.session.idUser,noidun,date],function(er,data1){
				reply = "";
				reply += '<div class="row"><div class="col-md-1"></div><div class="col-md-1"><img style="width : 52px" src="/images/user.png" alt=""></div>';
        reply += '<div class="col-md-6"><strong style="color: #365899">'+ req.session.HoTen +'</strong>';
        reply += '<pre>'+ noidun +'</pre></div><div class="col-md-2"><br>';
        reply += '<strong> <a href="javascript:void(0)" title="">Like</a> </strong><br><strong> <a idUser="'+req.session.idUser+'" idRepBL="'+data1.insertId+'" style="color: red" href="javascript:void(0)" title="">Xoá</a> </strong></div><div class="col-md-2"><br>'+ dateFormat(date,"HH'h'MM'ps' dd-mm-yyyy") +'</div></div>';
        res.send(reply);
		});
});

router.get('/remove-comments/:id',function(req,res){
	connection.query("DELETE FROM traloibinhluan WHERE idBinhLuan ="+req.params.id);
	connection.query("DELETE FROM binhluan WHERE id ="+req.params.id);
	res.send("ok");
});

router.get('/remove-rep-comments/:id',function(req,res){
	connection.query("DELETE FROM traloibinhluan WHERE id ="+req.params.id);
	res.send("ok");
});

router.get('/like-comments/:id',function(req,res){
	connection.query("UPDATE binhluan SET Thich = Thich + 1 WHERE id="+req.params.id); 
	res.send("ok");
});

router.get('/like-rep-comments/:id',function(req,res){
	connection.query("UPDATE traloibinhluan SET Thich = Thich + 1 WHERE id="+req.params.id);
	res.send("ok");
});


module.exports = router;