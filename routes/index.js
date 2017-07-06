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

connection.connect()

function checkString(string){
  len = string.length;
  for(i=0; i <len ; i++ ){
    if( string[i] =="'" || string[i] == '"' || string[i] == "/" || 
        string[i] == "\\" || string[i] == "*" || string[i] == "-" ||
        string[i] == "+" || string[i] == "="){return false;}}
  return true;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.session.idUser) {
    req.session.idUser = 0;
  }
  var a = new Promise(function(resolve, reject) {
          connection.query('SELECT * FROM loaikhoahoc',function (error, results, fields) { 
                resolve(results);
              });
        });
  a.then(function(loaiKH) {
  connection.query(
    'SELECT *, l.TenLoaiKhoaHoc FROM khoahoc as k join loaikhoahoc as l on k.idLoaiKH = l.idLoaiKH',function (error, results, fields) {
              res.render('index',{
                          'login' : req.session.idUser,
                          'loaiKH' : loaiKH,
                          'khoahoc' : results
                        });  
    });  
  });
});

router.get('/dang-nhap', function(req, res, next) {
  if(req.session.idUser){
      res.redirect("/");
  }
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  res.render('pages/dangNhap',{'login' : req.session.idUser, msg : ""});
});


router.post('/dang-nhap', function(req, res, next) {
  email = req.body.email;password = req.body.password;
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  if(checkString(email)){
    if(checkString(password)){
        connection.query("SELECT * FROM user WHERE email ='"+ email +"' AND MatKhau = SHA1('"+password+"') AND TrangThai = 1", 
          function (error, rows, fields) {
            if(rows==""){res.render('pages/dangNhap',{ 'login' : req.session.idUser,msg : 'Tài khoản hoặc mật khẩu không đúng' });
            }else{req.session.HoTen = rows[0].HoTen;req.session.idUser = rows[0].idUser;res.redirect("/");}
        })}else{res.render('pages/dangNhap',{'login' : req.session.idUser, msg : 'Tài khoản hoặc mật khẩu không đúng' });
    }}else{res.render('pages/dangNhap',{'login' : req.session.idUser, msg : 'Tài khoản hoặc mật khẩu không đúng' });}
});


router.get('/dang-xuat', function(req, res, next) {
      delete req.session.idUser;
      res.redirect("/dang-nhap");
});

router.get('/dang-ky', function(req, res, next) {
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  res.render('pages/dangKy',{msg : "",'login' : req.session.idUser});
});
router.post('/dang-ky', function(req, res, next) {
     Phone = req.body.Phone;
     HoTen = req.body.HoTen;
     Email = req.body.Email;
     Password = req.body.Password;
     date = new Date();
     date = dateFormat(date,"yyyy-mm-dd")
     connection.query('INSERT INTO user VALUES(null,?,?,SHA1(?),?,"","",1,?,0)', 
      [Email,HoTen ,Password ,Phone, date ],
      function (error, results, fields) {
        if(error) res.render('pages/dangKy',{'login' : 0,msg : "Email này đã tồn tại"});
        else {
          var transporter =  nodemailer.createTransport({ // config mail server
              service: 'Gmail',
              auth: {
                  user: 'thienthanoliver4@gmail.com',
                  pass: 'nguyenquocbao'
              }
          });
          var mainOptions = { // thiết lập đối tượng, nội dung gửi mail
              from: 'Admin Master',
              to: Email,
              subject: 'Xác nhận đăng ký',
              html: 'Xin chào bạn : <h1> '+ HoTen +' </h1> vui lòng truy cập link sau để cập nhật <br>'+
                    '<a href="http://localhost:3000/AS344SDFS2343ddfsfSDssFFE33e/'+results.insertId+'">http://localhost:3000/AS344SDFS2343ddfsfSDssFFE33e/'+results.insertId+'</a>'
          }
          transporter.sendMail(mainOptions, function(err, info){
              if (err) {
                  console.log(err);
              } else {
                  console.log(info)
              }
          });
          res.render('pages/dangNhap',{'login' : 0,msg : "Đăng ký thành công ! Vui lòng truy cập email để xác nhận quyền truy cập !"});
        }
     });
});

