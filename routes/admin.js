var express = require('express');
var router = express.Router();

//MySQL load
var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit: 5,
	host: 'eonse.iptime.org',
	user: 'user',
	database: 'project',
	password: '1234123409Eon'
});

//이미지 저장을 위해 필요한 변수들.
var multer = require("multer");
let path = require("path");
let image_name;
let storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, "upload/")
	},
	filename: function(req, file, callback) {
		let extension = path.extname(file.originalname);
		basename = path.basename(file.originalname, extension);
		let date = Date.now();
		callback(null, basename + "-" + date + extension);
		image_name = basename + "-" + date + extension;
	}
});
var upload = multer({
	storage: storage
})

/* GET /admin/login */
router.get('/login', function(req, res, next) {
	res.render('admin_login', { title: 'Administrator Login' });
});
/* POST /admin/login */
router.post('/login', function(req, res, next) {
	var user_id = req.body.user_id;
	var user_pw = req.body.user_pw;

	pool.getConnection(function(err,connection) {
		sql = "select idx, admin_user from user_table where user_id=? AND user_pw=? AND admin_user=1"
		connection.query(sql,[user_id,user_pw], function(err,result) {
			console.log(result);
			if (err) console.error(err);

			if(result.length > 0) {
				console.log('관리자 로그인: 아이디:[%s], 패스워드:[%s]가 일치하는 관리자 찾음.', user_id, user_pw);
				res.redirect('/admin/main');
			}
			else {
				console.log('관리자 로그인: 일치하는 사용자를 찾지 못함.');
				res.send("<script>alert('관리자가 아니거나, 아이디 또는 패스워드가 일치하지 않습니다.');history.back();</script>");
			}
			connection.release();
		});
	});
});

router.get('/main', function(req, res, next) {
	res.render('admin_main', { title: 'Administrator Main' });
});

/* GET /admin/login */
router.get('/addItem', function(req, res, next) {
	res.render('admin_addItem', { title: 'Administrator addItem' });
});

//글쓰기 로직 처리 post + 이미지 업로드 처리
router.post('/addItem', upload.single("imgFile"), function(req,res, next){
	var item_name = req.body.item_name;
	var item_price = req.body.item_price;
	var item_stock = req.body.item_stock;
	var item_brand = req.body.item_brand;
	var item_content = req.body.item_content;
	var item_category = req.body.item_category;
	let file = req.file
	var datas

	if (file == undefined) { //파일을 업로드 안하는 경우.
		no_name="0" //파일이 없을때는 0으로 파일명을 설정
		datas = [item_name,item_price,item_stock,item_brand,item_content,item_category,no_name];
	}
	else { //파일을 업로드하는 경우
		let result = {
			originalName : file.originalname,
			size : file.size,
		}
		datas = [item_name,item_price,item_stock,item_brand,item_content,item_category,image_name];
	}
	pool.getConnection(function (err, connection) {
		var sql = "insert into item_table(item_name,item_price,item_stock,item_brand,item_content,item_category,item_image) values(?,?,?,?,?,?,?)";
		connection.query(sql,datas,function(err,rows) {
			if (err) console.error("err : " + err);
			else {
				console.log("ADD NEW ITEM in MySQL using ADMIN accountL");
				res.redirect('/admin/main');
			}
			connection.release();
		});
	});
});

router.get('/list/:page', function(req,res,next){
	pool.getConnection(function (err, connection) {
		//use the connection
		var sqlForSelectList = "SELECT item_idx, item_name, item_price, item_stock, item_accum_sell, item_hit FROM item_table";
		connection.query(sqlForSelectList, function (err, rows) {
			if (err)
				console.error("err : " + err);
			console.log("rows : " + JSON.stringify(rows));
			res.render('list', {title: '현재 아이템 리스트', rows:rows});
			connection.release();
		});
	});
});

router.get('/list', function(req,res,next) {
	//all list redirect if connected to item_table/
	res.redirect('/admin/list/1');
});

//글조회 로직 처리 GET
router.get('/read/:item_idx', function(req,res,next) {
	var item_idx = req.params.item_idx;

	pool.getConnection(function(err,connection) {
		var sql = "select item_idx, item_name, item_price, item_stock, item_brand, item_content, item_category, item_hit, item_accum_sell, item_image from item_table where item_idx=?";
		connection.query(sql,[item_idx],function(err,row) {
			if(err) console.error(err);
			console.log("1개 제품 조회 결과 확인 : ", row);
			res.render('read',{title:"제품 조회", row:row[0]});
			//조회수 증가.
			sql = "UPDATE item_table SET item_hit = item_hit+1 WHERE item_idx = ?;";
			connection.query(sql,[item_idx],function(err,row) {
				if(err) console.error(err);
				console.log("조회수 증가 err.");
			});
			connection.release();
		});
	});
});

