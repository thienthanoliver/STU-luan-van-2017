var express = require('express');
var router = express.Router();
xlsxj = require("xlsx-to-json");
var multer = require('multer');
var url = require("url");
var dateFormat = require('dateformat');
// Upload file
var imageName = "";
	var storage = multer.diskStorage({
	  destination: function (req, file, cb) {
	    cb(null, './public/images')
	  },
	  filename: function (req, file, cb) {
	  	imageName = Date.now() + '-' + 'hinh.jpg';
	    cb(null,imageName)
	  }
	})
	var upload = multer({ storage: storage })
	function fileFilter (req, file, cb) {
		if(!file.originalname.match(/\.(png|jpg|jpeg|mp4)$/)){
			cb(new Error('Không phải file hình !'))
		}else{
			cb(null, true)
		}
	}
	var upload = multer({storage: storage, fileFilter : fileFilter});

// Change Alias Name
 function change_alias( alias )
 {
     var str = alias;
     str= str.toLowerCase(); 
     str= str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ  |ặ|ẳ|ẵ/g,"a"); 
     str= str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
     str= str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
     str= str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ  |ợ|ở|ỡ/g,"o"); 
     str= str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
     str= str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
     str= str.replace(/đ/g,"d"); 
     str= str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|$|_/g,"-");
     str= str.replace(/-+-/g,"-");
     str= str.replace(/^\-+|\-+$/g,""); 
     return str;
 }

// Connect My SQL
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hotro_hoctap'
});

connection.connect()

function checkString(string){
  len = string.length;
  for(i=0; i <len ; i++ ){
    if( string[i] =="'" || string[i] == '"' || string[i] == "/" || 
        string[i] == "\\" || string[i] == "*" || string[i] == "-" ||
        string[i] == "+" || string[i] == "="){return false;}}
  return true;
}

router.get('/',function(req, res, next){
	if(req.session.idNV){
		connection.query("SELECT * FROM reason r join nhanvien n on r.idNV = n.idNV",function(er,data){
			res.render('admin/index' ,{hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data, idNV : req.session.idNV});
		});
	} else {
		res.redirect("/admin/dang-nhap");
	}	
})

router.get('/dang-nhap',function(req, res, next){
	res.render('admin/dangNhapAdmin',{msg : ""});
})

router.post('/dang-nhap',function(req, res, next){
  email = req.body.email;password = req.body.password;
  loai = req.body.loai;

  if(checkString(email)){
    if(checkString(password)){
        connection.query("SELECT * FROM nhanvien WHERE email ='"+ email +"' AND MatKhau = SHA1('"+password+"')", 
          function (error, rows, fields) {
            if(rows==""){res.render('admin/dangNhapAdmin',{ msg : 'Tài khoản hoặc mật khẩu không đúng' });
            }else{
            	if(rows[0].TrangThai == 0){
          			res.render('admin/dangNhapAdmin',{ msg : 'Tài khoản này đã bị khóa !'});
          		} else {
          			req.session.idNV = rows[0].idNV;
	            	req.session.idLoaiNV = rows[0].idLoaiNV;
	            	req.session.adHoTen = rows[0].HoTen;
	            	res.redirect("/admin");
          		}
            }
        })}else{res.render('admin/dangNhapAdmin',{ msg : 'Tài khoản hoặc mật khẩu không đúng' });
    }}else{res.render('admin/dangNhapAdmin',{ msg : 'Tài khoản hoặc mật khẩu không đúng' });}
})

//đăng xuất
router.get('/dang-xuat',function(req, res, next){
	req.session.destroy();
	res.redirect("/admin");
});