router.get('/AS344SDFS2343ddfsfSDssFFE33e/:id',function(req,res){
  connection.query("UPDATE user SET TrangThai = 1 WHERE idUser = ?",[req.params.id]);
  res.redirect('/dang-nhap');
});

router.get('/trac-nghiem', function(req, res, next) {
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  connection.query('SELECT * FROM khoahoc LEFT JOIN bv_kh_tn on bv_kh_tn.idKhocHoc = khoahoc.idKhoaHoc GROUP BY khoahoc.idKhoaHoc',function(error, results, fields){
      res.render('pages/tracNghiem',{msg : "", data : results,'login' : req.session.idUser});
  });
});
router.get('/danh-sach-trac-nghiem/:aslias/:id',function(req, res, next){
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
    connection.query('select t.*, SHA1(t.idTracNghiem) as maTN  from tracnghiem as t where t.idKhoaHoc = ?',[req.params.id],function(error, results, fields){
      results.forEach(function(v,k){
        v.DiemTN = 0;
        v.TrangThaiMua = 0;
      })
      connection.query("SELECT * FROM mua m join chitietmua ct on ct.idMua = m.idMua join diemtracnghiem dt on dt.idTracNghiem = ct.idTracNghiem WHERE m.idUser = ?",[req.session.idUser],function(er,mua){
        if(mua[0]){
          results.forEach(function(val,key){
            mua.forEach(function(v,k){
              if(v.idTracNghiem == val.idTracNghiem && v.TrangThai == 1){
                val.DiemTN = v.DiemTN;
                val.TrangThaiMua = 2;
              } else if(v.idTracNghiem == val.idTracNghiem && v.TrangThai == 0){
                val.TrangThaiMua = 1;
              }
            });
          })
        }
        console.log(results)
        res.render('pages/pageTracNghiemList',{msg : "", data : results,'login' : req.session.idUser});
      });
    });
});
router.get('/thi-trac-nghiem/:id',function(req, res, next){
    if(!req.session.idUser){
      res.redirect('/dang-nhap');
    }
    req.session.idUser = req.session.idUser ? req.session.idUser : 0;
    id = req.params.id;
    connection.query("SELECT t.*, SHA1(t.idTracNghiem) as maTN FROM tracnghiem as t", function(error, results, fields){
        results.forEach(function(val,key){
          if(val.maTN == id){
            thoigian = val.ThoiGian * 60;
            connection.query('select * from tracnghiemchitiet where idTracNghiem = ? ORDER BY RAND() ',[val.idTracNghiem],function(error, values, fields){
              connection.query('select * from tracnghiemtraloi ORDER BY RAND() ',function(er,traloi){
                res.render('pages/pageThiTracNghiem',{'login' : req.session.idUser,msg : "", data : values , thoigian : thoigian, traloi : traloi});
              })
            });
          }
        })
    });
});

router.post('/ket-qua-thi-trac-nghiem/:id',function(req, res, next){
    date = new Date();
    date = dateFormat(date,"yyyy-mm-dd")
    arr = req.body['arr'] ? req.body['arr'] : [];
    diem = 0;
    tongcau = 0;

    connection.query('select * from tracnghiemchitiet where idTracNghiem = ?',[req.params.id],function(error, results, fields){
      results.forEach(function(val,key){
        tongcau++;
        arr.forEach(function(v,k){
          if(val.idTNChiTiet == v.id && val.DapAn == v.DapAn){
            diem++;
          }
        })
      })
      req.session.diemTN = diem+"/"+tongcau;
      connection.query("SELECT (CASE WHEN DiemTN > '"+diem+"/"+tongcau+"' THEN 1 ELSE 0 END) AS Diem FROM `diemtracnghiem` WHERE idTracNghiem = ?",
        [req.params.id],function(er,sosanh){
          if(sosanh[0].Diem == 1){
            res.send("ok");
          } else {
            connection.query("UPDATE diemtracnghiem SET DiemTN = ? , NgayThiTN = ? WHERE idTracNghiem = ? AND idUser = ?",
              [diem+'/'+tongcau,date,req.params.id,req.session.idUser],function(sad,asdsd){
                res.send("ok");
            });
          }
        });
    });
});
router.get("/ket-qua-thi/:id",function(req, res, next){
  if(!req.session.idUser){
    res.redirect('/dang-nhap');
  }
  connection.query("SELECT * FROM tracnghiem n join diemtracnghiem d on n.idTracNghiem = d.idTracNghiem WHERE d.idTracNghiem = ? AND d.idUser = ? ",
    [req.params.id,req.session.idUser],function(er,data){
      req.session.idUser = req.session.idUser ? req.session.idUser : 0;
      res.render("pages/ketQuaThi",{'login' : req.session.idUser,data : data, diemTN: req.session.diemTN});
    });
});