//글수정 화면 표시 GET
router.get('/update', function(req,res,next) {
	var item_idx = req.query.item_idx;

	pool.getConnection(function(err,connection) {
		if(err) console.error("커넥션 객체 얻어오기 에러: ", err);

		var sql = "select item_idx, item_name, item_price, item_stock, item_brand, item_content, item_category, item_hit, item_accum_sell, item_image from item_table where item_idx=?";
		connection.query(sql, [item_idx], function(err,rows) {
			if(err) console.error(err);
			console.log("update에서 1개 글 조회 결과 확인: ", rows);
			res.render('update', {title:"제품 수정하기", row:rows[0]});
			connection.release();
		});
	});
});

//글수정 로직 처리 POST
router.post('/update', upload.single("imgFile"), function(req,res,next) {
	var item_idx = req.body.item_idx;
	var item_name = req.body.item_name;
	var item_price = req.body.item_price;
	var item_stock = req.body.item_stock;
	var item_brand = req.body.item_brand;
	var item_content = req.body.item_content;
	var item_category = req.body.item_category;

	var file = req.file
	var datas;
	var sql;

	if (file == undefined) { //파일을 업로드 안하는 경우.
		console.log("업데이트에 파일을 업로드안함.");
		//수정할 때는 파일을 업로드를 하지 않으면 기존의 파일을 연결함.
		datas = [item_name,item_price,item_stock,item_brand,item_content,item_category,item_idx];
		sql = "UPDATE item_table SET item_name=?, item_price=?, item_stock=?, item_brand=?, item_content=?, item_category=? WHERE item_idx=?";

	}
	else { //파일을 업로드하는 경우
		console.log("업데이트에 파일을 업로드함.");
		let result = {
			originalName : file.originalname,
			size : file.size,
		}
		datas = [item_name,item_price,item_stock,item_brand,item_content,item_category,item_image,item_idx];
		sql = "UPDATE item_table SET item_name=?, item_price=?, item_stock=?, item_brand=?, item_content=?, item_category=?, item_image=? WHERE item_idx=?";
	}
	pool.getConnection(function(err,connection) {
		connection.query(sql,datas, function(err,result) {
			console.log(result);
			if (err) console.error(err);

			if (result.affectedRows == 0) {
				console.log("글 수정: 비밀번호 불일치 or 잘못된 요청");
				res.send("<script>alert('잘못된 요청으로 인해 값이 변경되지 않았습니다.');history.back();</script>");
			}
			else {
				console.log("글 수정: 정상적으로 처리됨.");
				res.redirect('/admin/read/'+item_idx);
			}
			connection.release();
		});
	});
});

//글삭제 로직 처리 POST
router.post('/delete', function(req,res,next) {
	var item_idx = req.body.item_idx;
	var user_id = req.body.user_id;
	var user_pw = req.body.user_pw;

	pool.getConnection(function(err,connection) {
		sql = "select idx from user_table where user_id=? AND user_pw=? AND admin_user=1"
		connection.query(sql,[user_id,user_pw], function(err,result) {
			console.log(result);
			if (err) console.error(err);

			if(result.length > 0) {
				console.log('관리자 로그인: 아이디:[%s], 패스워드:[%s]가 일치하는 관리자 찾음.', user_id, user_pw);

				//로그인을 확인했고 idx의 제품을 삭제 진행
				pool.getConnection(function(err,DELconnection) {
					var sql = "DELETE from item_table WHERE item_idx=?";
					DELconnection.query(sql,[item_idx], function(err,result) {
						console.log(result);
						if (err) console.error(err);

						if (result.affectedRows == 0) {
							console.log("글 삭제: 비밀번호 불일치 or 잘못된 요청");
							res.send("<script>alert('패스워드가 일치하지 않거나, 잘못된 요청으로 인해 삭제되지 않았습니다.');history.back();</script>");
						}
						else {
							console.log("글 삭제: 정상적으로 처리됨.");
							res.redirect('/admin/list');
						}
						DELconnection.release();
					});
				});
			}
			else {
				console.log('관리자 로그인: 일치하는 사용자를 찾지 못함.');
				res.send("<script>alert('관리자가 아니거나, 아이디 또는 패스워드가 일치하지 않습니다.');history.back();</script>");
			}
			connection.release();

		});
	});
});


module.exports = router;
