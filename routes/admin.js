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

/* GET home page. */
router.get('/login', function(req, res, next) {
  res.render('admin_login', { title: 'Administrator Login' });
});


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


module.exports = router;