router.post('/dang-nhap/giang-vien', function(req, res, next) {
  email = req.body.email;password = req.body.password;
  if(checkString(email)){
    if(checkString(password)){
        connection.query("SELECT * FROM giangvien WHERE email ='"+ email +"' AND MatKhau = SHA1('"+password+"') AND Active = 1", 
          function (error, rows, fields) {
            if(rows==""){res.render('pages/dangNhapGiangVien',{ msg : 'Tài khoản hoặc mật khẩu không đúng' });
            }else{req.session.idGV = rows[0].idGiangVien;res.redirect("/");}
        })}else{res.render('pages/dangNhapGiangVien',{ msg : 'Tài khoản hoặc mật khẩu không đúng' });
    }}else{res.render('pages/dangNhapGiangVien',{ msg : 'Tài khoản hoặc mật khẩu không đúng' });}
});
router.get('/trac-nghiem/dang-bai-trac-nghiem', function(req, res, next) {
    if(!req.session.adHoTen ){
        res.redirect('/admin/dang-nhap');
    }
    connection.query("SELECT * from khoahoc", function (error, results, fields) {
      req.session.idUser = req.session.idUser ? req.session.idUser : 0;
      res.render('pages/dangBaiTracNghiem',{'login' : req.session.idUser,msg : "", data : results});
    })
});
router.post('/trac-nghiem/dang-bai-trac-nghiem/:id/:kh/:bv/:gia/:thoigian/:tieude/:level', function(req, res, next) {
  insertID2 = [];
  var p = new Promise(function(resolve, reject) {
      connection.query('INSERT INTO tracnghiem VALUES(null,?,?,?,?,?,?,?)', 
        [req.session.idNV,req.params.kh,req.params.bv,req.params.level,req.params.tieude,req.params.gia,req.params.thoigian],
        function (error, results, fields) { 
            resolve(results.insertId);
        });
  })
      p.then(function(insertID1) {
         connection.query("insert into bv_kh_tn values(null,?,?,?)",[req.params.kh,req.params.bv,insertID1])
          ArrQuestion = (req.body);
          ArrQuestion = ArrQuestion["ArrQuestion"];
          for ( i = 0 ; i < req.params.id ; i++){
            var b = new Promise(function(resolve1, reject1) {
              console.log(12121,i)
              connection.query("insert into tracnghiemchitiet values(null,?,1,?,?)",
                              [insertID1,
                              ArrQuestion[i]['cauhoi'],
                              ArrQuestion[i]['dapan']],
              function (error, results1, fields){ 
                resolve1(results1.insertId);
                insertID2.push({insertID2 : results1.insertId}); 
              })
            });
          }
            b.then(function(idassasa) {
              for ( j = 0 ; j < req.params.id ; j++){
                connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                              [insertID2[j]['insertID2'],ArrQuestion[j]['t1'],1]);
                connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                              [insertID2[j]['insertID2'],ArrQuestion[j]['t2'],2]);
                connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                              [insertID2[j]['insertID2'],ArrQuestion[j]['t3'],3]);
                connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                              [insertID2[j]['insertID2'],ArrQuestion[j]['t4'],4]);
              }
            });
          
          res.send('/admin/trac-nghiem')
      })
});

