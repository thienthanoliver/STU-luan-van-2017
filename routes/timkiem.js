var express = require('express');
var router = express.Router();
xlsxj = require("xlsx-to-json");
var multer = require('multer');

var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hotro_hoctap'
});

connection.connect()

router.get('/',function(req, res, next){
	ten = req.query.ten ? req.query.ten : '';
	ten = "%"+ten+"%";
	gia = req.query.gia ? req.query.gia : 0;
	theloai = req.query.theloai ? req.query.theloai : 0;
	query = "";
	if(theloai == 2){
		query += " ORDER BY bv.LuotXem DESC "
	}
	if(theloai == 1){
		query += " ORDER BY d.Diem DESC "
	}
	req.session.idUser = req.session.idUser ? req.session.idUser : 0;
	a = connection.query('SELECT bv.*,nv.*,k.*,d.Diem,d.SoNguoiDG FROM baiviet bv LEFT JOIN nhanvien nv ON nv.idNV = bv.idNV LEFT JOIN khoahoc k ON k.idKhoaHoc = bv.idKhoaHoc LEFT JOIN danhgia d ON d.idBaiViet = bv.idBaiViet WHERE (bv.TenBaiViet LIKE ? OR nv.HoTen LIKE ? ) AND bv.Gia >= ? '+query,[ten,ten,gia],function(er,timkiem){
			if(!timkiem[0]){
	          timkiem = 0;
	        } else {
	          timkiem.forEach(function(val,key){
	            val.trangthaimua = 0;
	          })
	        }
	        connection.query("SELECT * FROM mua join chitietmua ct on ct.idMua = mua.idMua WHERE mua.idUser = ?",[req.session.idUser],function(sas,mua){
	          if(!mua[0]){
	            mua = 0;
	          } else if(timkiem[0]) {
	              timkiem.forEach(function(val,key){
	                mua.forEach(function(v,k){
	                  if(v.idBaiViet == val.idBaiViet && v.TrangThai == 1){
	                    val.trangthaimua = 2;
	                  }
	                  if(v.idBaiViet == val.idBaiViet && v.TrangThai == 0){
	                    val.trangthaimua = 1;
	                  }
	                })
	              })
	          }
	          res.render("pages/timKiem",{'login' : req.session.idUser,data : timkiem});
	        });
	});
});

router.get('/danh-gia-bai-viet/:idBaiViet/:diem',function(req, res, next){
	if(!req.session.idUser){
		res.send("ok");
	} else {
		connection.query("SELECT idUser FROM danhgia d JOIN danhgia_chitiet dg ON d.idDanhGia = dg.idDanhGia WHERE d.idBaiViet = ? ",
			[req.params.idBaiViet],function(err,tontai){
			arrIds = [];
			tontai.forEach(function(v,k){
				arrIds.push(v.idUser)
			})
			index = arrIds.indexOf(req.session.idUser);

			if(index >= 0){
				res.send("tontai");
			}
			if(index < 0){
				connection.query("SELECT * FROM danhgia WHERE idBaiViet = ?",[req.params.idBaiViet],function(er,dulieu){
					if(dulieu == ''){
						connection.query("INSERT INTO danhgia VALUES(null,?,?,?)",[req.params.idBaiViet,1,req.params.diem],function(e,v){
							connection.query("INSERT INTO danhgia_chitiet VALUES(null,?,?)",[v.insertId,req.session.idUser]);
						});
						connection.query("SELECT (Diem/SoNguoiDG) as diemso FROM danhgia WHERE idBaiViet=?",[req.params.idBaiViet],function(e,diemso){
							res.send(diemso[0].diemso+'diem');
						});
					} 
					else {
						connection.query("UPDATE danhgia SET SoNguoiDG = SoNguoiDG + 1, Diem = Diem + ? WHERE idBaiViet = ? ",
								[req.params.diem, req.params.idBaiViet]);
						connection.query("SELECT * FROM danhgia WHERE idBaiViet = ?",[req.params.idBaiViet],function(e,v){
							connection.query("INSERT INTO danhgia_chitiet VALUES(null,?,?)",
								[v[0].idDanhGia,req.session.idUser]);
						});
						connection.query("SELECT (Diem/SoNguoiDG) as diemso FROM danhgia WHERE idBaiViet=?",[req.params.idBaiViet],function(e,diemso){
							res.send(diemso[0].diemso+'diem');
						});
					}
				});				
			}
		});
	}
});

module.exports = router;