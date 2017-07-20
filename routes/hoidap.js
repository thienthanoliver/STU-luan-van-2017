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

router.get('/',function(req, res, next){
	connection.query('SELECT * FROM hoidap join user ON user.idUser = hoidap.idUser',function(er,hoidap){
		ten = req.query.ten ? "%"+req.query.ten+"%" : "%%";
		total_record = hoidap.length;
		current_page = req.query.pages ? req.query.pages : 1;
		limit = 10;
		start = (current_page - 1)*limit;
		total_pages = Math.ceil(total_record / limit);
		req.session.idUser = req.session.idUser ? req.session.idUser : 0;
		connection.query("SELECT * FROM hoidap join user ON user.idUser = hoidap.idUser WHERE TieuDe LIKE '"+ten+"' ORDER BY hoidap.idHoiDap DESC LIMIT "+start+","+limit,function(er,data){
			res.render("pages/hoiDap",{'login' : req.session.idUser,hoidap : data, total_pages : total_pages});
		});
	});
});
router.get("/thong-tin/:id",function(req, res, next){
	req.session.idUser = req.session.idUser ? req.session.idUser : 0;
	connection.query("UPDATE hoidap SET LuotXem = LuotXem + 1 WHERE idHoiDap ="+req.params.id)
	connection.query("SELECT * FROM hoidap join user on user.idUser = hoidap.idUser WHERE idHoiDap = ?",[req.params.id],function(er,hoidap){
		res.render("pages/hoiDapThongTin",{'login' : req.session.idUser,hoidap : hoidap[0]});
	});
})
//Đăng đề tài
router.get('/gui-de-tai',function(req, res, next){
	if(!req.session.idUser){
		res.redirect('/dang-nhap');
	}
	connection.query("SELECT * FROM loaikhoahoc",function(er,loai){
		res.render("pages/hoiDapDangDeTai",{'login' : req.session.idUser,loai : loai});
	});
});
router.post('/gui-de-tai',function(req, res, next){
	date = new Date();
	date = dateFormat(date,"yyyy-mm-dd")
	connection.query("INSERT INTO hoidap VALUES(null,?,?,?,?,?,?) ",
		[req.body.loai,req.session.idUser,req.body.chude,req.body.noidung,date,0]);
	req.flash('success_msg','Đăng thành công !');
    res.redirect('/hoi-dap/gui-de-tai');
});

module.exports = router;