router.post('/trac-nghiem-file/dang-bai-trac-nghiem/file',function(req, res, next){
      var storage = multer.diskStorage({ //multers disk storage settings
          destination: function (req, file, cb) {
              cb(null, './uploads/')
          },
          filename: function (req, file, cb) {
              var datetimestamp = Date.now();
              cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
          }
      });

      var upload = multer({ //multer settings
          storage: storage,
          fileFilter : function(req, file, cb) { //file filter
              if(file.originalname.split('.').pop() != 'xlsx'){
                cb(new Error('Không phải file Excel !'))
              } else {
                 cb(null, true);
              }
          }
      }).single('file');
      upload(req,res,function(err){
        if(err){
            req.flash('success_msg','Không phải file Excel !');
            res.redirect('/trac-nghiem/dang-bai-trac-nghiem');
        } else {
                   xlsxj({
            input: req.file.path,
            output: null
        },
          function(err,result){
            if(result.length < 10){
              req.flash('success_msg','File tối thiểu phải 10 câu trắc nghiệm !');
              res.redirect('/trac-nghiem/dang-bai-trac-nghiem');
            } else {

                var p = new Promise(function(resolve, reject) {
                    connection.query('INSERT INTO tracnghiem VALUES(null,?,?,?,?,?,?,?)', 
                      [req.session.idNV,req.body.khoahoc,req.body.baiviet,req.body.level,req.body.TieuDeTN,req.body.Gia,req.body.ThoiGian],
                      function (error, results, fields) { 
                          resolve(results.insertId);
                      });
                });
                p.then(function(insertID) {
                    connection.query("insert into bv_kh_tn values(null,?,?,?)",[req.body.khoahoc,req.body.baiviet,insertID])
                    result.forEach(function(val,key){
                        connection.query(
                            "insert into tracnghiemchitiet values(null,?,1,?,?)",
                            [insertID,val.CauHoi,val.DapAn],
                        function (error, results1, fields){
                          connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                                        [results1.insertId,val.TraLoi1,1]);
                          connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                                        [results1.insertId,val.TraLoi2,2]);
                          connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                                        [results1.insertId,val.TraLoi3,3]);
                          connection.query("insert into tracnghiemtraloi values(null,?,?,?)",
                                        [results1.insertId,val.TraLoi4,4]);
                        });
                    });
                })
            }
        });
        }
    });
  res.redirect('/admin/trac-nghiem');
});


router.get('/khoa-hoc/:alias/:id', function(req, res, next) { 
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  connection.query("SELECT kh.* , n.idNV, n.HoTen , n.Email , n.Aslias_NV, n.GioiThieu as GT, n.HinhNV FROM khoahoc kh LEFT JOIN ( thongtingiangvien tt LEFT JOIN nhanvien n on n.idNV = tt.idNV ) ON kh.idKhoaHoc = tt.idKhoaHoc WHERE kh.idKhoaHoc = ?",[req.params.id], function(error, results, fields) {
        res.render('pages/pageKhoaHoc',{'login' : req.session.idUser,msg : "", data : results});
    });
});

router.get('/khoa-hoc/:khoahoc/:giangvien/:idNV/:idKhoaHoc',function(req, res, next){
      connection.query("SELECT * FROM khoahoc WHERE idKhoaHoc = ?",[req.params.idKhoaHoc],function(error, results, fields){
          connection.query("SELECT * FROM nhanvien WHERE idNV = ?",[req.params.idNV],function(er,nhanvien){
              if(!results[0]){
                results = 0;
              }
              req.session.idUser = req.session.idUser ? req.session.idUser : 0;
              res.render('pages/pageKhoaHocChiTiet',{'login' : req.session.idUser,msg : "", khoahoc : results, nhanvien : nhanvien});
          });
        }
      )
});