router.get('/loai-khoa-hoc',function(req, res, next){

	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	connection.query('select * from loaikhoahoc',function(er,val){
		res.render('admin/pages/loaiKhocHoc',{hoten : req.session.adHoTen, data : val , idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	});
})


router.get('/trac-nghiem',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	if(req.session.idLoaiNV == 1){
		query = " where 1=1 ";
	}
	else {
		query = " where t.idNV = "+[req.session.idNV];
 	}
 	if(req.query.ten !== undefined){
 		query += " AND TieuDeTN LIKE '%"+req.query.ten+"%' ";
 		if(req.query.level != ''){ query +=" AND t.idLevel = "+req.query.level; }
 	}
 	req.query.idKhoaHoc = req.query.idKhoaHoc ? req.query.idKhoaHoc : 0;
 	if(req.query.idKhoaHoc != 0){
 		query += " AND idKhoaHoc ="+req.query.idKhoaHoc;
 	}
	query = "SELECT t.* , COUNT(tc.idTNChiTiet) as tongcau FROM tracnghiem t LEFT JOIN tracnghiemchitiet tc on t.idTracNghiem = tc.idTracNghiem "+query+" GROUP BY t.idTracNghiem ";
	connection.query(query,function(error, rows, fields){
		connection.query("SELECT * FROM level",function(e,level){
			connection.query("SELECT * FROM khoahoc",function(er,khoahoc){
				res.render('admin/pages/tracnghiem',{khoahoc : khoahoc,hoten : req.session.adHoTen, data : rows, level : level, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
			});
		});
	});
})
// Trắc nghiệm chi tiết
router.get('/trac-nghiem/chi-tiet/:id',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	idTNChiTiet = [];
	connection.query("SELECT * FROM tracnghiemchitiet WHERE idTracNghiem = ?",[req.params.id],function(error, rows, fields){
		rows.forEach(function(val,key){
			idTNChiTiet.push(val.idTNChiTiet);
		})
		connection.query("select * from tracnghiemtraloi where idTNChiTiet in ("+idTNChiTiet + ")",function(error1, rows1, fields1){
			connection.query("SELECT * FROM level",function(asdas,level){
				res.render('admin/pages/tracNghiemChiTiet',{hoten : req.session.adHoTen, data : rows, data2 : rows1, level : level, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
			})
		})
		
	})
})
// Xoá trắc nghiệm chi tiết
router.get("/delete-trac-nghiem/JFDS54FS76BJ4FSD1F/:id",function(req, res, next){
	connection.query("DELETE FROM tracnghiemtraloi WHERE idTNChiTiet = ?",[req.params.id]);
	connection.query("DELETE FROM tracnghiemchitiet WHERE idTNChiTiet = ?",[req.params.id]);
	res.send('Xoá thành công !');
});
//Update trắc nghiệm chi tiết
router.get('/update-trac-nghiem-chi-tiet/:id/:cauhoi/:traloi/:dapan/:level',function(req, res, next){
	traloi = req.params.traloi.split(',');
	connection.query("UPDATE tracnghiemtraloi set TraLoi= ? WHERE idTNChiTiet= ? and `Key`=1",[traloi[0],req.params.id]);
	connection.query("UPDATE tracnghiemtraloi set TraLoi= ? WHERE idTNChiTiet= ? and `Key`=2",[traloi[1],req.params.id]);
	connection.query("UPDATE tracnghiemtraloi set TraLoi= ? WHERE idTNChiTiet= ? and `Key`=3",[traloi[2],req.params.id]);
	connection.query("UPDATE tracnghiemtraloi set TraLoi= ? WHERE idTNChiTiet= ? and `Key`=4",[traloi[3],req.params.id]);
	connection.query("update tracnghiemchitiet set idLevel = ? , CauHoi = ? , DapAn = ? WHERE idTNChiTiet = ? ",
		[req.params.level, req.params.cauhoi,req.params.dapan, req.params.id]);
	res.send('Lưu thành công !');
});
// Update trắc nghiệm chi tiết 2
router.get('/sua-trac-nghiem-chi-tiet/:id',function(req,res){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	connection.query("SELECT * FROM tracnghiemchitiet ct WHERE ct.idTNChiTiet = ?",[req.params.id],function(er,data){
		connection.query("SELECT * FROM tracnghiemtraloi tn WHERE tn.idTNChiTiet = ?",[data[0].idTNChiTiet],function(er,traloi){
			connection.query("SELECT * FROM level",function(er,level){
				res.render('admin/pages/suaTracNghiemChiTiet',{level : level ,data : data[0], traloi : traloi , hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});	
			});
			
		});
	});
});
router.post('/sua-trac-nghiem-chi-tiet/:id',function(req, res, next){
	console.log(req.body.traloi1+'-'+req.body.traloi2+'-'+req.body.traloi3+'-'+req.body.traloi4+'-'+req.params.id+'-'+req.body.level+'-'+req.body.noidung+'-'+req.body.dapan);
	connection.query("UPDATE tracnghiemtraloi set TraLoi= ? WHERE idTNChiTiet= ? and `Key`=1",[req.body.traloi1,req.params.id]);
	connection.query("UPDATE tracnghiemtraloi set TraLoi= ? WHERE idTNChiTiet= ? and `Key`=2",[req.body.traloi2,req.params.id]);
	connection.query("UPDATE tracnghiemtraloi set TraLoi= ? WHERE idTNChiTiet= ? and `Key`=3",[req.body.traloi3,req.params.id]);
	connection.query("UPDATE tracnghiemtraloi set TraLoi= ? WHERE idTNChiTiet= ? and `Key`=4",[req.body.traloi4,req.params.id]);
	connection.query("update tracnghiemchitiet set idLevel = ? , CauHoi = ? , DapAn = ? WHERE idTNChiTiet = ? ",
		[req.body.level, req.body.noidung,req.body.dapan, req.params.id]);
	req.flash('success_msg','Cập nhật thành công !');
	res.redirect("/admin/sua-trac-nghiem-chi-tiet/"+req.params.id);
});


// thêm trắc nghiệm chi tiết
router.get('/them-trac-nghiem-chi-tiet/:id',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	connection.query("SELECT * FROM level",function(er,level){
		connection.query("SELECT * FROM khoahoc",function(er,khoahoc){
			res.render('admin/pages/themTracNghiemChiTiet',{hoten : req.session.adHoTen, level : level, khoahoc : khoahoc, idTracNghiem : req.params.id, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	});
});
router.post("/them-trac-nghiem-chi-tiet/:id",function(req, res, next){
	connection.query("INSERT INTO tracnghiemchitiet VALUES(null,?,?,?,?)",
		[req.body.idTracNghiem,req.body.level,req.body.cauhoi,req.body.dapan],function(er,val){

		connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                      [val.insertId,req.body.traloi1,1]);
        connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                      [val.insertId,req.body.traloi2,2]);
        connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                      [val.insertId,req.body.traloi3,3]);
        connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                      [val.insertId,req.body.traloi4,4]);
        res.redirect("/admin/trac-nghiem/chi-tiet/"+req.body.idTracNghiem);
	});
});

// Update trắc nghiệm
router.get('/update-trac-nghiem/:id/:tieude/:gia/:thoigian/:level',function(req, res, next){
	connection.query("update tracnghiem set idLevel = ? , TieuDeTN = ? , Gia = ? , ThoiGian = ? WHERE idTracNghiem = ? ",
		[req.params.level, req.params.tieude,req.params.gia, req.params.thoigian, req.params.id]);
	res.send('Lưu thành công !');
});
// Xoá trắc nghiệm
router.get('/delete-trac-nghiem/JFDS54FS4FSD1F/:id',function(req, res, next){
	connection.query("SELECT t.idTNChiTiet FROM tracnghiemchitiet t WHERE idTracNghiem = ?",[req.params.id],function(er,data){
		arrIds = [];
		data.forEach(function(val,key){
			arrIds.push(val.idTNChiTiet);
		})
		connection.query("DELETE FROM tracnghiemtraloi WHERE idTNChiTiet IN ("+arrIds+")");
	});
	connection.query("DELETE FROM tracnghiemchitiet WHERE idTracNghiem = ? ",[req.params.id]);
	connection.query("DELETE FROM bv_kh_tn WHERE idTracNghiem = ? ",[req.params.id]);
	connection.query("DELETE FROM tracnghiem WHERE idTracNghiem = ? ",[req.params.id]);
	res.send('Xoá thành công !');
});

// Update loại khoá học
router.post('/ajax-upload-images/:id',upload.single('hinh'), function(req, res, next) {
	if(imageName == ""){
		connection.query("select Hinh from loaikhoahoc where idLoaiKH = ? ", [req.params.id],function(er,data){
			connection.query('UPDATE loaikhoahoc SET TenLoaiKhoaHoc = ? , Alias = ? WHERE idLoaiKH = ? ',
							[ req.body.ten2,req.body.alias2, req.params.id ]);
			res.send(data[0].Hinh);
			imageName = "";
		} );
	} else {
		connection.query("select Hinh from loaikhoahoc where idLoaiKH = ? ", [req.params.id],function(er,data){
			connection.query('UPDATE loaikhoahoc SET TenLoaiKhoaHoc = ? , Alias = ? , Hinh = "'+imageName+'" WHERE idLoaiKH = ? ',
								[ req.body.ten2,req.body.alias2,req.params.id ]);
			var fs = require('fs');
			var filePath = './public/images/'+data[0].Hinh; 
			//fs.unlinkSync(filePath);// xóa hình
			res.send(imageName);
			imageName = "";
		});
	}
});

//Xoá Loai Khoá Học
router.get('/xoa-loai-khoa-hoc/:id',function(req, res, next){
	connection.query("DELETE FROM loaikhoahoc WHERE idLoaiKH = ?",[req.params.id]);
	res.send("ok");
});

// Thêm loại khoá học
router.get('/them-loai-khoa-hoc',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	res.render('admin/pages/themLoaiKhoaHoc',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
});

router.post('/them-loai-khoa-hoc',upload.single('hinh'),function(req, res, next){
	alias = change_alias(req.body.ten);
	connection.query("insert into loaikhoahoc values(null,?,?,?) ",
				[ req.body.ten, alias, imageName ] );
	res.redirect('/admin/loai-khoa-hoc');
});

// Khoá học
router.get('/khoa-hoc',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV == 1){
		query = " WHERE 1=1 ";
	}
	else {
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
 	}
 	if(req.query.ten !== undefined){
 		query += " AND TenKhoaHoc LIKE '%"+req.query.ten+"%' ";
 		if(req.query.loai != ''){ query +=" AND idLoaiKH = "+req.query.loai; }
 	}
	connection.query("SELECT kh.* FROM khoahoc kh JOIN thongtingiangvien tt on tt.idKhoaHoc = kh.idKhoaHoc "+query +" GROUP BY kh.idKhoaHoc",function(e,data){
		connection.query("SELECT * FROM loaikhoahoc",function(e,loai){
			res.render('admin/pages/khoaHoc',{hoten : req.session.adHoTen, data : data, loai : loai, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	});
});
// Thêm khoá học
router.get('/them-khoa-hoc',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	tenkh = req.query.tenkh ? req.query.tenkh : '';
	id = req.query.id ? req.query.id : ''; 
	connection.query("SELECT * FROM loaikhoahoc",function(e,data){
		res.render('admin/pages/themKhoaHoc',{hoten : req.session.adHoTen, loai : data, idLoaiNV : req.session.idLoaiNV, tenkh : tenkh, id : id, idNV : req.session.idNV});
	});
});
router.post('/them-khoa-hoc',upload.single('hinh'),function(req, res, next){
	alias = change_alias(req.body.ten);
	connection.query("insert into khoahoc values(null,?,?,?,?,?,?) ",
		[ req.body.loai,req.body.ten,alias, imageName ,req.body.gioithieu,req.body.gia],function(er,val,sa){
			connection.query("INSERT INTO thongtingiangvien VALUES(null,?,?) ",[req.session.idNV,val.insertId]);
			if(req.body.iddkkh != ''){
				connection.query("DELETE FROM reason WHERE id="+req.body.iddkkh);
			}
			res.redirect('/admin/khoa-hoc');
	} );
});

router.get('/dang-ki-khoa-hoc',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	res.render('admin/pages/dangKyKhoaHoc',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
});
router.post('/dang-ki-khoa-hoc',function(req, res, next){
	connection.query("INSERT INTO reason VALUES(null,?,'"+req.body.tenkh+"','"+req.body.lido+"')",[req.session.idNV]);
	req.flash('success_msg','Gửi yêu cầu thành công !');
	res.redirect("/admin/dang-ki-khoa-hoc");
});

router.get("/xoa-khoc-hoc-dang-ki/:id",function(req, res, next){
	connection.query('DELETE FROM reason WHERE id ='+req.params.id);
	res.send("ok");
});

// Xoá khoá học
router.get('/xoa-khoa-hoc/:id',function(req, res, next){
	connection.query("DELETE FROM khoahoc WHERE idKhoaHoc = ?",[req.params.id]);
	connection.query("DELETE FROM thongtingiangvien WHERE idKhoaHoc = ? ",[req.params.id]);
	res.send("ok");
});

//Update khoá học
router.post('/ajax-upload-images-khoa-hoc/:id',upload.single('hinh'), function(req, res, next) {
	if(imageName == ""){
		connection.query("select HinhKH from khoahoc where idKhoaHoc = ? ", [req.params.id],function(er,data){
			connection.query('UPDATE khoahoc SET TenKhoaHoc = ? , Aslias_KH = ? ,idLoaiKH = ? , GiaKhoaHoc = ? WHERE idKhoaHoc = ? ',
							[ req.body.ten2,req.body.alias2, req.body.loai2, req.body.gia2, req.params.id ]);
			res.send(data[0].HinhKH);
			imageName = "";
		} );
	} else {
		connection.query("select HinhKH from khoahoc where idKhoaHoc = ? ", [req.params.id],function(er,data){
			connection.query('UPDATE khoahoc SET TenKhoaHoc = ? , Aslias_KH = ? , HinhKH = "'+imageName+'" ,idLoaiKH = ? , GiaKhoaHoc = ? WHERE idKhoaHoc = ? ',
								[ req.body.ten2,req.body.alias2, req.body.loai2, req.body.gia2, req.params.id ]);
			var fs = require('fs');
			var filePath = './public/images/'+data[0].HinhKH; 
			fs.unlinkSync(filePath);
			res.send(imageName);
			imageName = "";
		});
	}
});


// Các bài giảng
router.get("/bai-giang",function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	if(req.session.idLoaiNV == 1){
		query = " WHERE 1=1 ";
	}
	else {
		query = " where idNV = "+[req.session.idNV];
 	}
 	if(req.query.ten !== undefined){
 		query += " AND TenBaiViet LIKE '%"+req.query.ten+"%' ";
 		if(req.query.khoahoc != ''){ query +=" AND idKhoaHoc = "+req.query.khoahoc; }
 	}
 	if(req.query.level!== undefined && req.query.level != 0){
 		query += " AND idLevel = "+req.query.level;
 	}
	connection.query('SELECT * FROM baiviet '+query , function(er,baiviet){
		connection.query('SELECT * FROM khoahoc',function(re,khoahoc){
			res.render('admin/pages/baiGiang',{hoten : req.session.adHoTen, baiviet : baiviet, khoahoc : khoahoc, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	});
})
//xóa bài giảng
router.get('/delete-bai-giang/SD564F5DS4FSD2F/:id',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	connection.query('DELETE FROM baiviet WHERE idBaiViet = ? ',[req.params.id]);
	res.send("ok");
})
//Sửa bài giảng
router.get('/sua-bai-giang/:id',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	connection.query("SELECT * FROM baiviet WHERE idBaiViet = ? ",[req.params.id],function(er,baiviet){
		connection.query('SELECT * FROM khoahoc',function(er,khoahoc){
			connection.query('SELECT * FROM level',function(er,level){
				res.render('admin/pages/suaBaiGiang',{idLoaiNV : req.session.idLoaiNV,hoten : req.session.adHoTen, baiviet : baiviet[0], khoahoc : khoahoc, level : level, idNV : req.session.idNV});
			});
		});
	});
});
router.post('/sua-bai-giang/:id',function(req, res, next){
	alias = change_alias(req.body.ten);
	console.log(324324,req.session.idNV)
	a = connection.query('UPDATE baiviet set TenBaiViet = ?, idKhoaHoc = ? , Alias = ? , NoiDung = ? , LinkVideo = ? , Nguon = ? , idLevel = ? , Gia = ? WHERE idBaiViet= ?',
		[req.body.ten,req.body.khoahoc,alias,req.body.noidung,req.body.video, req.body.nguon,req.body.level,req.body.gia,req.params.id,req.session.idNV] );
	console.log(a)
	req.flash('success_msg','Cập nhật thành công !');
	res.redirect("/admin/sua-bai-giang/"+req.params.id);
});
//Thêm bài giảng
router.get('/them-bai-giang',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	connection.query("SELECT * FROM khoahoc",function(er,khoahoc){
		connection.query("SELECT * FROM level",function(er,level){
			res.render('admin/pages/themBaiGiang',{hoten : req.session.adHoTen, khoahoc : khoahoc, level : level, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	});
});
router.post('/them-bai-giang',function(req, res, next){
	connection.query("SELECT * FROM thongtingiangvien WHERE idNV = ? AND idKhoaHoc = ?",[req.session.idNV, req.body.khoahoc],function(er,val){
		if(!val[0]){
			connection.query("INSERT INTO thongtingiangvien VALUES(null,?,?)",[req.session.idNV, req.body.khoahoc]);
		}
	});
	alias = change_alias(req.body.ten);
	connection.query("INSERT INTO baiviet VALUES(null,?,?,?,?,?,?,?,?,?,?,?,?)",
	[req.body.khoahoc,req.body.ten,alias,req.body.noidung,req.body.video,0,req.body.nguon,0,0,req.body.level,req.session.idNV,req.body.gia],function(er,val){
		req.flash('success_msg','Thêm thành công !');
		res.redirect("/admin/sua-bai-giang/"+val.insertId);
	});
});


// Nhân viên
router.get('/nhan-vien',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	connection.query("SELECT * FROM nhanvien WHERE idLoaiNV = 3 ",function(er,nhanvien){
		res.render('admin/pages/nhanVien',{hoten : req.session.adHoTen, nhanvien : nhanvien, list : "NHÂN VIÊN", idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	});
});


// Giảng Viên
router.get('/giang-vien',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	connection.query("SELECT * FROM nhanvien WHERE idLoaiNV = 2 ",function(er,nhanvien){
		res.render('admin/pages/nhanVien',{hoten : req.session.adHoTen, nhanvien : nhanvien, list : "GIẢNG VIÊN", idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	});
});


//Học Viên
router.get('/hoc-vien',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	connection.query('SELECT * FROM user', function(er,hocvien){
		res.render('admin/pages/nhanVien',{hoten : req.session.adHoTen, nhanvien : hocvien, list : "HỌC VIÊN", idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	});
});



// Cấm quyền truy cập
router.get('/cam-quyen-truy-cap/:loai/:idNV/:idUser/:idLoaiNV',function(req, res, next){
	TrangThai = 1;
	if(req.params.loai == 1) {
		TrangThai = 0;	
	}
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	if(req.params.idNV!=0){
		connection.query('UPDATE nhanvien SET TrangThai = ? WHERE idNV = ?',[TrangThai,req.params.idNV]);
		if(req.params.idLoaiNV == 2){
			res.redirect('/admin/giang-vien');
		}
		res.redirect('/admin/nhan-vien');
	}else{
		connection.query('UPDATE user SET TrangThai = ? WHERE idUser = ?',[TrangThai,req.params.idUser]);
		res.redirect('/admin/hoc-vien');
	}
});

router.get('/thong-ke/khoa-hoc',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	query = "";Loai = "";ten = req.query.ten ? "'%"+req.query.ten+"%'" : "'% %'";
	if(req.query.sapxep == 1){
		query +=" DESC ";
	}
	if(req.query.loai == 1){
		Loai +=" Giá Tiền ";
		console.log("SELECT * FROM khoahoc WHERE k.TenKhoaHoc LIKE "+ten+" ORDER BY GiaKhoaHoc"+query)
		connection.query("SELECT * FROM khoahoc k WHERE k.TenKhoaHoc LIKE "+ten+" ORDER BY GiaKhoaHoc"+query,function(er,data){
			res.render('admin/pages/thongKeKhoaHoc',{hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
		});
	}
	if(req.query.loai == 2){
		Loai +=" Lượt Xem ";
		connection.query("SELECT k.*, IFNULL(SUM(b.LuotXem),0) as GiaKhoaHoc FROM `khoahoc` k LEFT JOIN baiviet b on b.idKhoaHoc = k.idKhoaHoc WHERE k.TenKhoaHoc LIKE "+ten+" GROUP BY k.idKhoaHoc ORDER BY GiaKhoaHoc "+query,function(er,data){
			res.render('admin/pages/thongKeKhoaHoc',{hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
		});
	}
	if(req.query.loai == 3){
		Loai += " Số Lượng Giảng Viên ";
		connection.query("SELECT k.*, COUNT(t.idNV) as GiaKhoaHoc FROM `khoahoc` k LEFT JOIN thongtingiangvien t ON t.idKhoaHoc = k.idKhoaHoc WHERE k.TenKhoaHoc LIKE "+ten+" GROUP BY k.idKhoaHoc ORDER BY GiaKhoaHoc "+query,function(er,data){
			res.render('admin/pages/thongKeKhoaHoc',{hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
		});
	}
	if(req.query.loai == 4){
		Loai += " Số Lượng Bài Giảng ";
		connection.query("SELECT k.*, COUNT(b.idKhoaHoc) as GiaKhoaHoc FROM khoahoc k LEFT JOIN baiviet b ON b.idKhoaHoc = k.idKhoaHoc WHERE k.TenKhoaHoc LIKE "+ten+" GROUP BY k.idKhoaHoc ORDER BY GiaKhoaHoc "+query,function(er,data){
			res.render('admin/pages/thongKeKhoaHoc',{hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
		});
	}
	if(req.query.loai === undefined || req.query.loai == 0){
		Loai +=" Giá Tiền ";
		connection.query("SELECT * FROM khoahoc WHERE TenKhoaHoc LIKE" + ten ,function(er,data){
			res.render('admin/pages/thongKeKhoaHoc',{hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
		});
	}
});


router.get('/thong-ke/bai-giang',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	arrActions = [];
	query = "";query_1="";Loai = "";ten = req.query.ten ? "'%"+req.query.ten+"%'" : "'% %'";
	if(req.query.sapxep == 1){
		query +=" DESC ";
	}
	level = req.query.level ? req.query.level : 0;
	if(level > 0){
		query_1 += " AND b.idLevel ="+level;
	}
	if(req.query.khoahoc > 0){
		query_1 += " AND b.idKhoaHoc ="+req.query.khoahoc;
	}
	arrActions['sapxep'] = req.query.sapxep ? req.query.sapxep : '';
	arrActions['level'] = level;
	arrActions['loai'] = (req.query.loai) ? req.query.loai : '';
	arrActions['khoahoc'] = req.query.khoahoc ? req.query.khoahoc : '';
	connection.query("SELECT * FROM khoahoc",function(er,khoahoc){
		if(req.query.loai == 1 || req.query.loai == 2){
			Loai +=" Giá Tiền ";
			OderBy = " , b.Gia as OderBy "
			if(req.query.loai == 2){
				Loai = " Lượt Xem ";
				OderBy = " , b.LuotXem as OderBy "
			}
			connection.query("SELECT n.*,l.*,b.*"+OderBy+" FROM `baiviet` b LEFT JOIN nhanvien n ON n.idNV = b.idNV LEFT JOIN level l on l.idLevel = b.idLevel WHERE b.TenBaiViet LIKE "+ten+query_1+" ORDER BY OderBy "+query,function(er,data){
				res.render('admin/pages/thongKeBaiGiang',{arrActions : arrActions , khoahoc : khoahoc,hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
			});
		}
		if(req.query.loai == 3){
			Loai = " Số lượng mua ";
			OderBy = ", COUNT(ct.idchitiet) as OderBy ";
			connection.query("SELECT n.*,l.*,b.*"+OderBy+" FROM baiviet b JOIN nhanvien n ON b.idNV = n.idNV JOIN level l ON b.idLevel = l.idLevel LEFT JOIN chitietmua ct ON ct.idBaiViet = b.idBaiViet WHERE b.TenBaiViet LIKE "+ten+query_1+" GROUP BY ct.idBaiViet ORDER BY OderBy "+query, function(er,data){
				res.render('admin/pages/thongKeBaiGiang',{arrActions : arrActions ,khoahoc : khoahoc,hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
			});
		}
		if(req.query.loai == 4){
			Loai +=" Điềm đánh giá / người ";
			OderBy = " , IFNULL(d.Diem,0) as `OderBy`, IFNULL(d.SoNguoiDG,0) as SoNguoiDG ";
			console.log("SELECT n.*,l.*,b.*"+OderBy+" FROM `baiviet` b JOIN nhanvien n ON n.idNV = b.idNV JOIN level l on l.idLevel = b.idLevel LEFT JOIN danhgia d ON d.idBaiViet = b.idBaiViet WHERE b.TenBaiViet LIKE "+ten+query_1+" ORDER BY OderBy "+query);
			connection.query("SELECT n.*,l.*,b.*"+OderBy+" FROM `baiviet` b JOIN nhanvien n ON n.idNV = b.idNV JOIN level l on l.idLevel = b.idLevel LEFT JOIN danhgia d ON d.idBaiViet = b.idBaiViet WHERE b.TenBaiViet LIKE "+ten+query_1+" ORDER BY OderBy "+query,function(er,data){
					res.render('admin/pages/thongKeBaiGiang',{arrActions : arrActions ,khoahoc : khoahoc,hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
			});
		}
		if(req.query.loai == 5){
			Loai +=" Giá Tiền ";
			connection.query("SELECT b.*,n.*,l.*,b.Gia as OderBy FROM `baiviet` b JOIN nhanvien n ON n.idNV = b.idNV JOIN level l on l.idLevel = b.idLevel WHERE b.Gia <= 1 AND b.TenBaiViet LIKE " + ten + query_1 ,function(er,data){
				res.render('admin/pages/thongKeBaiGiang',{arrActions : arrActions ,khoahoc : khoahoc,hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
			});
		}
		if(req.query.loai === undefined || req.query.loai == 0){
			Loai +=" Giá Tiền ";
			connection.query("SELECT b.*,n.*,l.*,b.Gia as OderBy FROM `baiviet` b JOIN nhanvien n ON n.idNV = b.idNV JOIN level l on l.idLevel = b.idLevel WHERE b.TenBaiViet LIKE " + ten + query_1 ,function(er,data){
				res.render('admin/pages/thongKeBaiGiang',{arrActions : arrActions ,khoahoc : khoahoc,hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data,Loai : Loai, idNV : req.session.idNV});
			});
		}
	});
});

router.get('/thong-ke/khoa-hoc-dang-ky',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	}
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	loai = req.query.loai ? req.query.loai : 0;
	if(loai == 0){
		query = " WHERE 1 ";
	}
	if(loai == 1){
		query = " WHERE ct.TrangThai = 0 ";
	}
	if(loai == 2){
		query = " WHERE ct.TrangThai = 1 ";
	}
	tenkhachhang = req.query.tenkhachhang ? "'%"+req.query.tenkhachhang+"%'" : 0;
	if(tenkhachhang!= 0){
		query += " AND m.TenKhachHang LIKE "+tenkhachhang;
	}
	if(req.query.sapxep == 1){
		query += " ORDER BY m.idMua DESC ";	
	}
	connection.query("SELECT ct.idchitiet, b.TenBaiViet, ct.TrangThai, m.TenKhachHang, m.Phone, ct.NgayMua, m.CMND, ct.idMua FROM baiviet b JOIN chitietmua ct on ct.idBaiViet = b.idBaiViet JOIN mua m ON m.idMua = ct.idMua "+query,function(er,data){
		res.render('admin/pages/khoaHocDangKy',{hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data, idNV : req.session.idNV});
	});
});

router.get('/thong-ke/trac-nghiem-dang-ky',function(req, res, next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	loai = req.query.loai ? req.query.loai : 0;
	if(loai == 0){
		query = " WHERE 1 ";
	}
	if(loai == 1){
		query = " WHERE ct.TrangThai = 0 ";
	}
	if(loai == 2){
		query = " WHERE ct.TrangThai = 1 ";
	}
	tenkhachhang = req.query.tenkhachhang ? "'%"+req.query.tenkhachhang+"%'" : 0;
	if(tenkhachhang!= 0){
		query += " AND m.TenKhachHang LIKE "+tenkhachhang;
	}
	if(req.query.sapxep == 1){
		query += " ORDER BY m.idMua DESC ";	
	}
	connection.query("SELECT ct.idchitiet,t.TieuDeTN , n.HoTen, m.TenKhachHang, m.Phone, ct.NgayMua, ct.TrangThai, ct.idMua FROM mua m JOIN chitietmua ct ON m.idMua = ct.idMua JOIN tracnghiem t ON t.idTracNghiem = ct.idTracNghiem JOIN nhanvien n ON n.idNV = t.idNV "+query,function(er,data){
		res.render('admin/pages/tracNghiemDangKy',{hoten : req.session.adHoTen,idLoaiNV : req.session.idLoaiNV, data : data, idNV : req.session.idNV});
	});
});

router.get('/thong-ke/giang-vien',function(req,res){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	ten = req.query.ten ? "'%"+req.query.ten+"%'" : "'% %'"; query = "";
	if(req.query.sapxep == 1){
		query +=" DESC ";
	}
	if(req.query.loai == 1 || req.query.loai == 2){
		Loai = "Tổng bài giảng";
		query_1 = ", COUNT(b.idBaiViet)";
		if(req.query.loai == 2){
			Loai = "Tổng lượt xem";
			query_1 = ", SUM(b.LuotXem)";
		}
		connection.query("SELECT n.HoTen, n.Email, n.Phone"+query_1+" as LOL FROM nhanvien n LEFT JOIN baiviet b ON b.idNV = n.idNV WHERE n.idLoaiNV = 2 AND n.HoTen LIKE "+ten+" GROUP BY b.idNV ORDER BY LOL "+query , function(er,data){
			res.render('admin/pages/thongKeGiangVien',{data : data , Loai : Loai,hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	}
	if(req.query.loai == 3){
		Loai = "Tổng lượt mua ";

		connection.query("SELECT n.HoTen, n.Email, n.Phone, COUNT(ct.idBaiViet) as LOL FROM nhanvien n LEFT JOIN baiviet b ON b.idNV = n.idNV LEFT JOIN chitietmua ct ON ct.idBaiViet = b.idBaiViet WHERE n.idLoaiNV = 2 AND n.HoTen LIKE "+ten+" GROUP BY b.idNV ORDER BY LOL "+query,function(e,data){
			res.render('admin/pages/thongKeGiangVien',{data : data , Loai : Loai,hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	}
	if(req.query.loai == 4){
		Loai = "Tổng điểm/ Tổng người";
		connection.query("SELECT n.HoTen, n.Email, n.Phone, SUM(d.Diem) as LOL,SUM(d.SoNguoiDG) as SoNguoiDG FROM nhanvien n LEFT JOIN baiviet b ON b.idNV = n.idNV LEFT JOIN danhgia d ON d.idBaiViet = b.idBaiViet WHERE n.idLoaiNV = 2 AND n.HoTen LIKE "+ten+" GROUP BY b.idNV ORDER BY LOL "+query,function(e,data){
			res.render('admin/pages/thongKeGiangVien',{data : data , Loai : Loai,hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	}
	if(req.query.loai === undefined || req.query.loai == 0){
		connection.query("SELECT n.*,n.SoTien as LOL FROM nhanvien n WHERE n.HoTen LIKE"+ten+" AND idLoaiNV = 2 ORDER BY LOL "+query,function(er,data){
			Loai = "";
			res.render('admin/pages/thongKeGiangVien',{data : data , Loai : Loai,hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	}
});

router.get('/thong-ke/hoc-vien',function(req,res){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	ten = req.query.ten ? "'%"+req.query.ten+"%'" : "'%%'"; query = "";
	if(req.query.sapxep == 1){
		query += " DESC ";	
	}
	if(req.query.loai == 1 || req.query.loai == 2){
		Loai = "Tổng bài giảng đã mua";
		subQuery_1 = ", COUNT(ct.idBaiViet) as LOL";
		subQuery_2 = "WHERE ct.idBaiViet <> 0 AND ct.TrangThai = 1 ";
		if(req.query.loai == 2){
			Loai = "Tổng bài trắc nghiệm đã mua";
			subQuery_1 = ", COUNT(ct.idTracNghiem) as LOL";
			subQuery_2 = "WHERE ct.idTracNghiem <> 0 AND ct.TrangThai = 1 ";
		}
		connection.query("SELECT u.HoTen, u.Email, u.Phone"+subQuery_1+" FROM user u LEFT JOIN mua m ON m.idUser = u.idUser LEFT JOIN chitietmua ct ON ct.idMua = m.idMua "+subQuery_2+" AND u.HoTen LIKE "+ten+" GROUP BY u.idUser ORDER BY LOL "+query, function(er,data){
			res.render('admin/pages/thongKeHocVien',{data : data , Loai : Loai,hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	}
	if(req.query.loai == 3 || req.query.loai == 4){
		Loai = " Danh sách bài giảng đã mua";
		subQuery = " b.idBaiViet, b.TenBaiViet as TenLOL,m.idUser FROM chitietmua ct JOIN baiviet b ON ct.idBaiViet = b.idBaiViet";
		if(req.query.loai == 4){
			Loai = " Danh sách bài trắc nghiệm đã mua";
			subQuery = " t.idTracNghiem, t.TieuDeTN as TenLOL,m.idUser FROM chitietmua ct JOIN tracnghiem t ON ct.idTracNghiem = t.idTracNghiem";
		}
		connection.query("SELECT u.* FROM user u WHERE HoTen LIKE "+ten,function(er,data){
			connection.query("SELECT "+subQuery+" JOIN mua m ON m.idMua = ct.idMua WHERE ct.TrangThai = 1",function(er,list){
				res.render('admin/pages/thongKeHocVien',{data : data , list : list ,Loai : Loai,hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
			});
		});
	}
	if(req.query.loai === undefined || req.query.loai == 0){
		connection.query("SELECT u.*, u.DiaChi as LOL FROM user u WHERE HoTen LIKE "+ten+" ORDER BY LOL "+query,function(er,data){
			Loai = "Địa Chỉ ";
			res.render('admin/pages/thongKeHocVien',{data : data , Loai : Loai,hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
		});
	}
});

// Comments
router.get('/comments',function(req,res){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}

	sapxep = req.query.sapxep ? req.query.sapxep : 1;
	sapxep = sapxep == 1 ? '' : " ORDER BY bl.id ASC ";

	loai = req.query.loai ? req.query.loai : 1;
	ten = req.query.ten ? "'%"+req.query.ten+"%'" : "'%%'";
	Time = req.query.Time ? "'%"+dateFormat(req.query.Time,'yyyy-dd-mm')+"%'" : "'%%'";

	select = "  bl.id, u.HoTen , bl.NoiDung , bl.Time, bv.TenBaiViet as nameTable ";
	join = "  baiviet bv ON bv.idBaiViet = bl.idBaiViet  ";
	where = " WHERE bv.TenBaiViet LIKE "+ten+" AND bl.Time LIKE "+Time+sapxep;
	if(loai == 2){
		select = " bl.id, hd.TieuDe as nameTable, u.HoTen , bl.NoiDung , bl.Time ";
		join = " hoidap hd ON hd.idHoiDap = bl.idHoiDap ";
		where = " WHERE hd.TieuDe LIKE "+ten+" AND bl.Time LIKE "+Time+sapxep;
	}

	connection.query(' SELECT'+select+'FROM binhluan bl JOIN'+join+'JOIN `user` u ON u.idUser = bl.idUser'+where,function(er,data){
		nameTable = loai = 1 ? ' Bài Giảng ' : ' Hỏi Đáp ';
		connection.query(' SELECT tb.id, tb.idBinhLuan, u.HoTen, tb.NoiDung, tb.Time FROM traloibinhluan tb JOIN `user` u ON u.idUser = tb.idUser ORDER BY tb.id ASC ',function(er,reply){
			data.forEach(function(val,key){
				val.Time = dateFormat(val.Time, "h:MM:ss dd-mm-yyyy");
			})
			reply.forEach(function(val,key){
				val.Time = dateFormat(val.Time, "h:MM:ss dd-mm-yyyy");
			})
			res.render('admin/pages/comments',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, nameTable : nameTable, data : data, reply: reply, idNV : req.session.idNV});
		});
	})
});

router.get('/them-nhan-vien',function(req,res,next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	error = {};data = {}
	connection.query("SELECT * FROM loainhanvien WHERE idLoaiNV <> 1",function(er,loai){
		res.render('admin/pages/themNhanVien',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, loai : loai, error: error, data: data, idNV : req.session.idNV});
	});
});

router.post('/them-nhan-vien',upload.single('hinh'),function(req,res,next){
	email = req.body.email;
	ten = req.body.ten;
	loai = req.body.loai;
	ngaysinh = req.body.ngaysinh;
	gioitinh = req.body.gioitinh;
	gioithieu = req.body.gioithieu;
	password = req.body.password;
	repassword = req.body.repassword;
	phone = req.body.phone;
	diachi = req.body.diachi;
	error = {};
	data ={
		email: email,
		ten: ten,
		ngaysinh: ngaysinh,
		gioithieu: gioithieu,
		phone: phone,
		diachi: diachi
	}
	check = true;
	if(email == ''){
		check = false;
		error.email = "Email không được bỏ trống !";
	}
	if(ten == ''){
		check = false;
		error.ten = "Tên không được bỏ trống !";
	}
	if(ngaysinh == ''){
		check = false;
		error.ngaysinh = "Ngày sinh không hợp lệ !";
	}
	if(gioithieu == ''){
		check = false;
		error.gioithieu = "Giới thiệu không được bỏ trống !";
	}
	if(password == ''){
		check = false;
		error.password = "Mật Khẩu không được bỏ trống !";
	}
	if(password != repassword){
		check = false;
		error.repassword = "Mật khẩu nhập lại không đúng !";
	}
	if(phone == ''){
		check = false;
		error.phone = "Số điện thoại không được bỏ trống !";
	}
	if(diachi == ''){
		check = false;
		error.diachi = "Địa chỉ không được bỏ trống !";
	}
	if (check) {
		ngaysinh =ngaysinh.slice(0, 10).split('-');
		ngaysinh = ngaysinh[2]+'-'+ngaysinh[1]+'-'+ngaysinh[0];
	
		connection.query('INSERT INTO nhanvien VALUES (null,?,?,?,?,SHA1(?),?,?,?,?,?,?,?,?,?) ',[
			loai,ten,change_alias(ten),email,password,ngaysinh,phone,diachi,gioitinh,imageName,gioithieu,1,0,1
		]);
		req.flash('success_msg','Thêm thành công !');
		res.redirect("/admin/them-nhan-vien");
	}else{
		connection.query("SELECT * FROM loainhanvien WHERE idLoaiNV <> 1",function(er,loai){
			res.render('admin/pages/themNhanVien',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, loai : loai, error: error, data: data, idNV : req.session.idNV});
		});
	}

})

router.get('/update-nhan-vien/:id',function(req,res,next){
	if(!req.session.adHoTen){
		res.redirect("/admin/dang-nhap");
	} 
	if(req.session.idLoaiNV != 1 && req.session.idLoaiNV != 3){
		res.render('admin/block/accessDeny',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, idNV : req.session.idNV});
	}
	error = {};
	connection.query("SELECT * FROM loainhanvien WHERE idLoaiNV <> 1",function(er,loai){
		connection.query("SELECT * FROM nhanvien WHERE idNV = ?",[req.params.id],function(err,data){
			data[0].NgaySinh = dateFormat(data[0].NgaySinh, 'dd-mm-yyyy');

			res.render('admin/pages/updateNhanVien',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, loai : loai, error: error, data: data[0], idNV : req.session.idNV});
		});
	});
});

router.post('/update-nhan-vien/:id',upload.single('hinh'),function(req,res,next){
	idNV = req.params.id;
	ten = req.body.ten;
	loai = req.body.loai;
	ngaysinh = req.body.ngaysinh;
	gioitinh = req.body.gioitinh;
	gioithieu = req.body.gioithieu;
	phone = req.body.phone;
	diachi = req.body.diachi;
	error = {};
	data ={
		ten: ten,
		ngaysinh: ngaysinh,
		gioithieu: gioithieu,
		phone: phone,
		diachi: diachi
	}
	check = true;
	if(ten == ''){
		check = false;
		error.ten = "Tên không được bỏ trống !";
	}
	if(ngaysinh == ''){
		check = false;
		error.ngaysinh = "Ngày sinh không hợp lệ !";
	}
	if(gioithieu == ''){
		check = false;
		error.gioithieu = "Giới thiệu không được bỏ trống !";
	}
	if(phone == ''){
		check = false;
		error.phone = "Số điện thoại không được bỏ trống !";
	}
	if(diachi == ''){
		check = false;
		error.diachi = "Địa chỉ không được bỏ trống !";
	}
	if (check) {
		ngaysinh =ngaysinh.slice(0, 10).split('-');
		ngaysinh = ngaysinh[2]+'-'+ngaysinh[1]+'-'+ngaysinh[0];
		hinh='';
		if(imageName != ''){
			hinh = " , HinhNV = '"+imageName+"'";
		}
		connection.query('UPDATE nhanvien SET idLoaiNV = ?, HoTen = ?, Aslias_NV = ?, NgaySinh = ?, Phone = ?, DiaChi = ?, GioiTinh = ?, GioiThieu = ? '+hinh+' WHERE idNV = ? ',[
			loai, ten, change_alias(ten), ngaysinh, phone, diachi, gioitinh,gioithieu,idNV
		]);
		req.flash('success_msg','Cập nhật thành công !');
		res.redirect("/admin/update-nhan-vien/"+idNV);
	}else{
		connection.query("SELECT * FROM loainhanvien WHERE idLoaiNV <> 1",function(er,loai){
			res.render('admin/pages/updateNhanVien',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV, loai : loai, error: error, data: data, idNV : req.session.idNV});
		});
	}

});

router.get('/tai-khoan/:id',function(req,res,next){
	if(!req.session.idNV){
		res.redirect("/admin/dang-nhap");
	} 
	connection.query('SELECT * FROM nhanvien WHERE idNV = ?',[req.session.idNV],function(er,data){
		data[0].NgaySinh = dateFormat(data[0].NgaySinh, 'dd-mm-yyyy');
		res.render('admin/pages/taiKhoan',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV,data: data[0], idNV : req.session.idNV});
	})
})

router.post('/tai-khoan/:id',upload.single('hinh'),function(req,res,next){
	ten = req.body.ten;
	ngaysinh = req.body.ngaysinh;
	phone = req.body.phone;
	gioitinh = req.body.gioitinh;
	gioithieu = req.body.gioithieu;
	diachi = req.body.diachi;
	ngaysinh =ngaysinh.slice(0, 10).split('-');
	ngaysinh = ngaysinh[2]+'-'+ngaysinh[1]+'-'+ngaysinh[0];

	query = '';
	if(imageName != ''){
		query += " , HinhNV = '"+imageName+"'";
	}
	connection.query('UPDATE nhanvien SET HoTen = ?, Aslias_NV = ?, NgaySinh = ?, Phone = ?, DiaChi = ?, GioiTinh = ?, GioiThieu = ? '+query+' WHERE idNV = ? ',[
		ten, change_alias(ten), ngaysinh, phone, diachi, gioitinh,gioithieu,req.session.idNV
	]);
	req.flash('success_msg','Cập nhật thành công !');
	res.redirect("/admin/tai-khoan/12345678765432");
});

router.get('/ajax-update-comments/:id/:noidung/:loai',function(req,res){
	date = new Date();
	loai = req.params.loai;
	if(loai == 2){
		connection.query('UPDATE traloibinhluan SET NoiDung = ? WHERE id = ?',[req.params.noidung, req.params.id]);
		res.send("ok");
	} else {
		connection.query('UPDATE binhluan SET NoiDung = ? WHERE id = ?',[req.params.noidung, req.params.id]);
		res.send("ok");
	}
})

router.get('/doi-mat-khau',function(req,res,next){
	if(!req.session.idNV){
		res.redirect("/admin/dang-nhap");
	} 
	error = {};
	connection.query('SELECT * FROM nhanvien WHERE idNV = ?',[req.session.idNV],function(er,data){
		res.render('admin/pages/doiMatKhau',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV,data: data[0], idNV : req.session.idNV, error : error});
	})
})

router.post('/doi-mat-khau',function(req,res,next){
	if(!req.session.idNV){
		res.redirect("/admin/dang-nhap");
	} 
	check = true;
	error = {};
	connection.query('SELECT * FROM nhanvien WHERE idNV = ? AND MatKhau = SHA1(?)',[req.session.idNV, req.body.pass_cu],function(er,data){
		if(typeof data[0] == 'undefined'){
			check = false;
			error.er1 = "Mật khẩu cũ không đúng !";
		}
		if( req.body.password != req.body.repassword ){
			check = false;
			error.er2 = "Mật khẩu nhập lại không đúng !";	
		}

		if(check == true){
			connection.query("UPDATE nhanVien SET MatKhau = SHA1(?) WHERE idNV = ?", [req.body.password, req.session.idNV]);
			req.flash('success_msg','Cập nhật thành công !');
			res.redirect("/admin/tai-khoan/12345678765432");
		} else {
			connection.query('SELECT * FROM nhanvien WHERE idNV = ?',[req.session.idNV],function(er,data){
				res.render('admin/pages/doiMatKhau',{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV,data: data[0], idNV : req.session.idNV, error : error});
			})
		}
		
	})
})

router.get('/AJAX-sadjshagdsakjgdsadgasdgsakdhsadask/:id',function(req,res){
	connection.query("UPDATE chitietmua SET TrangThai = 1 WHERE idMua = ?",
		[req.params.id]);
	res.send("ok");
});

router.get('/thong-tin-hoc-vien/:id',function(req,res){
	if(!req.session.idNV){
		res.redirect("/admin/dang-nhap");
	} else {
		arrayInfo = [];

    connection.query("SELECT * FROM user WHERE idUser = "+req.params.id,function(er,data){
    	data[0].NgaySinh = dateFormat(data[0].NgaySinh,'dd-mm-yyyy');
      connection.query("SELECT * FROM mua JOIN chitietmua ct ON ct.idMua = mua.idMua join baiviet b on b.idBaiViet = ct.idBaiViet WHERE idUser ="+data[0].idUser,function(e,v){
        v = v[0] ? v : 0 ;
	        connection.query("SELECT t.*,d.*,ct.*,m.*, SHA1(t.idTracNghiem) as idSHA1 FROM diemtracnghiem d join tracnghiem t on t.idTracNghiem = d.idTracNghiem join chitietmua ct on ct.idTracNghiem = d.idTracNghiem join mua m on m.idMua = ct.idMua WHERE d.idUser = ? AND m.idUser = ? GROUP BY idDiemTN",
	          [req.params.id,req.params.id],function(er,tracnghiem){
	            tracnghiem = tracnghiem[0] ? tracnghiem : 0;

	            if(tracnghiem != 0){
	              connection.query("SELECT * FROM diemtracnghiem d JOIN tracnghiem t on t.idTracNghiem = d.idTracNghiem JOIN baiviet b on b.idBaiViet = t.idBaiViet WHERE idUser = ? AND diemTN <> 0", [req.params.id],function(er,results){
	                results.forEach(function(val,key){
	                  arrayInfo.push({
	                    idBaiViet : val.idBaiViet,
	                    idTracNghiem : val.idTracNghiem,
	                    DiemTN : val.DiemTN,
	                    NgayThiTN : val.NgayThiTN,
	                    TenBaiViet : val.TenBaiViet
	                  });
	                });    
	                arrayInfo.forEach(function(val,key){
	                  diem = val.DiemTN.split("/");
	                  diem = (diem[0]/diem[1])*100;
	                  arrayInfo[key].DiemTN = diem;
	                })

	                arrayInfo.forEach(function(val,key){
	                  if(typeof arrayInfo[(key+1)] != 'undefined' ){
	                    if(arrayInfo[key].idBaiViet == arrayInfo[(key+1)].idBaiViet){
	                      arrayInfo[key].DiemTN = (arrayInfo[key].DiemTN + arrayInfo[(key+1)].DiemTN)/2;
	                      arrayInfo.splice((key+1), 1);
	                    }
	                  }
	                })
	                

	                res.render("admin/pages/taiKhoanHocVien",{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV,idNV : req.session.idNV,data : data[0], mua : v, tracnghiem : tracnghiem, arrayInfo : arrayInfo}); 
	              });
	            } else {
	              res.render("admin/pages/taiKhoanHocVien",{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV,idNV : req.session.idNV,data : data[0], mua : v, tracnghiem : tracnghiem, arrayInfo : 0});
	            }
	          });
	      });
	    });
	}
});

router.get('/thong-tin-giang-vien/:id',function(req,res){
	if(!req.session.idNV){
		res.redirect("/admin/dang-nhap");
	} else {
		connection.query("SELECT * FROM nhanvien nv WHERE nv.idNV = ? ",[req.params.id],function(er,giangvien){
			giangvien[0].NgaySinh = dateFormat(giangvien[0].NgaySinh,'dd-mm-yyyy');
			connection.query("SELECT bv.idBaiViet,bv.idBaiViet,bv.TenBaiViet, kh.TenKhoaHoc ,bv.LuotXem, IFNULL(dg.Diem,0) as Diem FROM baiviet bv JOIN khoahoc kh ON kh.idKhoaHoc = bv.idKhoaHoc LEFT JOIN danhgia dg ON dg.idBaiViet = bv.idBaiViet WHERE bv.idNV = ?",[req.params.id], function(er,baiviet){	
				connection.query("SELECT * FROM tracnghiem WHERE idNV = ?",[req.params.id], function(er, tracnghiem){
					res.render("admin/pages/taiKhoanGiangVien",{hoten : req.session.adHoTen, idLoaiNV : req.session.idLoaiNV,idNV : req.session.idNV,tracnghiem: tracnghiem, giangvien : giangvien[0],baiviet: baiviet});
				});							
			});
		});
	}
});
module.exports = router;