router.get('/khoa-hoc/:khoahoc/:level/:giangvien/:idNV/:idKhoaHoc',function(req, res, next){
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  if(req.params.level == 'co-ban'){
    idLevel = " = 1";
  }
  if(req.params.level == 'nang-cao'){
    idLevel = " > 1";
  }
      connection.query("SELECT bv.*,nv.*,k.*,d.Diem,d.SoNguoiDG FROM baiviet bv LEFT JOIN nhanvien nv ON nv.idNV = bv.idNV LEFT JOIN khoahoc k ON k.idKhoaHoc = bv.idKhoaHoc LEFT JOIN danhgia d ON d.idBaiViet = bv.idBaiViet WHERE bv.idKhoaHoc = ? AND bv.idLevel "+idLevel+" AND bv.idNV = ? ",
                        [req.params.idKhoaHoc,req.params.idNV],
                      function(error, results, fields){
                        if(!results[0]){
                          results = 0;
                        } else {
                          results.forEach(function(val,key){
                            val.trangthaimua = 0;
                          })
                        }
                        connection.query("SELECT * FROM mua join chitietmua ct on ct.idMua = mua.idMua WHERE mua.idUser = ?",[req.session.idUser],function(sas,mua){
                          if(!mua[0]){
                            mua = 0;
                          } else if(results[0]) {
                              results.forEach(function(val,key){
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
                          res.render('pages/pageKhoaHocList',{'login' : req.session.idUser,msg : "", data : results})
                        });
                      }
      );
})

router.get('/bai-giang/:aslias/:idBaiViet',function(req, res, next){
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  connection.query("UPDATE baiviet SET LuotXem = LuotXem + 1 WHERE idBaiViet = ? ",[req.params.idBaiViet]);
  connection.query("SELECT * FROM baiviet WHERE idBaiViet = ?", [req.params.idBaiViet],function(error, results, fields){
      res.render('pages/pageBaiViet',{'login' : req.session.idUser,msg : "", data : results, idUser: req.session.idUser});
  });
});

router.get('/ajaxLoadBaiViet/Key-Ajax-SHA1/:id',function(req, res, next){
  id = req.params.id;
  html = "";
  connection.query("select idBaiViet, TenBaiViet from baiviet where idKhoaHoc = ? ",[id],function(error,results, fields){
    results.forEach(function(val,key){
      html += '<option value="'+val.idBaiViet+'">'+val.TenBaiViet+'</option>';
    })
    res.send(html);
  })
})
router.get('/ajaxLoadTracNghiem/Key-Ajax-SHA1/:id',function(req, res, next){
  id = req.params.id;
  html = "";
  connection.query("select * from bv_kh_tn as bv join tracnghiem as t on t.idTracNghiem = bv.idTracNghiem where bv.idBaiViet = ? ",[id],function(error,results, fields){
    if(results != '')
    results.forEach(function(val,key){
      html += '<div class="titleBH">';
      html +='<button type="button" class="input-btn tn-link" onclick="mua_tn(this)">Bài trắc nghiệm số '+key+'</button>';
      html +='<button type="button" class="input-btn tn-link" style="display: none; background : #5cb85c;" >'+val.TieuDeTN+'</button></div>';
    })
    else{
      html +="<h4> Hiện tại bài viết này chưa có bài trắc nghiệm ! </h4>"
    }
    res.send(html);
  })
})

router.get('/mua-bai-giang/:id',function(req,res){
  if(!req.session.idUser){
    res.redirect('/dang-nhap');
  }
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  connection.query("SELECT * FROM baiviet join nhanvien on nhanvien.idNV = baiviet.idNV WHERE idBaiViet = ?",[req.params.id],function(er,data){
    res.render("pages/muaBaiGiang",{'login' : req.session.idUser,data : data});
  });
});

router.post('/mua-bai-giang/:id',function(req,res){
  date = new Date();
  date = dateFormat(date,"yyyy-mm-dd")
  code = req.body.code ? req.body.code : 0;
  connection.query("INSERT INTO mua VALUES (null,?,?,?,?,?,?,?)", 
      [req.session.idUser,req.body.ten,req.body.email,req.body.diachi,req.body.phone,req.body.cmnd,code],function(er,data){
          connection.query("INSERT INTO chitietmua VALUES(null,?,?,?,?,?,?,?)",
            [data.insertId,req.body.idBaiViet,0,0,date,req.body.gia,0]);
            req.flash('success_msg',' Yêu cầu đăng ký của bạn đã được gởi. Bạn cần chuyển chi phí cho chúng tôi theo thông tin dưới đây để hoàn tất việc tham gia khóa học. !');
            res.redirect('/mua-bai-giang/'+req.body.idBaiViet);
      })
});

router.get('/tai-khoan',function(req,res){
  if(!req.session.idUser){
    res.redirect('/dang-nhap');
  } else {
    connection.query("SELECT * FROM user WHERE idUser = "+req.session.idUser,function(er,data){
      connection.query("SELECT * FROM mua JOIN chitietmua ct ON ct.idMua = mua.idMua join baiviet b on b.idBaiViet = ct.idBaiViet WHERE idUser ="+data[0].idUser,function(e,v){
        v = v[0] ? v : 0 ;
        connection.query("SELECT * FROM diemtracnghiem d join tracnghiem t on t.idTracNghiem = d.idTracNghiem join chitietmua ct on ct.idTracNghiem = d.idTracNghiem WHERE d.idUser = ?",
          [req.session.idUser],function(er,tracnghiem){
            tracnghiem = tracnghiem[0] ? tracnghiem : 0;
            res.render("pages/taiKhoan",{'login' : req.session.idUser,data : data, mua : v, tracnghiem : tracnghiem});
          });
      });
    });
  }
})

router.get('/tai-khoan/thong-tin',function(req,res){
  if(!req.session.idUser){
    res.redirect('/dang-nhap');
  } else {
    connection.query("SELECT * FROM user WHERE idUser = "+req.session.idUser,function(er,data){
      res.render("pages/taiKhoanUpdate",{'login' : req.session.idUser,data : data});
    });
  }
})
router.post('/tai-khoan/thong-tin',function(req,res){
  connection.query("UPDATE user set HoTen = ? , Phone = ? , DiaChi = ? , GioiTinh = ? , NgaySinh = ? WHERE idUser = ?",
    [req.body.hoten, req.body.phone, req.body.diachi, req.body.gioitinh, req.body.ngaysinh,req.body.id]);
      req.flash('success_msg','Cập nhật thành công !');
      res.redirect('/tai-khoan/thong-tin');
});

router.get('/tai-khoan/doi-mat-khau',function(req,res){
  if(!req.session.idUser){
    res.redirect('/dang-nhap');
  } else {
    connection.query("SELECT * FROM user WHERE idUser = "+req.session.idUser,function(er,data){
      res.render("pages/doiMatKhau",{'login' : req.session.idUser,data : data});
    });
  }
});
router.post('/tai-khoan/doi-mat-khau',function(req,res){
  if(req.body.new_pass != req.body.re_new_pass){
    req.flash('success_msg','Mật khẩu nhập lại không đúng !');
    res.redirect('/tai-khoan/doi-mat-khau');
  } else {
    connection.query("SELECT SHA1(?) as old_pass ",[req.body.old_pass],function(er,old_pass){
      if(old_pass[0].old_pass != req.body.pass){
        req.flash('success_msg','Mật khẩu cũ không đúng !');
        res.redirect('/tai-khoan/doi-mat-khau');
      } else {
          connection.query("UPDATE user set MatKhau = SHA1(?) WHERE idUser = ?",
          [req.body.new_pass ,req.body.id]);
            req.flash('success_msg','Cập nhật thành công !');
            res.redirect('/tai-khoan/doi-mat-khau');
      }
    });
  }
});

router.get('/mua-trac-nghiem/:id',function(req,res){
  if(!req.session.idUser){
    res.redirect('/dang-nhap');
  }
  req.session.idUser = req.session.idUser ? req.session.idUser : 0;
  connection.query("SELECT * FROM tracnghiem join nhanvien on nhanvien.idNV = tracnghiem.idNV WHERE idTracNghiem = ?",[req.params.id],function(er,data){
    res.render("pages/muaTracNghiem",{'login' : req.session.idUser,data : data});
  });
});

router.post('/mua-trac-nghiem/:id',function(req,res){
  date = new Date();
  date = dateFormat(date,"yyyy-mm-dd")
  code = req.body.code ? req.body.code : 0;
  connection.query("INSERT INTO mua VALUES (null,?,?,?,?,?,?,?)", 
      [req.session.idUser,req.body.ten,req.body.email,req.body.diachi,req.body.phone,req.body.cmnd,code],function(er,data){
          connection.query("INSERT INTO chitietmua VALUES(null,?,?,?,?,?,?,?)",
            [data.insertId,0,0,req.body.idTracNghiem,date,req.body.gia,0]);
            connection.query("INSERT INTO diemtracnghiem VALUES(null,?,?,?,?)",[req.session.idUser,req.body.idTracNghiem,0,date]);
            req.flash('success_msg',' Yêu cầu đăng ký của bạn đã được gởi. Bạn cần chuyển chi phí cho chúng tôi theo thông tin dưới đây để hoàn tất việc tham gia khóa học. !');
            res.redirect('/mua-trac-nghiem/'+req.body.idTracNghiem);
      })
});
module.exports = router;
